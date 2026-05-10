import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AnnouncementsAdminClient from "./AnnouncementsAdminClient";

export type AnnouncementRow = {
  id: string;
  title: string;
  audience: string;
  channel: string;
  status: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
  created_by: string;
  creator_name: string | null;
};

export type OrgOption = {
  id: string;
  name: string;
};

export default async function AnnouncementsAdminPage() {
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

  const { data: raw } = await db
    .from("announcements")
    .select(
      "id, title, audience, channel, status, recipient_count, sent_count, failed_count, created_at, sent_at, created_by, users!announcements_created_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const announcements: AnnouncementRow[] = ((raw ?? []) as {
    id: string;
    title: string;
    audience: string;
    channel: string;
    status: string;
    recipient_count: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    sent_at: string | null;
    created_by: string;
    users: { full_name: string | null } | null;
  }[]).map((r) => ({
    id: r.id,
    title: r.title,
    audience: r.audience,
    channel: r.channel,
    status: r.status,
    recipient_count: r.recipient_count,
    sent_count: r.sent_count,
    failed_count: r.failed_count,
    created_at: r.created_at,
    sent_at: r.sent_at,
    created_by: r.created_by,
    creator_name: r.users?.full_name ?? null,
  }));

  const { data: orgsRaw } = await db
    .from("organizations")
    .select("id, name")
    .order("name", { ascending: true });

  const orgs: OrgOption[] = (orgsRaw ?? []) as OrgOption[];

  return <AnnouncementsAdminClient announcements={announcements} orgs={orgs} />;
}
