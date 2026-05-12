/**
 * 사용자 활동 로그 기록 helper.
 * service role 클라이언트 또는 anon 클라이언트 모두 허용.
 * RLS INSERT는 service role만 가능하므로 API route에서는 createAdminClient 사용 권장.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logUserActivity(
  supabase: any,
  userId: string,
  activityType: string,
  req?: Request,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const ipAddress =
      req?.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req?.headers.get("x-real-ip") ??
      null;
    const userAgent = req?.headers.get("user-agent") ?? null;

    await supabase.from("user_activity_log").insert({
      user_id: userId,
      activity_type: activityType,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata ?? null,
    });
  } catch (e) {
    // 로그 실패는 주 흐름을 막지 않음
    console.warn("logUserActivity failed", e);
  }
}

// ── UA 파싱 ────────────────────────────────────────────────────────────────────

export function parseDeviceFromUA(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Mobile")) return "Mobile";
  if (ua.includes("Tablet")) return "Tablet";
  return "Desktop";
}

export function parseBrowserFromUA(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Edg")) return "Edge";   // Edge는 Chrome UA도 포함하므로 먼저 체크
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}
