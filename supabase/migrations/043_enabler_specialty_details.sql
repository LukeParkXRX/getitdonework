-- specialty_details: 각 specialty의 title + description 구조화
alter table enabler_profiles
  add column if not exists specialty_details jsonb not null default '[]'::jsonb;

-- shape: [{ "title": "B2B SaaS GTM", "description": "...", "icon": "◈" }, ...]
-- 기존 specialties (TEXT[])는 유지 (필터링/검색에 계속 사용)

comment on column enabler_profiles.specialty_details is
  'enabler 상세 페이지의 "전문 분야" 카드용. shape: [{title, description, icon?}]';
