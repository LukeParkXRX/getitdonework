# Resend 도메인 인증 설정 가이드
# Resend Domain Authentication Setup Guide

> 이 문서는 한국어(팀 내부)와 영어(미국 파트너 참고)를 동시에 제공합니다.
> This document is written in both Korean (internal team) and English (for US partners).

---

## 한국어 가이드

### 왜 필요한가?

`onboarding@resend.dev` 주소로 이메일을 보내면 Gmail/Outlook에서 스팸으로 분류될 수 있습니다.
자체 도메인(`noreply@yourdomain.com`)으로 발송하면 전달률이 크게 향상됩니다.

### 1단계: Resend에 도메인 추가

1. [Resend Dashboard](https://resend.com) 로그인
2. 좌측 메뉴 **Domains** → **Add Domain** 클릭
3. 도메인 입력: `yourdomain.com` (예: `getitdonework.com`)
4. Region: **US East (N. Virginia)** 선택 (기본값 권장)
5. **Add** 클릭

### 2단계: DNS 레코드 추가

Resend가 제공하는 3종의 DNS 레코드를 도메인 등록처(예: Cloudflare, Route53, Namecheap)에 추가합니다.

#### SPF (TXT 레코드)

| 항목 | 값 |
|------|-----|
| Type | TXT |
| Name / Host | `@` (또는 `yourdomain.com`) |
| Value | `v=spf1 include:_spf.resend.com ~all` |
| TTL | 3600 (1시간) |

> 기존 SPF 레코드가 있다면 `include:_spf.resend.com` 을 기존 값에 추가합니다.
> 예: `v=spf1 include:sendgrid.net include:_spf.resend.com ~all`

#### DKIM (TXT 레코드)

| 항목 | 값 |
|------|-----|
| Type | TXT |
| Name / Host | `resend._domainkey` |
| Value | Resend Dashboard에서 제공하는 키 (p=... 형식) |
| TTL | 3600 |

#### DMARC (TXT 레코드) — 권장

| 항목 | 값 |
|------|-----|
| Type | TXT |
| Name / Host | `_dmarc` |
| Value | `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com` |
| TTL | 3600 |

> `p=quarantine`: 인증 실패 메일을 스팸함으로 — 안전한 시작값.
> `p=reject`로 올리면 위조 메일을 완전 차단 (운영 안정 후 전환 권장).

#### MX (옵션 — 수신 처리가 필요한 경우만)

수신 이메일도 처리하려면 Resend의 MX 레코드를 추가합니다 (Dashboard → Domains → 상세 참고).
단순 발송만 한다면 MX 레코드는 불필요합니다.

### 3단계: 인증 확인

1. Resend Dashboard → Domains → 해당 도메인 → **Verify** 클릭
2. DNS 전파에 최대 **24시간** 소요 (보통 수 분~수 시간)
3. Status가 **Verified** 로 바뀌면 완료

### 4단계: 환경 변수 업데이트

`.env.local` 수정 (`.env.local.example` 참고):

```bash
# 변경 전
RESEND_FROM=onboarding@resend.dev

# 변경 후
RESEND_FROM=noreply@yourdomain.com
```

**Vercel 환경 변수도 동일하게 업데이트**:
1. Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables**
2. `RESEND_FROM` 값을 `noreply@yourdomain.com` 으로 변경
3. **Save** → **Redeploy** (변경 적용을 위해 필수)

### 5단계: 검증

1. 서비스에서 회원가입 → 확인 이메일 정상 도착 여부 확인
2. 발신자 주소가 `noreply@yourdomain.com` 인지 확인
3. Gmail 스팸 분류 여부 확인
4. Resend Dashboard → **Emails** 탭에서 delivered 상태 확인

### 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| Status가 계속 Pending | DNS 전파 미완료 | 24시간 대기 후 재확인 |
| SPF 검사 실패 | 기존 SPF와 충돌 | `include:_spf.resend.com` 병합 |
| DKIM 실패 | 레코드 값 복사 오류 | Dashboard에서 값 재복사 |
| 이메일이 스팸함에 도착 | DMARC 미설정 | DMARC TXT 레코드 추가 |

---

## English Guide

### Why is this needed?

Emails sent from `onboarding@resend.dev` may be classified as spam by Gmail or Outlook.
Sending from your own domain (`noreply@yourdomain.com`) significantly improves deliverability.

### Step 1: Add Domain in Resend

1. Log in to [Resend Dashboard](https://resend.com)
2. Click **Domains** in the left menu → **Add Domain**
3. Enter your domain: `yourdomain.com` (e.g., `getitdonework.com`)
4. Select Region: **US East (N. Virginia)** (recommended default)
5. Click **Add**

### Step 2: Add DNS Records

Add the 3 DNS records provided by Resend to your domain registrar (e.g., Cloudflare, Route53, Namecheap).

#### SPF (TXT Record)

| Field | Value |
|-------|-------|
| Type | TXT |
| Name / Host | `@` (or `yourdomain.com`) |
| Value | `v=spf1 include:_spf.resend.com ~all` |
| TTL | 3600 (1 hour) |

> If an existing SPF record exists, append `include:_spf.resend.com` to it.
> Example: `v=spf1 include:sendgrid.net include:_spf.resend.com ~all`

#### DKIM (TXT Record)

| Field | Value |
|-------|-------|
| Type | TXT |
| Name / Host | `resend._domainkey` |
| Value | Key provided in Resend Dashboard (p=... format) |
| TTL | 3600 |

#### DMARC (TXT Record) — Recommended

| Field | Value |
|-------|-------|
| Type | TXT |
| Name / Host | `_dmarc` |
| Value | `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com` |
| TTL | 3600 |

> `p=quarantine` sends authentication failures to spam — a safe starting value.
> Upgrade to `p=reject` to fully block spoofed emails (recommended after stable operation).

#### MX (Optional — only if inbound email processing is needed)

Add Resend's MX records only if you need to receive emails (see Dashboard → Domains → details).
If you only send emails, MX records are not required.

### Step 3: Verify

1. Resend Dashboard → Domains → your domain → Click **Verify**
2. DNS propagation can take up to **24 hours** (usually minutes to hours)
3. Done when status changes to **Verified**

### Step 4: Update Environment Variables

Update `.env.local` (refer to `.env.local.example`):

```bash
# Before
RESEND_FROM=onboarding@resend.dev

# After
RESEND_FROM=noreply@yourdomain.com
```

**Also update in Vercel**:
1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Change `RESEND_FROM` to `noreply@yourdomain.com`
3. **Save** → **Redeploy** (required to apply changes)

### Step 5: Verify Delivery

1. Sign up on the service → Check that the confirmation email arrives
2. Confirm sender address shows `noreply@yourdomain.com`
3. Check Gmail spam classification
4. Confirm `delivered` status in Resend Dashboard → **Emails** tab

### Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Status stays Pending | DNS not propagated | Wait 24h and recheck |
| SPF check fails | Conflict with existing SPF | Merge `include:_spf.resend.com` |
| DKIM fails | Record value copy error | Re-copy value from Dashboard |
| Email lands in spam | DMARC not set | Add DMARC TXT record |
