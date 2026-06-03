// 타임존 유틸 — 외부 의존성 없이 Intl 만 사용.
// 핵심 난제: "특정 IANA 타임존에서의 벽시계 시각(YYYY-MM-DD HH:MM)"에 해당하는
// 정확한 UTC 순간을 구하는 것. native parser 가 없어 offset 보정 기법을 쓴다.

// 주어진 UTC 순간을, 대상 타임존의 벽시계 구성요소로 분해.
function partsInTz(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  return map as {
    year: number; month: number; day: number;
    hour: number; minute: number; second: number;
  };
}

// 대상 타임존이 주어진 순간에 가진 UTC offset(ms). (벽시계로 본 시각 - 실제 UTC)
function tzOffsetMs(date: Date, timeZone: string): number {
  const p = partsInTz(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

/**
 * 특정 타임존의 벽시계 시각 → UTC Date.
 * 예: zonedTimeToUtc(2026, 6, 3, 9, 0, "America/New_York") → 그날 뉴욕 09:00 의 UTC 순간.
 * offset 을 두 번 적용해 DST 경계도 대부분 정확히 처리.
 */
export function zonedTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offset1 = tzOffsetMs(new Date(guess), timeZone);
  const adjusted = guess - offset1;
  const offset2 = tzOffsetMs(new Date(adjusted), timeZone);
  // offset 이 바뀌었다면(DST 전환) 2차 보정값을 사용
  return new Date(guess - offset2);
}

// 사람이 읽는 형식으로 특정 타임존에서 포맷.
export function formatInTz(
  date: Date,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions,
  locale = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, { timeZone, ...opts }).format(date);
}

// 짧은 타임존 약어(예: KST, EST) — 없으면 IANA 명 일부 폴백.
export function tzAbbrev(date: Date, timeZone: string, locale = "en-US"): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

// 브라우저(또는 서버)의 IANA 타임존.
export function resolveTimeZone(fallback = "Asia/Seoul"): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

// ── 예약 가능 슬롯 생성 ───────────────────────────────────────────────────────
// 전문가 가용시간(요일별 "HH:MM-HH:MM" 범위, 전문가 타임존 기준)을
// 다가오는 날짜별 예약 슬롯으로 변환한다. 각 슬롯은 정확한 UTC 순간 + 양쪽 표기.

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // getDay() 0=Sun

export interface AvailabilityInput {
  weekly: Partial<Record<DayKey, { enabled: boolean; slots: string[] }>>;
  timezone: string;
  /**
   * 날짜별 예외 (전문가 타임존 기준 "YYYY-MM-DD" 키).
   * enabled:false → 그날 통째 휴무. enabled:true + slots → weekly 무시하고 이 slots 사용.
   * 키가 없으면 weekly 그대로 (하위호환).
   */
  dateOverrides?: Record<string, { enabled: boolean; slots?: string[] }>;
}

export interface BookableSlot {
  utcISO: string; // scheduled_at 으로 전송할 값
  viewerTime: string; // 스타트업(뷰어) 현지 시각 표기
  enablerTime: string; // 전문가 현지 시각 표기
}

export interface SlotDay {
  /** 전문가 현지 기준 날짜 (YYYY-MM-DD) */
  dateKey: string;
  /** 뷰어 기준 날짜 라벨 (그룹 헤더용) */
  viewerDateLabel: string;
  slots: BookableSlot[];
}

const SLOT_RANGE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;

// 전문가 타임존 기준 "오늘"의 Y/M/D
function todayPartsInTz(timeZone: string, now: Date) {
  const p = partsInTz(now, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

export function generateAvailableSlots(
  availability: AvailabilityInput,
  viewerTz: string,
  opts: { days?: number; slotMinutes?: number; leadMinutes?: number; now?: Date } = {},
): SlotDay[] {
  const days = opts.days ?? 21;
  const stepMin = opts.slotMinutes ?? 30;
  const leadMin = opts.leadMinutes ?? 60; // 최소 1시간 뒤부터 예약 가능
  const now = opts.now ?? new Date();
  const enablerTz = availability.timezone || "Asia/Seoul";
  const minMs = now.getTime() + leadMin * 60_000;

  const start = todayPartsInTz(enablerTz, now);
  const result: SlotDay[] = [];

  for (let i = 0; i < days; i++) {
    // 전문가 현지 i일 후 날짜 (UTC 정오 기준으로 날짜만 안전하게 더함)
    const base = new Date(Date.UTC(start.year, start.month - 1, start.day + i, 12));
    const y = base.getUTCFullYear();
    const mo = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const dayKey = DAY_KEYS[base.getUTCDay()];
    const dateKey = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const override = availability.dateOverrides?.[dateKey];
    const cfg = override
      ? (override.enabled ? { enabled: true, slots: override.slots ?? [] } : { enabled: false, slots: [] })
      : availability.weekly[dayKey];
    if (!cfg?.enabled || !cfg.slots?.length) continue;

    const slots: BookableSlot[] = [];
    for (const raw of cfg.slots) {
      const m = SLOT_RANGE.exec(raw.trim());
      if (!m) continue;
      const sH = +m[1], sM = +m[2], eH = +m[3], eM = +m[4];
      const startMin = sH * 60 + sM;
      const endMin = eH * 60 + eM;
      for (let t = startMin; t + stepMin <= endMin; t += stepMin) {
        const utc = zonedTimeToUtc(y, mo, d, Math.floor(t / 60), t % 60, enablerTz);
        if (utc.getTime() < minMs) continue; // 과거/임박 슬롯 제외
        slots.push({
          utcISO: utc.toISOString(),
          viewerTime: formatInTz(utc, viewerTz, { hour: "numeric", minute: "2-digit", hour12: true }),
          enablerTime: formatInTz(utc, enablerTz, { hour: "numeric", minute: "2-digit", hour12: true }),
        });
      }
    }
    if (slots.length === 0) continue;

    const firstUtc = new Date(slots[0].utcISO);
    result.push({
      dateKey,
      viewerDateLabel: formatInTz(firstUtc, viewerTz, { weekday: "short", month: "short", day: "numeric" }),
      slots,
    });
  }

  return result;
}
