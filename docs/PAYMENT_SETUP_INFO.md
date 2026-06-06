# 결제·정산 모듈 도입 — 운영자 정보 요청서 (Stripe 기준)

**최종 업데이트**: 2026-05-08
**결제사**: Stripe (확정)
**제출 폼**: https://getitdonework.com/payment-setup

---

## 0. 한 장 요약 — 자금이 어떻게 흐르는가

```
[수입 측]
한국 기관/개인  →  Stripe Checkout  →  우리 KRW 정산 계좌
   (카드/가상계좌)         ↓
                     관리자 승인 (큰 금액)
                            ↓
                     고객 토큰 자동 충전

[지출 측]
고객 → Enabler 매칭 → 세션 진행 → 양측 토큰 차감(자동 누적)
                                          ↓
                              매월 1일 인보이스 자동 생성
                                          ↓
                                   관리자 검토·승인
                                          ↓
                       Stripe Connect Transfer (USD)
                                          ↓
                          미국 Enabler 본인 은행 계좌
```

**관리자가 직접 손대는 두 지점만 명확히**:
1. 큰 금액(예: 100만원 초과) **결제 승인**
2. 매월 Enabler **정산 인보이스 승인**
나머지는 모두 자동 처리.

---

## 1. 시스템 구조 — Stripe Connect 도입 (필수)

### 왜 Connect인가
양방향 자금 흐름(한국에서 받고 미국으로 보내기) + 자동 인보이스 + W-9/W-8BEN 자동 수집 + 1099 자동 발행이 하나의 시스템으로 처리됩니다.

### 우리가 만들 Stripe 계정 구조

| 계정 종류 | 누가 | 용도 |
|----------|------|------|
| **Standard Account** | 우리 (한국 사업자) | Platform 본 계정. 한국 고객 결제 받기. KRW 정산 |
| **Connect Express Accounts** | 미국 Enabler 각자 | 본인 USD 은행계좌 연결. 정산 받기 |
| **Stripe Tax** (선택) | 우리 | 한국 부가세 자동 계산·신고용 (월 정액 추가) |

### Enabler 온보딩 자동화 (개발자가 구현)
1. Enabler 가입 후 `/enabler-dashboard/payouts` 접속
2. "Stripe 정산 계정 연결" 버튼 → Stripe Express 온보딩 페이지로 이동
3. 본인 신원 + 미국 은행계좌 + W-9(미국인) 또는 W-8BEN(외국인) 작성
4. 완료 시 우리 DB에 `stripe_connect_account_id` 저장
5. 미완료 Enabler는 매칭 가능하지만 **정산 보류** (잔액은 누적)

---

## 2. 운영자 사업 정보 (Stripe 가맹 심사용)

### 2-1. 사업자 정보

- [ ] **사업자등록번호** (한국)
- [ ] **사업자등록증 사본** (PDF/이미지)
- [ ] **법인의 경우**: 법인등기부등본 + 임원 명단 + 25% 이상 지분 보유 임원 정보
- [ ] **대표자 성명·생년월일·주민등록번호**
- [ ] **대표자 신분증 사진** (KYC — 주민등록증 또는 여권)
- [ ] **사업장 주소** (등록증 일치)
- [ ] **연락 전화·이메일**
- [ ] **MCC 분류**: "Professional Services - Consulting" (Stripe가 자동 추정, 변경 가능)

### 2-2. 정산 받을 계좌 (KRW 매출용)

- [ ] **은행명**
- [ ] **계좌번호**
- [ ] **예금주명** (사업자명과 일치 권장)
- [ ] **SWIFT 코드** (해외에서 송금 받을 경우 — 한국 사업자가 미국 고객 결제도 받을 거면 필요)

> ⚠️ **이 계좌는 받기 전용**. 미국 Enabler에게 송금하는 건 별도 흐름(아래 4장).

### 2-3. 사이트·서비스 정보

