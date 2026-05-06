# 백업 정책 (Get It Done at Work)

최종 수정: 2026-05-06

---

## 1. Supabase 데이터베이스 백업

| 플랜 | 백업 방식 | 보존 기간 |
|------|-----------|-----------|
| Free | 자동 일별 스냅샷 | 7일 |
| Pro | 자동 일별 스냅샷 + Point-in-Time Recovery | 7일 (PITR 별도 설정) |

- 복구 경로: Supabase 대시보드 → **Database** → **Backups** → 원하는 시점 선택 후 Restore
- PITR 활성화 시 1초 단위 복구 가능 (Pro 이상)

## 2. 마이그레이션 버전 관리

- 모든 스키마 변경은 `supabase/migrations/` 디렉토리에 파일로 저장
- Git 커밋 기준으로 버전 추적 → 언제든 재적용 가능
- 운영 적용 전 반드시 `supabase db diff` 로 변경 내용 확인

## 3. 환경변수 백업

- 현재 환경변수는 Vercel 프로젝트 설정에서만 관리됨
- **월 1회** Vercel 대시보드 → **Settings** → **Environment Variables** → 수동 기록 또는 Vercel CLI로 export
  ```bash
  vercel env pull .env.local.backup
  ```
- `.env.local.backup` 파일은 Git에 커밋하지 않음 (`.gitignore` 확인)

## 4. 복구 절차

1. Supabase 대시보드 → Database → Backups 접속
2. 복구할 시점(스냅샷) 선택 → **Restore** 클릭
3. 복구 완료 후 앱 재배포: `vercel --prod`
4. 마이그레이션 누락 여부 확인: `supabase db status`

## 5. 재해 복구 목표 (Free 플랜 기준)

| 지표 | 목표값 | 비고 |
|------|--------|------|
| RPO (복구 목표 시점) | 24시간 | 일별 스냅샷 기준 |
| RTO (복구 목표 시간) | 4시간 | 스냅샷 복원 + 재배포 포함 |

Pro 플랜 전환 시 RPO를 1초 단위로 단축 가능.
