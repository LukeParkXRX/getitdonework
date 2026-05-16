import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  resolved: boolean;
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

  if (typeof body.resolved !== "boolean") {
    return NextResponse.json({ error: "resolved must be boolean" }, { status: 400 });
  }

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("launch_updates")
    .update({ resolved: body.resolved })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ update: data });
}
