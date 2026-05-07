import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CreditPackagesAdminClient, { type CreditPackage } from "./CreditPackagesAdminClient";

export const metadata = {
  title: "결제 패키지 관리 — Get It Done at Work",
};

export default async function CreditPackagesAdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "super_admin") redirect("/");

  const { data: packages } = await db
    .from("credit_packages")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <CreditPackagesAdminClient
      initialPackages={(packages ?? []) as CreditPackage[]}
    />
  );
}
