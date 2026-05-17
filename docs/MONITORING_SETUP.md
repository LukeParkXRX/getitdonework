# 모니터링 셋업 가이드

> 상용 오픈 전 필수 설정. Sentry · Vercel Analytics · Uptime 3종 셋업.

---

## 1. Sentry Alert Rules

### 전제 조건
- `@sentry/nextjs` 이미 설치됨 (`package.json` 확인)
- Sentry 프로젝트: [sentry.io](https://sentry.io) 대시보드에서 `getitdonework` 프로젝트 선택

### Alert Rule 3개 설정

**Alerts → Create Alert Rule** 에서 아래 3개 생성:

#### Rule 1 — Error Rate 급등
```
Name: Error rate > 1% in 10min
Trigger: Number of errors > 전체 이벤트의 1%
Time window: 10 minutes
Action: Slack #ops 채널 알림
```

#### Rule 2 — 신규 에러 감지
```
Name: New error issue created
Trigger: A new issue is created (level >= error)
Action: 이메일 알림 (luke@xrx.studio)
```

#### Rule 3 — 성능 저하
```
Name: p95 latency > 3s in 30min
Trigger: p95 transaction duration > 3000ms
Time window: 30 minutes
Action: Slack #ops 채널 알림
```

### Slack 통합
1. Sentry → Settings → Integrations → Slack
2. "Add to Slack" 클릭 → 워크스페이스 연결
3. 알림 수신 채널 `#ops` 지정

---

## 2. Vercel Analytics

### 활성화
1. Vercel 대시보드 → 프로젝트 선택 → **Analytics** 탭
2. "Enable Analytics" 클릭 (Pro plan 포함, 별도 요금 없음)
3. 코드 변경 없이 자동 수집 시작

### 수집 항목
- **Core Web Vitals**: LCP · CLS · FID · INP · TTFB
- Audience overview (UV · 세션 · 이탈률)
- Top pages (페이지별 트래픽)
- Top countries (지역 분포)

> 참고: `@vercel/analytics` 패키지가 `layout.tsx`에 `<Analytics />` 컴포넌트로 이미 포함되어 있어야 수집됨. 미포함 시 `bun add @vercel/analytics` 후 루트 layout에 추가.

---

## 3. Uptime Monitoring

### 권장 옵션 (무료)

| 서비스 | 무료 한도 | 최소 간격 | Slack 지원 |
|--------|-----------|-----------|------------|
| [Better Stack](https://betterstack.com/uptime) | 10 monitors | 3분 | O |
| [UptimeRobot](https://uptimerobot.com) | 50 monitors | 5분 | O |

**권장: Better Stack** (UI 깔끔, Slack 연동 간단)

### 모니터 5개 설정

| 모니터 이름 | URL | 간격 |
|-------------|-----|------|
| Homepage | `https://getitdonework.com/` | 5분 |
| Enablers | `https://getitdonework.com/enablers` | 5분 |
| Insights | `https://getitdonework.com/insights` | 5분 |
| Health API | `https://getitdonework.com/api/health` | 5분 |
| Login | `https://getitdonework.com/login` | 5분 |

### Health API 엔드포인트
`GET /api/health` — Supabase 연결 상태 + 응답 레이턴시 반환

정상 응답 (200):
```json
{
  "status": "ok",
  "db": "ok",
  "latency_ms": 42,
  "timestamp": "2026-05-17T00:00:00.000Z"
}
```

장애 응답 (503):
```json
{
  "status": "degraded",
  "db": "error",
  "error": "...",
  "timestamp": "2026-05-17T00:00:00.000Z"
}
```

Uptime monitor는 HTTP status 200 확인으로 ping. 503 시 즉시 Slack 알림.

### Slack 알림 설정 (Better Stack 기준)
1. Better Stack → Integrations → Slack
2. OAuth 연결 → `#ops` 채널 지정
3. 알림 조건: Down / Recovered 모두 활성화

---

## 체크리스트

- [ ] Sentry Rule 1: Error rate alert 생성
- [ ] Sentry Rule 2: New issue alert 생성
- [ ] Sentry Rule 3: Performance alert 생성
- [ ] Sentry Slack 통합 연결
- [ ] Vercel Analytics 활성화
- [ ] Better Stack 또는 UptimeRobot 가입
- [ ] 모니터 5개 등록
- [ ] `/api/health` 엔드포인트 실제 응답 확인
