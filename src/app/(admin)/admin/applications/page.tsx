import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ApplicationsAdminClient from "./ApplicationsAdminClient";

export type ApplicationRow = {
  id: string;
  name: string;
  email: string;
  university: string | null;
  degree_type: string | null;
  location: string | null;
  photo_url: string | null;
  resume_file_path: string | null;
  resume_file_name: string | null;
  linkedin_url: string | null;
  specialties: string[] | null;
  bio: string | null;
  credit_rate: number | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
};

export default async function ApplicationsAdminPage() {
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
    .from("enabler_applications")
    .select(
      "id, name, email, university, degree_type, location, photo_url, resume_file_path, resume_file_name, linkedin_url, specialties, bio, credit_rate, status, reviewed_by, reviewed_at, notes, created_at"
    )
    .order("status", { ascending: true }) // pending이 알파벳 뒤쪽이라 추후 client에서 정렬
    .order("created_at", { ascending: false });

  const applications: ApplicationRow[] = (raw ?? []) as ApplicationRow[];

  return <ApplicationsAdminClient applications={applications} />;
}
