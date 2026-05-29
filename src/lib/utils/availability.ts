export type TimeSlot = {
  startsAt: Date;
  endsAt: Date;
};

export function toSlot(startsAt: Date, durationMinutes: number): TimeSlot {
  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000),
  };
}

export function hasConflict(a: TimeSlot, b: TimeSlot): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function findConflicts(
  candidate: TimeSlot,
  existing: TimeSlot[],
): TimeSlot[] {
  return existing.filter((slot) => hasConflict(candidate, slot));
}

export function isAvailable(
  candidate: TimeSlot,
  existing: TimeSlot[],
): boolean {
  return findConflicts(candidate, existing).length === 0;
}

// ── 세션 입장 윈도우 정책 ──────────────────────────────────────────────────────
// 입장 허용 시작: 예약 시각 15분 전 / 세션 만료: 예약 시각 90분 후
export const ENTRY_LEAD_MS = 15 * 60 * 1000;
export const SESSION_EXPIRY_MS = 90 * 60 * 1000;

export type EntryVariant = "accent" | "dim" | "amber";

export type EntryStatus = {
  canEnter: boolean;
  label: string;
  variant: EntryVariant;
};

// 예약 시각 기준으로 현재 입장 가능 여부·라벨·색상 variant를 계산한다.
// confirmed 세션의 입장 UI(클라이언트)에서 공통으로 사용.
export function getSessionEntryStatus(scheduledAt: string | null): EntryStatus {
  // 예약 시각이 없으면 즉시 입장 가능
  if (!scheduledAt) return { canEnter: true, label: "지금 입장하기", variant: "accent" };

  const scheduled = new Date(scheduledAt).getTime();
  const now = Date.now();
  const earliest = scheduled - ENTRY_LEAD_MS;
  const latest = scheduled + SESSION_EXPIRY_MS;

  if (now < earliest) {
    const minsUntil = Math.ceil((earliest - now) / 60000);
    if (minsUntil > 60) {
      return { canEnter: false, label: `${Math.floor(minsUntil / 60)}시간 후 입장 가능`, variant: "dim" };
    }
    return { canEnter: false, label: `${minsUntil}분 후 입장 가능`, variant: "amber" };
  }

  if (now > latest) {
    return { canEnter: false, label: "세션 시간 만료", variant: "dim" };
  }

  return { canEnter: true, label: "지금 입장하기", variant: "accent" };
}
