import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AvailabilityForm, { type Availability } from "./AvailabilityForm";

const DEFAULT_AVAILABILITY: Availability = {
  weekly: {
    mon: { enabled: false, slots: [] },
    tue: { enabled: false, slots: [] },
    wed: { enabled: false, slots: [] },
    thu: { enabled: false, slots: [] },
    fri: { enabled: false, slots: [] },
    sat: { enabled: false, slots: [] },
    sun: { enabled: false, slots: [] },
  },
  timezone: "Asia/Seoul",
  notes: "",
};

function normalize(raw: unknown): Availability {
  if (!raw || typeof raw !== "object") return DEFAULT_AVAILABILITY;
  const r = raw as Record<string, unknown>;
  const weeklyRaw = (r.weekly && typeof r.weekly === "object") ? r.weekly as Record<string, unknown> : {};
  const weekly = { ...DEFAULT_AVAILABILITY.weekly };
  for (const k of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const) {
    const d = weeklyRaw[k];
    if (d && typeof d === "object") {
      const dd = d as Record<string, unknown>;
      weekly[k] = {
        enabled: Boolean(dd.enabled),
        slots: Array.isArray(dd.slots) ? (dd.slots as unknown[]).filter((s): s is string => typeof s === "string") : [],
      };
    }
  }
  return {
    weekly,
    timezone: typeof r.timezone === "string" && r.timezone ? r.timezone : "Asia/Seoul",
    notes: typeof r.notes === "string" ? r.notes : "",
  };
}

export default async function AvailabilityPage() {
  await requireRole(["enabler", "super_admin"], "/");

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await db
    .from("enabler_profiles")
    .select("availability")
    .eq("user_id", user.id)
    .single();

  const availability = normalize(data?.availability);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: 700,
            margin: 0,
            marginBottom: "8px",
          }}>
            Set your availability
          </h1>
          <p style={{ color: "var(--color-dim)", fontSize: "14px", margin: 0 }}>
            Set the days and time ranges when startups can book you. Times are in your timezone.
          </p>
        </div>
        <AvailabilityForm initial={availability} />
      </div>
    </div>
  );
}
