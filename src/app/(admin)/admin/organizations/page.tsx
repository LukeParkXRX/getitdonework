import { createServerSupabaseClient } from "@/lib/supabase/server";
import OrganizationsAdminClient, { type OrganizationRecord } from "./OrganizationsAdminClient";

async function fetchOrganizations(): Promise<OrganizationRecord[]> {
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, slug, program_name, logo_url, invite_code, total_credits, created_at")
    .order("created_at", { ascending: false });

  const { data: members } = await db
    .from("users")
    .select("org_id")
    .not("org_id", "is", null);

  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    const orgId = m.org_id as string;
    counts.set(orgId, (counts.get(orgId) ?? 0) + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (orgs ?? []).map((o: any): OrganizationRecord => ({
    id: o.id,
    name: o.name ?? "",
    slug: o.slug ?? "",
    programName: o.program_name ?? "",
    logoUrl: o.logo_url ?? undefined,
    inviteCode: o.invite_code ?? "",
    totalCredits: o.total_credits ?? 0,
    memberCount: counts.get(o.id) ?? 0,
    createdAt: o.created_at ?? "",
  }));
}

export default async function AdminOrganizationsPage() {
  const orgs = await fetchOrganizations();
  return <OrganizationsAdminClient initial={orgs} />;
}