- [ ] **서비스 한 줄 설명** (예: "한국 스타트업·기관과 미국 진출 전문가를 1:1 매칭하는 컨설팅 플랫폼")
- [ ] **공식 도메인**: `https://getitdonework.com`
- [ ] **고객센터 이메일** (예: `support@getitdonework.com`)
- [ ] **법무 정책 URL**: `/legal`에서 공개용 정책 확인. 직접 링크는 `/terms`, `/privacy`, `/refund`, `/cookie-policy`

---

## 3. 수입 측 — 한국 고객 → 우리 (토큰 구매)

### 3-1. 결제 수단 옵션

Stripe Korea가 지원하는 한국 결제수단:

- [x] **국내 신용/체크카드** (BC, 비씨, 국민, 신한, 현대, 롯데, 삼성 등) — 즉시 자동 활성화
- [x] **계좌이체 (가상계좌)** — Stripe 패널에서 활성화 (KFTC 가상계좌)
- [ ] **KakaoPay** — 별도 신청 필요 (Stripe 한국 BD에 요청)
- [ ] **Toss Pay** — 별도 신청 필요
- [ ] **Naver Pay** — 미지원 (대안: 외부 PG)

→ **운영자 결정**: 어느 수단을 활성화할지

### 3-2. 결제 한도 + 관리자 승인 임계 (중요)

> 큰 금액 결제는 카드사 한도 + 우리 자체 검토 둘 다 필요.

**시스템 설계 — `payment_orders` 테이블에 status 추가**:
- `pending_payment` → 결제 진행 중
- `paid_pending_admin` → 결제 완료, 관리자 승인 대기 (임계 초과 시)
- `approved` → 관리자 승인 → 토큰 충전 완료
- `rejected` → 관리자 거절 → 자동 환불
- `expired` → N일 미승인 → 자동 환불

**운영자가 정해주실 것**:
- [ ] **자동승인 임계 금액** (예: 1,000,000 KRW 이하 즉시 충전, 초과 시 관리자 승인)
- [ ] **관리자 승인 대기 만료 시간** (예: 7일 미승인 시 자동 환불)
- [ ] **거절 사유 분류** (예: 의심 거래 / 중복 결제 / 한도 초과)

> 💡 추천: **300만원 이하 자동, 초과 관리자 검토**. 한국 카드 단건 한도(보통 200~500만원) 고려한 안전선.

### 3-3. 환불 정책 본문 (필수 — Stripe 심사 통과 조건)

현재 `/refund` 페이지는 미국 오픈용 Refund Policy v1.0 기준으로 반영되어 있습니다.

운영자가 다음을 정해주시면 즉시 페이지 작성:

- [ ] **미사용 토큰 환불 가능 기간**: 결제 후 ___일 이내
- [ ] **부분 환불**: 일부 사용한 토큰 패키지 (예: 10토큰 중 3개 사용)
  - □ 사용 안 한 7개 비례 환불
  - □ 환불 불가
- [ ] **세션 취소**:
  - 24시간 전 취소 → 100% 환불 (코드에 이미 있음)
  - 24시간 이내 취소 → ___% 환불
  - 노쇼 → 환불 불가 (권장)
- [ ] **환불 처리 기간**: 카드사 영업일 기준 ___일 (보통 5~7일)
- [ ] **환불 방법**: 결제 카드로 자동 환불 (계좌이체 결제는 환불 계좌 별도 수령)

> 💡 표준 추천 정책: "결제 후 7일 이내 미사용 토큰 100% 환불, 사용된 토큰은 환불 불가, 세션 취소는 24시간 기준."

### 3-4. 토큰 패키지 가격

> 시스템 기준: 1토큰 = 30분 컨설팅. Standard 세션 2토큰, Project 세션 5토큰.

