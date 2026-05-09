import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewReportsClient from "./ReviewReportsClient";

async function getAdminOrRedirect() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") redirect("/");
  return user.id;
}

export type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  reporter: { id: string; full_name: string | null; email: string | null } | null;
  review: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    hidden_at: string | null;
    report_count: number;
    author: { id: string; full_name: string | null } | null;
    target: { id: string; full_name: string | null } | null;
  } | null;
};

export type Stats = {
  pending: number;
  resolvedThisWeek: number;
};

export default async function ReviewReportsPage() {
  await getAdminOrRedirect();

  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    return (
      <div style={{ color: "var(--color-error, #ef4444)", padding: 32 }}>
        서비스 설정 오류: SUPABASE_SERVICE_ROLE_KEY를 확인하세요.
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const { data: allReports } = await dbAny
    .from("review_reports")
    .select(
      `
      id,
      reason,
      details,
      status,
      created_at,
      resolved_at,
      reporter:reporter_id ( id, full_name, email ),
      review:review_id (
        id,
        rating,
        comment,
        created_at,
        hidden_at,
        report_count,
        author:author_id ( id, full_name ),
        target:target_id ( id, full_name )
      )
    `
    )
    .order("created_at", { ascending: false });

  const reports = (allReports ?? []) as ReportRow[];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const stats: Stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    resolvedThisWeek: reports.filter(
      (r) =>
        (r.status === "resolved" || r.status === "dismissed") &&
        r.resolved_at &&
        r.resolved_at >= sevenDaysAgo
    ).length,
  };

  return <ReviewReportsClient initialReports={reports} stats={stats} />;
}
