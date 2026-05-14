# Get It Done at Work — API Reference

base URL: `https://getitdonework.com/api`

> 상세 구현은 `src/app/api/` 하위 각 `route.ts` 파일을 참조하세요.

## Auth

모든 인증 필요 라우트는 Supabase 세션 쿠키를 사용합니다. 별도 Bearer 토큰 없음.  
role 종류: `super_admin` · `org_admin` · `startup` · `enabler`

---

## Public (인증 불필요)

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| POST | `/api/contact` | `{name, email, company?, inquiryType, message}` | `{ok}` | Rate limit: 5건/시/IP |
| POST | `/api/enabler-applications` | `{name, email, university, bio, creditRate, ...}` | `{id}` | Rate limit: 3건/시/IP |
| POST | `/api/payment-setup` | `{name, email, ...}` | `{ok}` | 결제 사전 등록 |
| GET | `/api/enablers` | — | `{enablers[]}` | 공개 Enabler 목록 |
| GET | `/api/enablers/recommended` | — | `{enablers[]}` | 추천 Enabler |

---

## Authenticated (모든 인증 사용자)

### 알림

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/notifications` | — | `{notifications[]}` | 본인 알림 목록 |
| PATCH | `/api/notifications` | `{ids[]}` or `{all: true}` | `{ok}` | 읽음 처리 |
| DELETE | `/api/notifications/[id]` | — | `{ok}` | 본인 알림만 삭제 |

### 내 계정

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/users/me` | — | `{user}` | 프로필 조회 |
| PATCH | `/api/users/me` | `{full_name?, avatar_url?, ...}` | `{user}` | 프로필 수정 |
| GET | `/api/users/me/data` | — | JSON 파일 다운로드 | GDPR 데이터 내보내기 |
| POST | `/api/users/me/delete` | `{reason?}` | `{scheduled_for}` | 계정 삭제 예약 |
| DELETE | `/api/users/me/delete` | — | `{ok}` | 삭제 예약 취소 |
| GET | `/api/me/terms-status` | — | `{current_version, accepted}` | 약관 동의 상태 |
| POST | `/api/me/terms-accept` | `{terms_version_id}` | `{ok}` | 약관 동의 |
| POST | `/api/me/activity` | `{type, metadata?}` | `{ok}` | 활동 기록 |
| GET | `/api/users/me/onboarding` | — | `{step, completed}` | 온보딩 상태 |
| PATCH | `/api/users/me/onboarding` | `{step}` | `{ok}` | 온보딩 진행 |

### 2FA

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| POST | `/api/auth/2fa/setup` | `{enable: boolean}` | `{ok}` | 2FA 활성화/비활성화 |
| POST | `/api/auth/2fa/send-code` | — | `{challenge_id}` | 인증 코드 발송 |
| POST | `/api/auth/2fa/verify` | `{challenge_id, code}` | `{ok}` | 코드 검증 |

---

## Bookings

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/bookings` | — | `{bookings[]}` | 본인 예약 목록 |
| POST | `/api/bookings` | `{enabler_id, type, scheduled_at, credits_amount}` | `{booking}` | 예약 생성 |
| GET | `/api/bookings/[id]` | — | `{booking}` | 예약 상세 |
| PATCH | `/api/bookings/[id]` | `{status?, scheduled_at?}` | `{booking}` | 예약 수정/취소 |

---

## Reviews

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/reviews` | — | `{reviews[]}` | 리뷰 목록 |
| POST | `/api/reviews` | `{booking_id, rating, comment?}` | `{review}` | 리뷰 작성 |
| GET | `/api/reviews/pending` | — | `{bookings[]}` | 리뷰 미작성 예약 |
| POST | `/api/reviews/[id]/report` | `{reason}` | `{ok}` | 리뷰 신고 |

---

## Disputes

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| POST | `/api/disputes` | `{booking_id, reason, description}` | `{dispute}` | 분쟁 신청 (Rate limit: 3건/시/IP) |

---

