import { NextResponse } from "next/server";
import { verifyLaunchToken } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ token: string; id: string }>;
}

interface PatchBody {
  resolved: boolean;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { token, id } = await params;

  if (!verifyLaunchToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
