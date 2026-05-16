import { redirect } from "next/navigation";
import { verifyLaunchToken } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";
import { LaunchDashboard } from "./LaunchDashboard";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";

export default async function LaunchPage({ params }: PageProps) {
  const { token } = await params;

  if (!verifyLaunchToken(token)) {
    redirect("/launch");
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

  if (checklistResult.error || updatesResult.error) {
    redirect("/launch");
  }

  return (
    <LaunchDashboard
      token={token}
      initialChecklist={checklistResult.data ?? []}
      initialUpdates={updatesResult.data ?? []}
    />
  );
}
