-- 045_launch_hub.sql
-- Launch Hub 확장: 외부 서비스, 계정 정보, 자유 메모 테이블

create table launch_services (
  id text primary key,
  name text not null,
  category text not null,
  url text default null,
  description text not null,
  monthly_cost_usd numeric(10,2) not null default 0,
  cost_note text default '',
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table launch_accounts (
  id text primary key,
  name text not null,
  account_id text not null default '',
  url text default null,
  description text not null,
  notes text not null default '',
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table launch_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  author_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_launch_services_order on launch_services(display_order);
create index idx_launch_accounts_order on launch_accounts(display_order);
create index idx_launch_notes_pinned on launch_notes(pinned, created_at desc);

alter table launch_services enable row level security;
alter table launch_accounts enable row level security;
alter table launch_notes enable row level security;
