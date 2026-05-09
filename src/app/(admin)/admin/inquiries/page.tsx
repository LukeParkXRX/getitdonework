import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import InquiriesAdminClient from "./InquiriesAdminClient";

export type InquiryRow = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  inquiry_type: string | null;
  message: string;
  status: string;
  created_at: string;
};

export default async function InquiriesAdminPage() {
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
    .from("contact_inquiries")
    .select("id, name, company, email, inquiry_type, message, status, created_at")
    .order("created_at", { ascending: false });

  const inquiries: InquiryRow[] = (raw ?? []) as InquiryRow[];

  return <InquiriesAdminClient inquiries={inquiries} />;
}