| 패키지명 | 토큰 수 | 가격 (KRW) | 1토큰당 단가 | 비고 |
|----------|---------|------------|--------------|------|
| Starter   |         |            |              | 신규 사용자용 |
| Standard  |         |            |              | 가장 많이 팔릴 것 |
| Pro       |         |            |              | 할인 적용 |
| Enterprise|         |            |              | 대량/조직 |

- [ ] 위 표 채워서 회신
- [ ] **B2B 별도 견적 패키지** 운영 여부 (예: "기관 전용 — 1억 이상 별도 협의")

> 💡 **이중 가격 주의**: Enabler에게 USD로 지급해야 하니, 1토큰 당 KRW 가격이 1토큰 당 USD 정산액 + 플랫폼 수수료를 커버해야 함. (4장 참조)

### 3-5. 한국 부가세 10%

- [ ] **사업자 형태**: 일반과세자 / 간이과세자 / 면세사업자
- [ ] **부가세 별도 표기**: 가격에 부가세 포함 / 결제 시 별도 추가
- [ ] **세금계산서 자동 발행**: B2B 고객(법인) 자동 / 개인 자동 / 요청 시만
- [ ] **Stripe Tax 사용 여부**: 자동 계산·신고 도구 (월 $0 + 거래당 0.5% — 매출 적을 때 유리)

> 💡 **추천**: 일반과세자 + 가격 부가세 별도 표기 + 법인 결제 시 자동 세금계산서 발행. 세무사와 한 번 상담 권장.

### 3-6. 영수증·인보이스

- [ ] **고객용 영수증 자동 이메일** (Stripe 자동 발송 — 우리 도메인 from 주소 설정 필요)
- [ ] **인보이스 발행 형식**: 한국 표준 / 영문 / 둘 다
- [ ] **회사 로고·인장**: PNG 파일 (인보이스 헤더용)

---

## 4. 지출 측 — 우리 → 미국 Enabler (USD 정산)

### 4-1. Enabler 정산 단가 (관리자 모드에서 설정)

```
1 토큰 = X USD (관리자가 토큰당 USD 단가 설정)
플랫폼 수수료 = Y % (관리자가 설정)
Enabler 실수령 = (소비된 토큰 수 × X USD) × (1 - Y%)
```

**운영자가 정해주실 것**:
- [ ] **기본 토큰당 USD 단가** (예: 1토큰 = $5 USD)
- [ ] **기본 플랫폼 수수료율** (예: 20%)
- [ ] **Enabler 등급별 차등 여부** (Junior 25% / Senior 18% / Star 15% 식)
- [ ] **최저 정산 금액** (예: 월 누적 $50 미만이면 다음 달로 이월)

> 💡 KRW 가격과 USD 정산 단가의 관계 예시:
> 1토큰을 5,000원에 팔고 → Enabler에게 $4 (= 약 5,400원) 지급 → 환율·수수료 손실
> **반드시 KRW 가격 = (USD 정산액 / (1-수수료%)) × 환율 + 마진** 공식으로 계산해야 손실 없음.

### 4-2. 월 정산 흐름

1. **세션 완료 시점** — `enabler_earnings` 테이블에 USD 누적
2. **매월 1일 00:00 (KST)** — 전월 분 자동 집계 → 인보이스 자동 생성
3. **관리자에게 알림** (이메일 + 인앱) — 검토 페이지 링크 포함
4. **`/admin/payouts` 페이지에서 검토**:
   - 인보이스 PDF 미리보기
   - Enabler별 세션 목록 + 토큰 소비량 + USD 환산
   - 일괄 승인 또는 개별 승인
5. **승인 시** — Stripe Transfer API 호출 → Connect 계정 잔액으로 이동 → 자동으로 미국 은행 입금 (1~2 영업일)
6. **Enabler에게 정산 완료 이메일** + 영수증 (PDF 첨부)

### 4-3. Enabler가 알아야 할 것 (사이트에 안내)

