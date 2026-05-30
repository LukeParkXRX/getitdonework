# Resend 작업 지시서 (AI 브라우저용)

> 대상: getitdonework.com 트랜잭션 이메일 발송 설정
> 전제: **방금 유료 가입한 새 Resend 계정**에 로그인된 상태여야 함 (과거 계정 아님)
> 이 문서의 작업은 **Resend 대시보드 안에서만** 수행. DNS 입력(Cloudflare)은 별도 단계.

---

## 작업 0 — 로그인 계정 확인
1. https://resend.com/login 접속 후 로그인.
2. 우측 상단 계정/워크스페이스 이름이 **이번에 유료 가입한 계정**인지 확인.
   - 결제(Pro/유료 플랜) 표시가 있는 계정이 맞는지 Settings → Billing 에서 확인.
3. **확인 결과를 보고할 것**: "현재 로그인 계정 이름 = ___, 플랜 = ___"

---

## 작업 1 — 도메인 추가 (send.getitdonework.com)
1. 좌측 메뉴 **Domains** → 우측 **Add Domain** 클릭.
2. 도메인 입력란에 정확히 입력: `send.getitdonework.com`
   - ⚠️ 루트 `getitdonework.com` 아님. 반드시 **send.** 서브도메인.
3. Region 드롭다운: **N. Virginia (us-east-1)** 선택 (미국 대상).
4. **Add** 클릭.

### 작업 1 결과로 반드시 캡처해서 보고할 것
도메인 추가 직후 Resend가 보여주는 **DNS 레코드 표 전체**를 그대로 복사/캡처.
보통 3개 행이며 각 행의 **Type / Name(Host) / Value / Priority(MX만)** 를 빠짐없이 적을 것:

| 예상 행 | Type | 비고 |
|--------|------|------|
| 1 | MX | bounce/return-path 용 (`feedback-smtp...amazonses.com`, priority 10 등) |
| 2 | TXT | SPF (`v=spf1 include:amazonses.com ~all`) |
| 3 | TXT | DKIM (`resend._domainkey.send...`, 긴 `p=...` 값) |

> 이 값들은 사람이 Cloudflare에 넣어야 하므로 **글자 그대로 정확히** 보고할 것. 줄임표 금지.

---

## 작업 2 — 발송 전용 API 키 새로 발급
1. 좌측 메뉴 **API Keys** → **Create API Key** 클릭.
2. Name: `getitdonework-prod`
3. Permission: **Sending access** 선택 (Full access 아님 — 최소 권한 원칙).
4. Domain: 가능하면 **`send.getitdonework.com`** 으로 제한 (드롭다운에 없으면 "All domains" 허용).
5. **Add** / **Create** 클릭.

### 작업 2 결과로 반드시 보고할 것
- 생성 직후 **한 번만 표시되는 `re_...` 키 전체 문자열**을 복사해 보고.
  - ⚠️ 이 화면을 닫으면 키를 다시 볼 수 없음. 반드시 이 시점에 복사.
- 보고 형식: "새 API 키 = re_............ (전체)"

---

## 작업 3 — (Cloudflare DNS 입력 후) 도메인 검증
> 이 작업은 사람이 Cloudflare에 작업 1의 DNS 레코드를 다 넣은 **이후에** 수행.
1. **Domains** → `send.getitdonework.com` 클릭.
2. **Verify DNS Records** 버튼 클릭.
3. 각 레코드 상태가 **Verified(초록)** 인지 확인.
4. **보고할 것**: 전체 상태 ("Verified" / "Pending" / 실패한 레코드명).

---

## 보고 요약 템플릿 (작업 끝나면 이 형식으로)
```
[작업 0] 로그인 계정: ___ / 플랜: ___
[작업 1] 도메인 추가: 완료/실패
  - MX:  Name=___  Value=___  Priority=___
  - TXT(SPF):  Name=___  Value=___
  - TXT(DKIM): Name=___  Value=___
[작업 2] 새 API 키: re_______________ (전체)
[작업 3] 검증 상태: (Cloudflare 입력 후 수행) ___
```

---

## 사람/Claude Code가 이어서 할 일 (브라우저 작업 아님)
1. 작업 1의 DNS 레코드 3개를 **Cloudflare DNS**에 추가 (Proxy = DNS only / 회색 구름).
2. 작업 2의 새 키 → `.env.local` 과 **Vercel 환경변수** `RESEND_API_KEY` 교체.
3. `RESEND_FROM` = `noreply@send.getitdonework.com` 으로 변경 (로컬 + Vercel).
4. 재배포 후 **외부 이메일 주소로 실제 도착 테스트**.
