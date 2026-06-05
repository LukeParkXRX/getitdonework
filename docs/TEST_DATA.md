# 테스트 데이터 가이드

> 운영 사이트에서는 아래 테스트 계정을 사용하지 않습니다.
> 현재 운영 DB의 테스트 계정은 삭제되어 있으며, super_admin은
> `admin@getitdonework.com`, `luke@xrx.studio`만 사용합니다.
> 아래 계정 목록과 공통 비밀번호는 로컬 개발/시드 데이터 확인용입니다.

## 개요

`is_test` 플래그를 사용해 테스트 계정과 실서비스 데이터를 동일 DB에 공존시킵니다.

- `users.is_test = true` — 테스트 계정
- `organizations.is_test = true` — 테스트 조직
- 공개 페이지 (`/enablers` 등)는 기본적으로 `is_test=false` 데이터만 노출
- 테스트 모드 진입 시 전체 노출 (아래 진입 방법 참조)

마이그레이션: `supabase/migrations/007_test_data_flag.sql`

---

## 계정 목록

로컬/dev 시드 전용 공통 비밀번호: `Test!GetItDone2026`

| 이메일 | 역할 | 설명 |
|--------|------|------|
| test.superadmin.01@getitdonework.test | super_admin | 전체 관리자 |
| test.orgadmin.01@getitdonework.test | org_admin | Test Sandbox 조직 관리자 |
| test.startup.01@getitdonework.test | startup | Alpha B2B (Seed, Sandbox 소속, 크레딧 100) |
| test.startup.02@getitdonework.test | startup | Beta Fintech (Series A, 조직 없음, 크레딧 50) |
| test.startup.03@getitdonework.test | startup | Gamma Health (Series B, Sandbox 소속, 크레딧 80) |
| test.enabler.01@getitdonework.test | enabler | Stanford GSB / B2B SaaS (approved, top_rated) |
| test.enabler.02@getitdonework.test | enabler | Wharton / Fintech (approved, top_rated) |
| test.enabler.03@getitdonework.test | enabler | Columbia Business / Healthcare (approved, verified) |
| test.enabler.04@getitdonework.test | enabler | MIT Sloan / AI·DeepTech (pending, rising_star) |

### 테스트 조직

| 항목 | 값 |
|------|----|
| name | Test Sandbox |
| slug | test-sandbox |
| invite_code | TEST-SBOX |
| total_credits | 1000 |

---

## 시드 실행 / 초기화 명령

> 전제조건: `supabase/migrations/007_test_data_flag.sql`이 Supabase 콘솔 SQL Editor에서 적용된 상태여야 합니다.

```bash
# 테스트 데이터 시드 (처음 또는 추가)
bun run seed:test

# 테스트 데이터 전체 삭제 (confirm 프롬프트 있음)
bun run seed:clear

# 초기화 후 재시드 (confirm 없이 즉시 실행)
bun run seed:reset
```

---

## 테스트 모드 진입 방법

### 방법 1 — 환경 변수 (로컬 개발)

`.env.local`에 추가:

```
NEXT_PUBLIC_SHOW_TEST_DATA=true
```

서버 재시작 후 `/enablers` 페이지에 테스트 이네이블러까지 노출됩니다.

### 방법 2 — super_admin 로그인

로컬 또는 별도 테스트 DB에 시드 데이터를 넣은 경우에만 `test.superadmin.01@getitdonework.test` 계정을 사용할 수 있습니다.
운영 사이트에서는 이 계정이 없으며 사용하지 않습니다.

---

## 역할별 테스트 시나리오

### super_admin (`test.superadmin.01`)
- 어드민 대시보드 전체 접근 확인
- 이네이블러 승인/정지 플로우 확인
- 크레딧 지급 기능 확인
- 테스트 데이터가 공개 페이지에 노출되는지 확인

### org_admin (`test.orgadmin.01`)
- Test Sandbox 조직 대시보드 접근
- 소속 스타트업(startup.01, startup.03)에 크레딧 배분 UI 확인
- 조직 초대 코드(`TEST-SBOX`) 동작 확인

### startup — Sandbox 소속 (`test.startup.01`, `test.startup.03`)
- 이네이블러 목록 탐색 및 예약 플로우
- 크레딧 잔액 확인 (startup.01: 100, startup.03: 80)
- startup.01 → pending 예약 (enabler.01), cancelled 예약 (enabler.02) 확인
- startup.03 → completed 예약 (enabler.03) 및 세션 이력 확인

### startup — 조직 없음 (`test.startup.02`)
- 독립 스타트업 (조직 미소속) 뷰 확인
- 크레딧 잔액 50 / confirmed 예약 (enabler.02) 홀드 상태 확인

### enabler — approved (`test.enabler.01`, `.02`, `.03`)
- 이네이블러 대시보드 접근
- 세션 이력, 평점 표시 확인
- `/enablers` 공개 페이지에 카드 노출 확인

### enabler — pending (`test.enabler.04`)
- 승인 대기 상태 UI 확인 (`/enablers` 목록에 미노출)
- 어드민 승인 플로우 테스트 대상

---

## 주의사항

- **프로덕션 DB에 시드가 들어감**: 실 DB에 `is_test=true` 데이터가 직접 삽입됩니다. 공개 페이지는 필터로 숨기지만, DB 레벨 격리가 아니므로 주의하세요.
- **`.env.local` 커밋 금지**: `NEXT_PUBLIC_SHOW_TEST_DATA=true` 설정이 포함된 `.env.local`을 절대 커밋하지 마세요.
- **비밀번호는 dev only**: `Test!GetItDone2026`은 로컬 개발/시드 데이터 전용입니다. 운영 사이트에서 사용하거나 공유하지 마세요.
- **seed:reset은 즉시 삭제**: `--yes` 플래그가 자동으로 전달되므로 confirm 없이 삭제됩니다. 실행 전 확인하세요.
