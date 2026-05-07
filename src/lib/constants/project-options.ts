export const CATEGORIES = [
  "GTM 전략",
  "IR / 투자유치",
  "시장조사",
  "파트너십 구축",
  "제품 현지화",
  "엔터프라이즈 세일즈",
  "기타",
];

export const DURATIONS = ["1주", "2주", "1개월", "3개월", "6개월"];

export const BUDGETS = [
  "1-3 크레딧",
  "3-5 크레딧",
  "5-10 크레딧",
  "10+ 크레딧 (별도 협의)",
];

export const REQUIREMENTS = [
  "MBA 졸업",
  "미국 현지 경험 3년+",
  "한국어 가능",
  "특정 산업 전문가",
  "투자 네트워크 보유",
  "기업 미팅 주선 가능",
];

export const PROJECT_STATUSES = [
  "draft",
  "open",
  "matched",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