## Conversations & Messages

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/conversations` | — | `{conversations[]}` | 대화 목록 |
| POST | `/api/conversations` | `{participant_id}` | `{conversation}` | 대화 시작 |
| GET | `/api/conversations/[id]/messages` | — | `{messages[]}` | 메시지 목록 |
| POST | `/api/conversations/[id]/messages` | `{content}` | `{message}` | 메시지 전송 |
| POST | `/api/conversations/[id]/read` | — | `{ok}` | 읽음 처리 |

---

## Credits

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/credits/balance` | — | `{balance}` | 크레딧 잔액 |
| GET | `/api/credits/transactions` | — | `{transactions[]}` | 크레딧 내역 |
| GET | `/api/credits/settings` | — | `{settings}` | 크레딧 설정 조회 |
| POST | `/api/credits/allocate` | `{user_id, amount, reason?}` | `{ok}` | 크레딧 할당 (org_admin) |
| POST | `/api/credits/grant` | `{user_id, amount, reason?}` | `{ok}` | 크레딧 지급 (super_admin) |
| POST | `/api/org/credits/allocate` | `{user_id, amount}` | `{ok}` | 조직 크레딧 배분 |

---

## Checkout

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| POST | `/api/checkout` | `{package_id}` | `{url}` | Stripe Checkout 세션 생성 (Rate limit: 10건/분/IP) |

---

## Projects

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/projects` | — | `{projects[]}` | 프로젝트 목록 |
| POST | `/api/projects` | `{title, description, ...}` | `{project}` | 프로젝트 생성 |
| GET | `/api/projects/[id]` | — | `{project}` | 프로젝트 상세 |
| PATCH | `/api/projects/[id]` | `{title?, status?, ...}` | `{project}` | 프로젝트 수정 |

---

## Bookmarks

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/bookmarks` | — | `{bookmarks[]}` | 북마크 목록 |
| POST | `/api/bookmarks` | `{enabler_id}` | `{bookmark}` | 북마크 추가 |
| DELETE | `/api/bookmarks` | `{enabler_id}` | `{ok}` | 북마크 삭제 |

---

## Enabler 전용

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/users/me/enabler` | — | `{enabler}` | 내 Enabler 프로필 |
| PATCH | `/api/users/me/enabler` | `{bio?, credit_rate?, ...}` | `{enabler}` | 프로필 수정 |
| GET | `/api/users/me/enabler/availability` | — | `{slots[]}` | 가용 시간 |
| PATCH | `/api/users/me/enabler/availability` | `{slots[]}` | `{ok}` | 가용 시간 수정 |
| GET | `/api/enabler/payout-account` | — | `{account}` | Stripe Connect 계정 상태 |
| POST | `/api/enabler/payout-account` | — | `{ok}` | Connect 계정 생성 |
| POST | `/api/enabler/payout-account/onboarding-link` | — | `{url}` | Connect 온보딩 링크 |
| GET | `/api/enabler/payout-account/refresh` | — | redirect | 온보딩 완료 처리 |
| GET | `/api/admin/payouts/[id]/pdf` | — | PDF 파일 | 인보이스 PDF 다운로드 (본인 or super_admin) |

---

## Organizations

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| GET | `/api/organizations` | — | `{orgs[]}` | 소속 조직 |
| POST | `/api/users/me/startup` | `{company_name, ...}` | `{ok}` | 스타트업 프로필 등록 |

---

## LiveKit

| Method | Path | Body | 응답 | 비고 |
|--------|------|------|------|------|
| POST | `/api/livekit` | `{room, identity}` | `{token}` | 화상 세션 토큰 발급 |

---

## Admin (super_admin 전용)

### 사용자 관리

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/users/[id]` | — | `{user, bookings, earnings, ...}` |
| PATCH | `/api/admin/users/[id]` | `{role?, status?, ...}` | `{user}` |
| DELETE | `/api/admin/users/[id]` | — | `{ok}` |

### Enabler 관리

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/enablers/[id]` | — | `{enabler}` |
| PATCH | `/api/admin/enablers/[id]` | `{verified?, featured?, ...}` | `{enabler}` |

### 지원서 관리

| Method | Path | Body | 응답 |
|--------|------|------|------|
| POST | `/api/admin/applications/[id]` | `{action: "approve"\|"reject", notes?}` | `{ok}` |

### 정산 (Payouts)

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/payouts` | — | `{invoices[]}` |
| GET | `/api/admin/payouts/[id]` | — | `{invoice, earnings[]}` |
| PATCH | `/api/admin/payouts/[id]` | `{action: "approve"\|"cancel", cancel_reason?}` | `{ok, transfer_id?}` |
| POST | `/api/admin/payouts/generate` | `{period_start, period_end?}` | `{invoices[]}` |

