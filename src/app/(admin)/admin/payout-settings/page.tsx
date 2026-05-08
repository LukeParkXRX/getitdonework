import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PayoutSettingsClient from "./PayoutSettingsClient";

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
}

export default async function PayoutSettingsPage() {
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

  // 글로벌 설정 (enabler_id IS NULL, effective_to IS NULL)
  const { data: globalSettings } = await dbAny
    .from("payout_settings")
    .select("*")
    .is("enabler_id", null)
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(5);

  // Enabler별 override 설정
  const { data: enablerSettings } = await dbAny
    .from("payout_settings")
    .select(
      `id, enabler_id, platform_fee_pct, credit_rate, min_payout, effective_from, created_at,
       enabler:enabler_id ( id, full_name, email )`
    )
    .not("enabler_id", "is", null)
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(100);

  return (
    <PayoutSettingsClient
      globalSettings={globalSettings ?? []}
      enablerSettings={enablerSettings ?? []}
    />
  );
}
