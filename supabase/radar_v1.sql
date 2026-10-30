-- Rate & Equity Radar — settings + daily market rates (Oct 30, 2026). Additive, re-runnable.

create table if not exists public.radar_settings (
  user_id          uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  refi_threshold   numeric not null default 0.50,  -- rate must beat market by this much for R&T / Streamline / IRRRL
  appreciation_pct numeric not null default 4.0,   -- yearly home-value growth used for estimated equity
  equity_ltv_max   numeric not null default 70,    -- est. LTV at or below this = equity opportunity
  seasoning_months int     not null default 7,     -- FHA Streamline / VA IRRRL minimum months since funding
  updated_at       timestamptz not null default now()
);
alter table public.radar_settings enable row level security;
drop policy if exists "Users own radar settings" on public.radar_settings;
create policy "Users own radar settings" on public.radar_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.market_rates (
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day          date not null default current_date,
  conventional numeric,
  fha          numeric,
  va           numeric,
  primary key (user_id, day)
);
alter table public.market_rates enable row level security;
drop policy if exists "Users own market rates" on public.market_rates;
create policy "Users own market rates" on public.market_rates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
