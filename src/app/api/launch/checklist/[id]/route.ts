import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  is_complete?: boolean;
  notes?: string;
  value?: string;
  completed_by?: string;
}

function extractEmail(req: Request): string {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const email = extractEmail(req);

  if (!verifyLaunchEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createUntypedAdminClient();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.is_complete === "boolean") {
    updatePayload.is_complete = body.is_complete;
    updatePayload.completed_at = body.is_complete
      ? new Date().toISOString()
      : null;
    updatePayload.completed_by = body.is_complete
      ? (body.completed_by ?? null)
      : null;
  }
  if (typeof body.notes === "string") {
    updatePayload.notes = body.notes;
  }
  if (typeof body.value === "string") {
    updatePayload.value = body.value;
  }

  const { data, error } = await supabase
    .from("launch_checklist_items")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
