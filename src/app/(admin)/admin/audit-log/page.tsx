import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AuditLogClient from "./AuditLogClient";

export type AuditLogRow = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; target_type?: string; actor_id?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (me?.role !== "super_admin") redirect("/");

  const filters = await searchParams;

  let query = db
    .from("admin_audit_log")
    .select(
      `id, actor_id, action, target_type, target_id, metadata, created_at,
       actor:actor_id ( full_name, email )`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.target_type) query = query.eq("target_type", filters.target_type);
  if (filters.actor_id) query = query.eq("actor_id", filters.actor_id);

  const { data: raw } = await query;

  const logs: AuditLogRow[] = (raw ?? []) as AuditLogRow[];

  return <AuditLogClient logs={logs} />;
}
