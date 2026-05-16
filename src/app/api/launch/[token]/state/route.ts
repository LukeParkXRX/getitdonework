import { NextResponse } from "next/server";
import { verifyLaunchToken } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { token } = await params;

  if (!verifyLaunchToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createUntypedAdminClient();

  const [checklistResult, updatesResult] = await Promise.all([
    supabase
      .from("launch_checklist_items")
      .select("*")
      .order("category_order", { ascending: true })
      .order("item_order", { ascending: true }),
    supabase
      .from("launch_updates")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (checklistResult.error) {
    return NextResponse.json(
      { error: checklistResult.error.message },
      { status: 500 }
    );
  }
  if (updatesResult.error) {
    return NextResponse.json(
      { error: updatesResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    checklist: checklistResult.data,
    updates: updatesResult.data,
  });
}
