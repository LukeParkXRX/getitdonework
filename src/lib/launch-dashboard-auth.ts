/**
 * 런칭 대시보드 토큰 검증 헬퍼
 * URL에 포함된 secret token을 환경변수와 비교합니다.
 */

export function verifyLaunchToken(token: string): boolean {
  const expected = process.env.LAUNCH_DASHBOARD_TOKEN;
  if (!expected || expected.length === 0) return false;
  return token === expected;
}
