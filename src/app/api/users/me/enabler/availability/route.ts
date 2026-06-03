import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAYS)[number];

type DaySlot = { enabled: boolean; slots: string[] };
type DateOverride = { enabled: boolean; slots?: string[] };
type Availability = {
  weekly: Record<DayKey, DaySlot>;
  timezone: string;
  notes: string;
  dateOverrides: Record<string, DateOverride>;
};

const SLOT_PATTERN = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validate(body: unknown): { ok: true; data: Availability } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "body는 객체여야 합니다." };
  const b = body as Record<string, unknown>;

  const weekly = b.weekly;
  if (!weekly || typeof weekly !== "object") return { ok: false, error: "weekly가 누락되었습니다." };

  const w = weekly as Record<string, unknown>;
  const cleanWeekly = {} as Record<DayKey, DaySlot>;
  for (const day of DAYS) {
    const d = w[day];
    if (!d || typeof d !== "object") return { ok: false, error: `weekly.${day}가 누락되었습니다.` };
    const dd = d as Record<string, unknown>;
    const enabled = dd.enabled;
    const slots = dd.slots;
    if (typeof enabled !== "boolean") return { ok: false, error: `weekly.${day}.enabled는 boolean이어야 합니다.` };
    if (!Array.isArray(slots) || slots.some((s) => typeof s !== "string")) {
      return { ok: false, error: `weekly.${day}.slots는 문자열 배열이어야 합니다.` };
    }
    const filtered = (slots as string[]).map((s) => s.trim()).filter((s) => s.length > 0);
    for (const s of filtered) {
      if (!SLOT_PATTERN.test(s)) {
        return { ok: false, error: `weekly.${day}: 슬롯 형식이 잘못되었습니다 (HH:MM-HH:MM): ${s}` };
      }
    }
    cleanWeekly[day] = { enabled, slots: enabled ? filtered : [] };
  }

  const timezone = typeof b.timezone === "string" ? b.timezone : "Asia/Seoul";
  const notes = typeof b.notes === "string" ? b.notes.slice(0, 300) : "";

  // dateOverrides — 선택. 없으면 빈 객체로 저장(하위호환).
  const cleanOverrides: Record<string, DateOverride> = {};
  const overridesRaw = b.dateOverrides;
  if (overridesRaw !== undefined) {
    if (!overridesRaw || typeof overridesRaw !== "object" || Array.isArray(overridesRaw)) {
      return { ok: false, error: "dateOverrides는 객체여야 합니다." };
    }
    for (const [key, val] of Object.entries(overridesRaw as Record<string, unknown>)) {
      if (!DATE_PATTERN.test(key)) {
        return { ok: false, error: `dateOverrides: 날짜 키 형식이 잘못되었습니다 (YYYY-MM-DD): ${key}` };
      }
      if (!val || typeof val !== "object") {
        return { ok: false, error: `dateOverrides.${key}는 객체여야 합니다.` };
      }
      const vv = val as Record<string, unknown>;
      if (typeof vv.enabled !== "boolean") {
        return { ok: false, error: `dateOverrides.${key}.enabled는 boolean이어야 합니다.` };
      }
      if (vv.enabled) {
        const rawSlots = vv.slots;
        if (rawSlots !== undefined && (!Array.isArray(rawSlots) || rawSlots.some((s) => typeof s !== "string"))) {
          return { ok: false, error: `dateOverrides.${key}.slots는 문자열 배열이어야 합니다.` };
        }
        const filtered = (Array.isArray(rawSlots) ? (rawSlots as string[]) : [])
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const s of filtered) {
          if (!SLOT_PATTERN.test(s)) {
            return { ok: false, error: `dateOverrides.${key}: 슬롯 형식이 잘못되었습니다 (HH:MM-HH:MM): ${s}` };
          }
        }
        cleanOverrides[key] = { enabled: true, slots: filtered };
      } else {
        cleanOverrides[key] = { enabled: false };
      }
    }
  }

  return { ok: true, data: { weekly: cleanWeekly, timezone, notes, dateOverrides: cleanOverrides } };
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await db.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "enabler" && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = validate(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    const { data, error } = await db
      .from("enabler_profiles")
      .update({ availability: result.data })
      .eq("user_id", user.id)
      .select("availability")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ availability: data?.availability });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