- [ ] **Stripe Connect 계정 생성 필수** (안 만들면 정산 불가)
- [ ] **세금 양식 작성 필수**:
  - 미국 시민/영주권자 → **W-9**
  - 외국인(non-US person) → **W-8BEN**
- [ ] **연말 1099-NEC 자동 발행** (미국 거주 + 연 $600 이상 정산받은 경우)
- [ ] **본인 세금 신고는 본인 책임** (Self-employment tax)

### 4-4. 인보이스 형식

- [ ] **인보이스 언어**: 영문 (미국 Enabler 대상)
- [ ] **인보이스 번호 규칙** (예: `INV-2026-05-{enabler_id}-{seq}`)
- [ ] **인보이스 헤더 정보**: 우리 회사명·주소·사업자번호 / Enabler 이름·주소
- [ ] **세부 라인**: 날짜 / Startup 이름(또는 익명화) / 세션 길이 / 토큰 / USD 금액
- [ ] **결제 메모**: "Paid via Stripe Connect — Reference {transfer_id}"

---

## 5. 세금 이슈 (한·미 양국)

### 5-1. 한국 측 (우리)

| 항목 | 내용 | 대응 |
|------|------|------|
| **부가세 10%** | 한국 거주자/법인 결제분 | 세금계산서 발행 (B2B 필수) |
| **법인세/소득세** | 매출 - 비용 | 매년 신고 (회계사) |
| **외환 송금 신고** | 미국 Enabler에게 USD 송금 | **연 5만 USD 초과 시 한국은행 신고** |
| **외화획득명세서** | 미국 고객한테 결제받은 경우 | 부가세 영세율 적용 가능 |

> ⚠️ **외환 송금 신고 부담**:
> Stripe Connect를 통한 송금도 **한국→해외 외환 거래로 분류될 수 있음**. 사용자별 누적이 아닌 합산 기준일 가능성 → **사업자 명의 전체 합산 5만 USD 초과 시 신고**. 세무사 + 외환 담당 은행과 상담 권장. 이게 가장 큰 미지수.

### 5-2. 미국 측 (Enabler들)

| 항목 | 내용 | 대응 |
|------|------|------|
| **W-9 / W-8BEN 수집** | Enabler 신분에 따라 | Stripe Connect 온보딩에서 자동 |
| **1099-NEC 발행** | 미국 거주 + 연 $600 이상 | Stripe가 매년 1월 자동 발행 |
| **한·미 조세조약** | 한국 회사가 미국인에게 용역 대가 지급 | **W-8BEN 보유 시 한국 원천징수 면제** |
| **Enabler 본인 신고** | Schedule C + Self-employment tax | Enabler 본인 책임 (사이트 안내문 필요) |

### 5-3. 운영자가 미리 해야 할 일

- [ ] **세무사 컨택** — 다음 4가지 질문 정리:
  1. 한국 사업자 형태 (개인/법인) — 매출 규모에 따른 세율
  2. 외환 송금 신고 의무 (Stripe Connect 사용 시 처리 방식)
  3. 한·미 조세조약상 원천징수 의무 면제 적용
  4. Stripe Tax 사용 시 부가세 자동 신고 가능 여부
- [ ] **거래 은행에 외환 거래 신고 가이드** 문의 (해외 송금 신고 폼 미리 받아두기)
- [ ] **Enabler 약관**에 세금 면책 조항 명시 — "Enabler 본인의 세금 신고는 본인 책임" (개발자가 페이지 작성 가능)

---

## 6. 운영자 → 개발자 회신 체크리스트 (요약)

### 결정 필요 (즉시)
- [ ] **결제 수단**: 카드 / 가상계좌 / KakaoPay / Toss 중 활성화할 것
- [ ] **자동승인 임계 금액** (예: 100만원 / 300만원)
- [ ] **관리자 승인 만료 시간** (예: 7일)
- [ ] **환불 정책 본문** (3-3 항목들)
- [ ] **토큰 패키지 가격** (3-4 표 4종)
- [ ] **사업자 형태 + 부가세 처리 방식** (3-5)
- [ ] **토큰당 USD 단가 + 플랫폼 수수료율** (4-1)
- [ ] **Enabler 등급별 차등 여부** (4-1)

