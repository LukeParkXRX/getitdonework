import { createServerSupabaseClient } from "@/lib/supabase/server";
import UsersAdminClient, { type UserRecord } from "./UsersAdminClient";

async function fetchUsers(): Promise<UserRecord[]> {
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: users } = await db
    .from("users")
    .select("id, email, full_name, role, avatar_url, org_id, is_verified, created_at")
    .order("created_at", { ascending: false });

  const { data: orgs } = await db.from("organizations").select("id, name");
  const orgMap = new Map<string, string>((orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (users ?? []).map((u: any): UserRecord => ({
    id: u.id,
    email: u.email ?? "",
    fullName: u.full_name ?? "Unknown",
    role: u.role ?? "startup",
    avatarUrl: u.avatar_url ?? undefined,
    orgId: u.org_id ?? undefined,
    orgName: u.org_id ? orgMap.get(u.org_id) : undefined,
    isVerified: u.is_verified ?? false,
    createdAt: u.created_at ?? "",
  }));
}

export default async function AdminUsersPage() {
  const users = await fetchUsers();
  return <UsersAdminClient initial={users} />;
}
