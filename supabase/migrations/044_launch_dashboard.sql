-- ============================================================
-- 044 Launch Dashboard
-- 런칭 준비 양방향 대시보드 — 체크리스트 + 업데이트 피드
-- ============================================================

-- 1. 체크리스트 항목 (영구 고정 ID)
create table launch_checklist_items (
  id text primary key,                              -- "1.1", "2.3" 등 영구 ID
  category text not null,                           -- "1. Company Info" 등
  category_order int not null,                      -- 1, 2, 3...
  item_order int not null,                          -- 카테고리 내 순서
  title_ko text not null,
  title_en text not null,
  description_ko text not null default '',
  description_en text not null default '',
  priority text not null check (priority in ('P0', 'P1', 'P2')),
  needs_value boolean not null default false,       -- value 입력 필드 필요 여부
  value_label text default null,                    -- "EIN", "Stripe Publishable Key" 등
  value_is_secret boolean not null default false,   -- secret이면 마스킹
  is_complete boolean not null default false,
  completed_at timestamptz default null,
  completed_by text default null,
  notes text not null default '',
  value text not null default '',                   -- 미국 측 입력값
  updated_at timestamptz not null default now()
);

create index idx_launch_checklist_order on launch_checklist_items(category_order, item_order);

-- 2. 양방향 소통 피드
create type launch_update_type as enum ('daily', 'feedback', 'question', 'blocker', 'milestone');
create type launch_author_role as enum ('korea_dev', 'us_partner');

create table launch_updates (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role launch_author_role not null,
  type launch_update_type not null,
  title text not null,
  body text not null,
  related_item_id text references launch_checklist_items(id) on delete set null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_launch_updates_created on launch_updates(created_at desc);
create index idx_launch_updates_unresolved on launch_updates(resolved) where resolved = false;

-- 3. RLS — service_role 외 직접 접근 금지 (token 검증은 server에서)
alter table launch_checklist_items enable row level security;
alter table launch_updates enable row level security;
-- 정책 없음 = anon/authenticated 차단. service_role만 우회.
