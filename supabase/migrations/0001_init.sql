-- Ledger schema: profiles (cash wallet), positions, orders, funding ledger, watchlist.
-- Clients can only READ their own money data. Every write to cash or holdings
-- goes through security-definer functions added in later migrations.

create type public.user_role as enum ('user', 'admin');
create type public.order_side as enum ('buy', 'sell');

-- Profiles ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role public.user_role not null default 'user',
  cash_balance numeric(14, 2) not null default 0 check (cash_balance >= 0),
  created_at timestamptz not null default now()
);

-- Positions ---------------------------------------------------------------

create table public.positions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  quantity numeric(20, 8) not null check (quantity > 0),
  avg_cost numeric(14, 4) not null check (avg_cost >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

-- Orders (immutable trade log) -------------------------------------------

create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  side public.order_side not null,
  quantity numeric(20, 8) not null check (quantity > 0),
  price numeric(14, 4) not null check (price > 0),
  notional numeric(14, 2) not null check (notional > 0),
  created_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);

-- Funding events (every admin top-up, audited) ---------------------------

create table public.funding_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index funding_events_user_idx on public.funding_events (user_id, created_at desc);

-- Watchlist -----------------------------------------------------------------

create table public.watchlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

-- Helpers -------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- New signups get a profile with $0 cash.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security --------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.positions enable row level security;
alter table public.orders enable row level security;
alter table public.funding_events enable row level security;
alter table public.watchlist enable row level security;

create policy "Read own profile, admins read all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Read own positions, admins read all" on public.positions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Read own orders, admins read all" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Read own funding, admins read all" on public.funding_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Read own watchlist" on public.watchlist
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Add to own watchlist" on public.watchlist
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Remove from own watchlist" on public.watchlist
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- No insert/update/delete policies on profiles, positions, orders or
-- funding_events: clients cannot change money or holdings directly.

-- Make yourself admin (run once after signing up, with your email):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
