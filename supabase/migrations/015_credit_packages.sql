-- ============================================================
-- 015_credit_packages.sql
-- 결제 가능한 크레딧 패키지 카탈로그
-- ============================================================

create table if not exists credit_packages (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  credits       integer     not null check (credits > 0),
  price_krw     integer     not null check (price_krw > 0),
  -- Stripe price ID (Stripe 연동 시 필요)
  stripe_price_id text,
  -- 활성/비활성 (비활성이면 구매 목록에 노출 안 됨)
  is_active     boolean     not null default true,
  -- 표시 순서
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_credit_packages_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_credit_packages_updated_at
  before update on credit_packages
  for each row execute function update_credit_packages_updated_at();

-- RLS
alter table credit_packages enable row level security;

-- 누구나 활성 패키지 읽기 가능 (공개 카탈로그)
create policy "anyone can read active packages"
  on credit_packages for select
  using (is_active = true);

-- super_admin만 INSERT/UPDATE/DELETE
create policy "super_admin can manage packages"
  on credit_packages for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'super_admin'
    )
  );

-- ============================================================
-- 시드 데이터 — 기본 패키지 4개
-- ============================================================
insert into credit_packages (name, credits, price_krw, sort_order)
values
  ('Starter',      10,  49000,  1),
  ('Growth',       30, 129000,  2),
  ('Scale',        60, 239000,  3),
  ('Enterprise',  120, 449000,  4)
on conflict do nothing;
