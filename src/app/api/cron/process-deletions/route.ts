import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const { data: pending, error: fetchError } = await dbAny
    .from("account_deletion_requests")
    .select("id, user_id")
    .lt("scheduled_for", new Date().toISOString())
    .is("cancelled_at", null)
    .is("completed_at", null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const rows = (pending ?? []) as Array<{ id: string; user_id: string }>;
  let deleted = 0;
  const failures: string[] = [];

  for (const row of rows) {
    try {
      // auth.users 삭제 — users 테이블 CASCADE로 자동 삭제
      const { error: authError } = await db.auth.admin.deleteUser(row.user_id);
      if (authError) {
        failures.push(`${row.user_id}: ${authError.message}`);
        continue;
      }

      // completed_at 기록 (CASCADE로 users row가 삭제되면 이 row도 사라지지만,
      // 삭제 전에 completed_at을 기록해 두면 로그 확인 가능)
      await dbAny
        .from("account_deletion_requests")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", row.id);

      deleted++;
    } catch (err) {
      failures.push(`${row.user_id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json({ deleted, failures, total: rows.length });
}
