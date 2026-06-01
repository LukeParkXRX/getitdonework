// 회사/법인 정보 단일 출처.
// 미국 법인 = 전문가(Enabler) 정산·세무(W-9/1099)·인보이스 발행 주체.
// 값 출처: 런치 대시보드 체크리스트의 미국 파트너 입력(항목 1.1~1.6, 4.1~4.4).
// ⚠️ 법인명 철자(Saguoia)·EIN 등은 법적 정보이므로 변경 시 파트너 확인 필수.

export const US_ENTITY = {
  brand: "Get It Done at Work",
  legalName: "Saguoia LLC",
  ein: "99-1776916", // 입력값 991776916 → EIN 표기 형식
  address: "8201 Greensboro Dr., STE 715, McLean, VA 22102",
  state: "Virginia",
  signer: "WOOSUB Lee, Managing Partner",
  website: "getitdonework.com",
} as const;

// 운영 이메일 (체크리스트 4.1~4.4 — 현재 모두 admin@ 로 라우팅)
export const COMPANY_EMAILS = {
  support: "admin@getitdonework.com",
  legal: "admin@getitdonework.com",
  payouts: "admin@getitdonework.com",
  noReply: "noreply@send.getitdonework.com",
} as const;