> approve 성공 시 Stripe Transfer 실행 + PDF 첨부 이메일 자동 발송

### 분쟁 관리

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/disputes` | — | `{disputes[]}` |
| PATCH | `/api/admin/disputes/[id]` | `{resolution, status}` | `{dispute}` |

### 결제 승인

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/payment-approvals` | — | `{payments[]}` |
| PATCH | `/api/admin/payment-approvals/[id]` | `{action: "approve"\|"reject"}` | `{ok}` |

### 리뷰 신고 관리

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/review-reports` | — | `{reports[]}` |
| PATCH | `/api/admin/review-reports/[id]` | `{action: "dismiss"\|"remove"}` | `{ok}` |
| PATCH | `/api/admin/reviews/[id]` | `{hidden?}` | `{review}` |

### 조직 관리

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/organizations` | — | `{orgs[]}` |
| GET | `/api/admin/organizations/[id]` | — | `{org}` |
| PATCH | `/api/admin/organizations/[id]` | `{status?, credit_limit?}` | `{org}` |

### 크레딧 패키지

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/credit-packages` | — | `{packages[]}` |
| POST | `/api/admin/credit-packages` | `{name, credits, price_usd, ...}` | `{package}` |
| PATCH | `/api/admin/credit-packages/[id]` | `{active?}` | `{package}` |
| DELETE | `/api/admin/credit-packages/[id]` | — | `{ok}` |

### 기타 어드민

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/credits` | — | `{stats}` | 전체 크레딧 현황 |
| GET | `/api/admin/analytics/funnel` | — | `{funnel}` | 전환 퍼널 분석 |
| GET | `/api/admin/search` | `?q=` | `{results[]}` | 통합 검색 |
| GET | `/api/admin/payment-settings` | — | `{settings}` | 결제 설정 |
| PATCH | `/api/admin/payment-settings` | `{...}` | `{settings}` | 결제 설정 수정 |
| GET | `/api/admin/payout-settings` | — | `{settings}` | 정산 설정 |
| PATCH | `/api/admin/payout-settings` | `{fee_pct?}` | `{settings}` | 정산 설정 수정 |
| GET | `/api/admin/inquiries/[id]` | — | `{inquiry}` | 문의 상세 |
| PATCH | `/api/admin/inquiries/[id]` | `{status?, notes?}` | `{inquiry}` | 문의 처리 |

### 공지사항

| Method | Path | Body | 응답 |
|--------|------|------|------|
| GET | `/api/admin/announcements` | — | `{announcements[]}` |
| POST | `/api/admin/announcements` | `{title, body, target_role?}` | `{announcement}` |
| PATCH | `/api/admin/announcements/[id]` | `{title?, body?}` | `{announcement}` |
| DELETE | `/api/admin/announcements/[id]` | — | `{ok}` |
| POST | `/api/admin/announcements/[id]/send` | — | `{ok}` | 이메일 일괄 발송 |

---

## Webhooks

| Provider | Path | 검증 | 주요 이벤트 |
|----------|------|------|-------------|
| Stripe | `/api/webhooks/stripe` | `Stripe-Signature` 헤더 | `checkout.session.completed`, `charge.refunded`, `account.updated` |

---

## Cron (CRON_SECRET 인증)

Authorization 헤더: `Bearer {CRON_SECRET}`

| Path | 권장 스케줄 | 역할 |
|------|------------|------|
| `/api/cron/generate-monthly-invoices` | `0 15 1 * *` | 매월 1일 인보이스 자동 생성 |
| `/api/cron/weekly-digest` | `0 0 * * 1` | 매주 월요일 주간 다이제스트 이메일 |
| `/api/cron/process-deletions` | `0 3 * * *` | 매일 03:00 계정 삭제 요청 처리 |
| `/api/cron/evaluate-badges` | `0 4 * * *` | 매일 04:00 뱃지 재평가 |

---

## Rate Limits

| Path | 제한 |
|------|------|
| `/api/contact` | 5건/시/IP |
| `/api/enabler-applications` | 3건/시/IP |
| `/api/disputes` | 3건/시/IP |
| `/api/checkout` | 10건/분/IP |

---

## Auth 관련 라우트

| Path | 설명 |
|------|------|
| `/api/auth/claim-application` | 지원서 → 계정 연결 (가입 직후 자동 호출) |
