-- ============================================================
-- 016_credit_purchases.sql
-- Stripe 결제 이력 + purchase_credits / refund_credits RPC
-- ============================================================

create table if not exists credit_purchases (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid references organizations(id) on delete set null,
  startup_id           uuid references users(id)         on delete set null,
  package_id           uuid references credit_packages(id) on delete set null,
  credits              integer     not null check (credits > 0),
  amount_krw           integer     not null check (amount_krw > 0),
  -- Stripe Checkout Session ID (idempotency key)
  provider_session_id  text unique,
  -- Stripe PaymentIntent ID
  provider_payment_id  text,
  status               text        not null default 'pending'
                          check (status in ('pending', 'completed', 'refunded', 'failed')),
  completed_at         timestamptz,
  refunded_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function update_credit_purchases_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_credit_purchases_updated_at
  before update on credit_purchases
  for each row execute function update_credit_purchases_updated_at();

-- 인덱스
create index if not exists idx_credit_purchases_org_id         on credit_purchases(org_id);
create index if not exists idx_credit_purchases_startup_id     on credit_purchases(startup_id);
create index if not exists idx_credit_purchases_status         on credit_purchases(status);
create index if not exists idx_credit_purchases_session_id     on credit_purchases(provider_session_id);

-- RLS
alter table credit_purchases enable row level security;

-- 본인 구매 이력 조회
create policy "users can read own purchases"
  on credit_purchases for select
  using (
    startup_id = auth.uid()
    or exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'super_admin'
    )
  );

-- INSERT/UPDATE는 service role(webhook) 또는 super_admin
create policy "service or admin can write purchases"
  on credit_purchases for all
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
-- RPC: purchase_credits
-- Stripe webhook checkout.session.completed 처리
-- idempotent — 동일 provider_session_id 중복 호출 무시
-- ============================================================
create or replace function purchase_credits(
  p_provider_session_id text,
  p_provider_payment_id text,
  p_startup_id          uuid,
  p_org_id              uuid,
  p_package_id          uuid,
  p_credits             integer,
  p_amount_krw          integer
)
returns json
language plpgsql
security definer
as $$
declare
  v_purchase_id uuid;
  v_existing    credit_purchases%rowtype;
begin
  -- 중복 체크 (idempotency)
  select * into v_existing
  from credit_purchases
  where provider_session_id = p_provider_session_id;

  if found then
    if v_existing.status = 'completed' then
      return json_build_object('ok', true, 'duplicate', true, 'purchase_id', v_existing.id);
    end if;
  end if;

  -- upsert purchase record
  insert into credit_purchases (
    provider_session_id,
    provider_payment_id,
    startup_id,
    org_id,
    package_id,
    credits,
    amount_krw,
    status,
    completed_at
  )
  values (
    p_provider_session_id,
    p_provider_payment_id,
    p_startup_id,
    p_org_id,
    p_package_id,
    p_credits,
    p_amount_krw,
    'completed',
    now()
  )
  on conflict (provider_session_id)
  do update set
    status             = 'completed',
    provider_payment_id = excluded.provider_payment_id,
    completed_at       = now(),
    updated_at         = now()
  returning id into v_purchase_id;

  -- 크레딧 트랜잭션 기록 (credit_transactions 테이블 사용)
  insert into credit_transactions (
    org_id,
    startup_id,
    tx_type,
    amount,
    description
  )
  values (
    p_org_id,
    p_startup_id,
    'purchase',
    p_credits,
    'Stripe 결제 완료 — session: ' || p_provider_session_id
  );

  return json_build_object('ok', true, 'duplicate', false, 'purchase_id', v_purchase_id);
end;
$$;

-- ============================================================
-- RPC: refund_credits
-- charge.refunded 이벤트 처리
-- ============================================================
create or replace function refund_credits(
  p_provider_session_id text
)
returns json
language plpgsql
security definer
as $$
declare
  v_purchase credit_purchases%rowtype;
begin
  select * into v_purchase
  from credit_purchases
  where provider_session_id = p_provider_session_id;

  if not found then
    return json_build_object('ok', false, 'error', 'purchase_not_found');
  end if;

  if v_purchase.status = 'refunded' then
    return json_build_object('ok', true, 'duplicate', true);
  end if;

  -- 상태 업데이트
  update credit_purchases
  set status      = 'refunded',
      refunded_at = now(),
      updated_at  = now()
  where id = v_purchase.id;

  -- 크레딧 차감 트랜잭션
  insert into credit_transactions (
    org_id,
    startup_id,
    tx_type,
    amount,
    description
  )
  values (
    v_purchase.org_id,
    v_purchase.startup_id,
    'refund',
    -v_purchase.credits,
    'Stripe 환불 처리 — session: ' || p_provider_session_id
  );

  return json_build_object('ok', true, 'duplicate', false);
end;
$$;
