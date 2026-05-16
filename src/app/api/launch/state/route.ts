import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

function extractEmail(req: Request): string {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

export async function GET(req: Request) {
  const email = extractEmail(req);

  if (!verifyLaunchEmail(email)) {
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
