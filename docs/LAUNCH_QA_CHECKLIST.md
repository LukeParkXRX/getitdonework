# Launch D-day 수동 QA 체크리스트

자동화 E2E (`tests/e2e/`)는 read-only 플로우만 다룹니다. 매출/소통 핵심 플로우 4가지는 **출시 직전 사람이 직접 검증**해야 합니다.

- 환경: `https://<production-domain>` (preview 아님)
- 브라우저: Chrome 최신 + iOS Safari 1대
- 검증자: 2명 이상 (구매자/판매자 양쪽 계정 필요)
- 발견 이슈는 `docs/LAUNCH_QA_RESULT_YYYY-MM-DD.md`에 기록

---

## 1. Stripe 결제 end-to-end

목적: 결제 → 웹훅 수신 → DB 반영 → 알림 발송이 한 흐름으로 동작하는지.

- [ ] **사전 준비**: Stripe Dashboard → Test mode **OFF**(실 카드). 또는 Test mode + 실 카드번호로 1원 결제 후 환불.
- [ ] Startup 계정으로 로그인 → Enabler 탐색 → 1명 선택 → 예약 진행
- [ ] Stripe Checkout 페이지가 뜨고, 결제 금액·상품명·통화가 정확함
- [ ] 카드 결제 성공 → `/checkout/success` 또는 booking detail로 리다이렉트
- [ ] **Stripe Dashboard**: 결제 1건 기록, status=succeeded, metadata에 booking_id 포함
- [ ] **Supabase**: `bookings` 테이블 status=paid, `payments` 테이블 row 1건 추가
- [ ] **Resend Dashboard**: 결제 확인 이메일 1건 발송됨 (구매자/판매자 각 1통)
- [ ] **취소 플로우**: 새 booking 1건 → 환불 처리 → DB status=refunded + 환불 메일 수신
- [ ] **Stripe Connect**: Enabler 측 잔액(`balance`)에 80% 분배 표시 (수수료 정책에 따라)
- [ ] **실패 케이스**: `4000 0000 0000 0002` (declined card) → 사용자에게 에러 메시지 노출, DB에 paid row 없음

검증 도구: Stripe Dashboard → Events 탭, Supabase Table Editor

---

## 2. LiveKit Chemistry Call (영상 상담)

목적: WebRTC 토큰 발급 → 화상 연결 → 종료 후 로그 기록.

- [ ] Startup ↔ Enabler 2개 브라우저(또는 디바이스)에서 동시 접속
- [ ] 예약된 booking의 "Chemistry Call 시작" 버튼이 **시작 시각 ±10분 윈도우** 안에만 활성화됨
- [ ] 양쪽 모두 카메라/마이크 권한 요청 → 허용 시 화면 표시
- [ ] 음성/영상 양방향 전송 OK (10초 이상 대화)
- [ ] 화면 공유 버튼 동작 (Enabler 측)
- [ ] **30초 통화 후 종료** → 양쪽 모두 정상 종료, 에러 토스트 없음
- [ ] **Supabase**: `session_events` 테이블에 join/leave 이벤트 2쌍 기록
- [ ] **모바일 Safari**: 같은 플로우 1회 (WebRTC 호환성)
- [ ] **만료 토큰**: 토큰 발급 후 6시간 이상 지난 링크는 재발급 요청해야 함
- [ ] **권한 거부**: 카메라 권한 거부 시 명확한 안내 표시 (블랙 화면 X)

검증 도구: LiveKit Cloud Dashboard → Sessions

---

## 3. Resend 트랜잭션 메일

목적: 8종 알림 메일이 prod 도메인에서 정상 발송 + 수신.

- [ ] **DNS**: `dig TXT resend.getitdonework.com` → DKIM/SPF/DMARC 모두 통과 (Resend Dashboard → Domains "Verified")
- [ ] 다음 트리거를 1건씩 실행, 받은 메일이 **스팸함이 아닌 받은편지함**에 도착하는지 확인:
  - [ ] 신규 가입 → welcome 메일
  - [ ] 비밀번호 재설정 요청 → reset link 메일 (링크 클릭 시 정상 동작)
  - [ ] Enabler 지원 접수 → admin 알림 + 신청자 confirmation
  - [ ] Booking 생성 → 양측 confirmation
  - [ ] 결제 성공 → invoice 메일
  - [ ] Chemistry Call 24h 전 알림 (cron으로 트리거: `vercel cron trigger reminder-24h` 또는 수동 시간 조정)
  - [ ] Daily admin digest (Vercel Cron → 매일 09:00 KST)
  - [ ] Unsubscribe 링크 → 클릭 시 DB `unsubscribed_at` 기록 + 이후 발송 차단
- [ ] **From 주소**: 모든 메일이 `noreply@resend.getitdonework.com` (또는 prod 도메인) — `onboarding@resend.dev` 아님
- [ ] **답장 시 reply-to**: support 이메일로 라우팅
- [ ] Resend Dashboard: 8건 모두 status=delivered, bounce/complaint 0

검증 도구: Gmail/네이버/다음 3개 이메일로 교차 검증

---

## 4. 1:1 실시간 메시징

목적: Supabase Realtime 채널이 prod에서 끊김 없이 동작.

- [ ] Startup ↔ Enabler 2개 세션 동시 접속
- [ ] 양방향 메시지 5건 송수신 → **새로고침 없이 실시간 표시**
- [ ] 이미지 첨부 (Supabase Storage) → 업로드 + 표시 OK
- [ ] **읽음 표시**: 상대가 채팅창을 열면 5초 내 읽음으로 전환
- [ ] **알림**: 비활성 탭/창에서 메시지 수신 시 브라우저 푸시 (Web Push) + 미수신 시 5분 후 이메일 fallback
- [ ] 한 쪽 인터넷 끊김 → 재연결 시 미수신 메시지 자동 로드
- [ ] **차단**: 차단 후 상대 메시지 도착 안 함, 차단 해제 시 정상화
- [ ] **Admin impersonation 모니터링**: super_admin이 대화 내용을 RLS 우회 없이 못 봐야 함 (의도된 정책 확인)

검증 도구: Supabase Dashboard → Realtime → Channels

---

## 5. 출시 직전 최종 점검 (전체)

- [ ] `bun run audit:prod` 통과 (보안 헤더, env 키, 누락된 image alt 등)
- [ ] Sentry: 최근 24h 에러 신규 0건 (또는 모두 triage 완료)
- [ ] Vercel Analytics: 빌드 사이즈 5% 이상 증가 없음
- [ ] `NEXT_PUBLIC_SHOW_TEST_DATA=false` (prod 환경변수 확인)
- [ ] `robots.txt` 와 `sitemap.xml` 200 OK
- [ ] `/` 첫 로드 LCP < 2.5s (Lighthouse mobile)
- [ ] 4xx/5xx 페이지 (404, 500) UI 정상
- [ ] **롤백 준비**: 직전 prod 커밋 SHA 메모 + Vercel Rollback 버튼 위치 확인

---

## 발견 이슈 기록 템플릿

```
### [P0/P1/P2] 한 줄 요약
- 발견 시각:
- 재현:
  1.
  2.
- 기대:
- 실제:
- 스크린샷:
- 원인 가설:
- 차단 여부: 출시 차단 / 출시 후 처리
```

- **P0**: 출시 차단 (결제 실패, 데이터 손실, 로그인 불가)
- **P1**: 출시 가능하나 24h 내 hotfix (UX 깨짐, 일부 알림 실패)
- **P2**: 출시 후 차주 sprint에서 처리

---

마지막 갱신: 2026-05-22