### Stripe 가맹 가입 (운영자 직접)
- [ ] Stripe 가입 → 사업자 인증 통과 → 키 3개 발급
  - `STRIPE_SECRET_KEY` (sk_live_)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_)
  - `STRIPE_WEBHOOK_SECRET` (whsec_)
- [ ] **Stripe Connect 활성화 신청** (대시보드에서 별도 신청 — 1~2일 추가 심사)
- [ ] **Stripe Tax 가입 여부** (선택)

### 외부 준비물
- [ ] **세무사 상담 결과** (5-3 4가지 질문)
- [ ] **거래 은행 외환 송금 신고 가이드**
- [ ] **회사 로고·인장 PNG** (인보이스용)

---

## 7. 일정

| 단계 | 누가 | 소요 |
|------|------|------|
| 1. 운영자 정보 회신 | 운영자 | 회신까지 |
| 2. Stripe 가입 + 사업자 인증 | 운영자 | 1~2주 |
| 3. Stripe Connect 활성화 | 운영자 | 1~2일 추가 |
| 4. 테스트 키로 결제 모듈 코드 구현 | 개발자 | **3~4일** (수입 측) |
| 5. Connect 정산 흐름 코드 구현 | 개발자 | **2~3일** (지출 측) |
| 6. 어드민 승인 UI 구현 | 개발자 | **1~2일** |
| 7. 테스트 결제·정산 검증 | 양쪽 | 2~3일 |
| 8. 라이브 키 전환 + 배포 | 양쪽 | 반나절 |

**라이브 오픈까지 총 3~4주** (Stripe 심사가 가장 큰 변수)

---

## 8. 시스템 흐름 — 개발자 관점 (운영자가 알면 좋은)

### 8-1. 토큰 구매 흐름

```
1. 고객이 /credits 페이지에서 패키지 선택
2. POST /api/checkout/session → Stripe Checkout Session 생성
3. 고객이 Stripe 결제 페이지로 이동 (사이트 외부)
4. 결제 완료 → Stripe Webhook 수신 (POST /api/webhooks/stripe)
5. webhook handler:
   - payment_orders.status = 'paid_pending_admin' (임계 초과)
   - 또는 'approved' + credit_transactions INSERT (임계 이하)
6. 임계 초과 시:
   - 관리자에게 이메일·인앱 알림
   - /admin/payment-approvals 페이지에서 승인/거절
   - 승인 → 토큰 충전, 거절 → Stripe 자동 환불
```

### 8-2. 정산 흐름

```
1. 매 세션 완료 → enabler_earnings 테이블에 누적
   (booking_id, enabler_id, tokens_consumed, usd_amount, status='accrued')
2. 매월 1일 00:00 KST → cron job:
   - 전월 분 enabler별 합계
   - invoices 테이블에 INSERT (status='draft')
   - PDF 생성 (Resend로 관리자에게 알림)
3. 관리자가 /admin/payouts 페이지에서:
   - 인보이스 검토
   - "승인" 클릭 → POST /api/payouts/{invoice_id}/approve
4. API:
   - Stripe Transfer 호출 (Platform → Connected Account)
   - invoices.status = 'paid'
   - Enabler에게 영수증 이메일
5. Stripe가 1~2 영업일 내 미국 은행에 USD 입금
```

### 8-3. 새로 추가될 DB 테이블

