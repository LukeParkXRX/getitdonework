# 부하 테스트

## 도구

[k6](https://k6.io) — JS 기반 경량 부하 테스트 도구. Grafana 통합 가능.

## 설치

```bash
brew install k6   # macOS
```

## 실행

```bash
# 공개 페이지 smoke (10 VU × 2분)
BASE_URL=https://getitdonework.com k6 run tests/load/smoke.k6.js

# API 엔드포인트 (5 VU × 30초)
BASE_URL=https://getitdonework.com k6 run tests/load/api.k6.js

# 로컬 개발 서버 대상
k6 run tests/load/smoke.k6.js
```

## 정식 오픈 전 권장 시나리오

### 1. Smoke — 기본 동작 확인

```bash
BASE_URL=https://getitdonework.com k6 run tests/load/smoke.k6.js
```

10 VU × 2분. p95 < 1.5s, 오류율 < 1%.

### 2. Stress — 임계점 탐색

```js
// smoke.k6.js options.stages를 아래로 교체
stages: [
  { duration: "2m", target: 50 },
  { duration: "5m", target: 50 },
  { duration: "2m", target: 0  },
],
thresholds: {
  http_req_failed:   ["rate<0.01"],
  http_req_duration: ["p(95)<2000"],
},
```

### 3. Spike — 급격한 트래픽 급증

```js
stages: [
  { duration: "10s", target: 100 },
  { duration: "1m",  target: 100 },
  { duration: "10s", target: 0   },
],
```

## 통과 기준

| 시나리오 | p95 | 오류율 |
|---------|-----|--------|
| Smoke   | < 1.5s | < 1% |
| Stress  | < 2s   | < 1% |
| Spike   | < 3s   | < 2% |

## 주의사항

- 운영 사이트 직접 부하는 야간 시간대 권장
- Vercel Hobby 플랜은 동시 함수 실행 제한 있음 — Pro 플랜 확인 후 실행
- Stripe Webhook, 이메일 발송 등 외부 서비스 호출이 포함된 경로는 별도 주의
- Rate limit이 걸린 경로(`/api/contact` 등)는 스크립트에서 제외하거나 낮은 VU로 실행
