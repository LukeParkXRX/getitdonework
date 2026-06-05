/**
 * 런칭 대시보드 이메일 화이트리스트 인증 헬퍼
 * 등록된 이메일 목록과 비교해 접근을 허용합니다.
 */

const FALLBACK_ALLOWED = ["admin@getitdonework.com", "luke@xrx.studio"];

export function getAllowedEmails(): string[] {
  const raw = process.env.LAUNCH_DASHBOARD_ALLOWED_EMAILS ?? "";
  const parsed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : FALLBACK_ALLOWED;
}

export function verifyLaunchEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;
  return getAllowedEmails().includes(normalized);
}