```sql
-- 결제 주문 (수입)
payment_orders (
  id, user_id, package_id, amount_krw,
  stripe_session_id, stripe_payment_intent_id,
  status,  -- pending_payment | paid_pending_admin | approved | rejected | expired
  approved_by, approved_at, rejected_reason,
  created_at, expires_at
)

-- 토큰 패키지
credit_packages (
  id, name, tokens, price_krw, price_usd,
  is_active, display_order
)

-- Enabler Stripe Connect 연결 정보
enabler_payout_accounts (
  user_id PK,
  stripe_account_id,
  onboarding_completed,
  tax_form_type,  -- W9 | W8BEN
  tax_form_completed,
  bank_account_last4,
  country
)

-- Enabler 적립 (세션마다 누적)
enabler_earnings (
  id, enabler_id, booking_id,
  tokens_consumed, token_usd_rate, platform_fee_rate,
  gross_usd, net_usd,
  status,  -- accrued | invoiced | paid | reversed
  earned_at
)

-- 월 인보이스
invoices (
  id, enabler_id, period_start, period_end,
  total_gross_usd, total_fee_usd, total_net_usd,
  invoice_number, pdf_url,
  status,  -- draft | approved | paid | failed
  approved_by, approved_at,
  stripe_transfer_id, transferred_at
)

-- 정산 단가·수수료 정책 (관리자 설정)
payout_settings (
  id, scope,  -- 'global' | 'enabler:{id}' | 'tier:{name}'
  token_usd_rate, platform_fee_pct,
  effective_from, effective_to
)
```

---

## 9. FAQ

**Q. Stripe Connect 가입 심사가 안 떨어지면?**
A. 한국 사업자라도 Connect Platform 자격을 받기 어려운 경우가 있어요. 대안으로는 (1) 미국 법인 별도 설립, (2) Wise Business + 자체 인보이스 시스템 — 둘 다 더 복잡합니다. 먼저 Stripe로 시도하고 거절 시 재논의 권장.

**Q. 미국 Enabler가 W-8BEN 작성을 안 하면?**
A. Stripe Connect가 정산 자체를 막습니다(잔액은 누적). 사이트에서 정산 받을 때 강제 안내. 미작성 시 연 $600 초과부터 한국 측 원천징수 24% 발생할 수 있음 → Enabler 본인 손해.

**Q. 한국 고객이 USD 표시 가격으로 결제할 수 있나요?**
A. 네. Stripe가 카드사 환율로 자동 환전. 단 한국 부가세 처리는 동일하게 KRW 환산해서 신고.

**Q. 환불 시 Enabler에게 이미 정산된 금액은 어떻게?**
A. 정산 후 환불 발생 → `enabler_earnings.status = 'reversed'`로 변경 후 다음 달 정산에서 차감. 정산 주기 안에서 환불되면 누적분에서 차감.

**Q. 결제 데이터는 안전한가요?**
A. 카드 정보는 우리 서버에 절대 저장되지 않습니다. Stripe가 PCI-DSS Level 1에서 처리. 우리 DB는 결제 ID·금액·상태만 저장.

**Q. Enabler 인보이스를 우리 사업자 명의가 아닌 Stripe 명의로 발행되면 문제 있나요?**
A. 인보이스 발행자는 우리(Platform)이 맞습니다. Stripe는 송금 인프라일 뿐. 인보이스에 우리 사업자명·주소·사업자번호 명시.

**Q. 토큰 가격을 한국 시장만 운영하고 미국 고객은 안 받으면?**
A. 권장. KRW 단일 가격으로 단순화 가능. 단 Enabler USD 정산은 환율 변동 리스크가 우리에게 → 마진 buffer 충분히 확보 필요.

---

## 10. 다음 액션

1. **운영자**: 6장 체크리스트 회신 (패키지가격·정산단가·자동승인임계 확인)
2. **운영자**: 세무사 컨택 (5-3의 4가지 질문)
3. **운영자**: Stripe 가입 시작 (사업자 정보·계좌 준비)
4. **개발자**: 운영자 회신 받자마자 DB 마이그레이션 + Stripe 통합 PoC 시작 (테스트 키로 가능)

---

문의: 개발자 Luke (luke@xrx.studio)
