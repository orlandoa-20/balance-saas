-- ============================================================================
-- BalanceU — initial schema + Row-Level Security
-- Billing tables follow the canonical nextjs-subscription-payments pattern;
-- app tables implement the BalanceU domain (see ARCHITECTURE.md).
-- Every user-owned table enforces RLS: auth.uid() = user_id.
-- ============================================================================

-- ---------- enums ----------
create type pillar          as enum ('academics','health','work','sports','relationships','finances','growth');
create type item_type       as enum ('class','study','exam','task','work','event');
create type plan_tier       as enum ('free','plus','pro');
create type verify_status   as enum ('unverified','pending','verified','rejected');
create type pricing_interval as enum ('month','year');
create type sub_status      as enum ('trialing','active','canceled','incomplete','incomplete_expired','past_due','unpaid','paused');

-- ---------- helper: is_admin() ----------
create or replace function public.is_admin() returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable set search_path = public;

-- ---------- profiles (mirrors auth.users) ----------
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text,
  avatar_url    text,
  school        text,
  role          text not null default 'student',           -- 'student' | 'admin'
  plan          plan_tier not null default 'free',
  verify_status verify_status not null default 'unverified',
  goal          text,
  priorities    pillar[] not null default '{}',
  onboarded     boolean not null default false,
  suspended     boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- pillar_targets (weekly hours per pillar) ----------
create table public.pillar_targets (
  user_id       uuid primary key references auth.users on delete cascade,
  academics int not null default 14,
  health    int not null default 4,
  work      int not null default 8,
  sports    int not null default 4,
  relationships int not null default 5,
  finances  int not null default 2,
  growth    int not null default 3
);
alter table public.pillar_targets enable row level security;
create policy "targets: own all" on public.pillar_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- new-user trigger: create profile + default targets
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  insert into public.pillar_targets (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- items (planner core) ----------
create table public.items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  pillar       pillar not null,
  type         item_type not null default 'task',
  date         date not null,
  start_time   time,
  duration_min int not null default 60 check (duration_min between 5 and 1440),
  done         boolean not null default false,
  rrule        text,                                   -- iCal RRULE; null = one-off
  recurrence_parent uuid references public.items(id) on delete cascade,
  created_at   timestamptz not null default now()
);
alter table public.items enable row level security;
create policy "items: own all" on public.items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index items_user_date_idx on public.items (user_id, date);

-- ---------- courses (GPA) ----------
create table public.courses (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  name     text not null,
  credits  numeric(3,1) not null default 3,
  grade    text
);
alter table public.courses enable row level security;
create policy "courses: own all" on public.courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- goals & habits ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null, pillar pillar, target_date date, done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals: own all" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null, pillar pillar, streak int not null default 0,
  last_done date, created_at timestamptz not null default now()
);
alter table public.habits enable row level security;
create policy "habits: own all" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null, body text, read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications: own all" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================ BILLING (Stripe-synced) ======================
create table public.customers (
  id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text
);
alter table public.customers enable row level security;  -- private: service-role only, no policies

create table public.products (
  id text primary key, active boolean, name text, description text, image text, metadata jsonb
);
alter table public.products enable row level security;
create policy "products: public read" on public.products for select using (true);

create table public.prices (
  id text primary key,
  product_id text references public.products,
  active boolean, unit_amount bigint,
  currency text check (char_length(currency) = 3),
  interval pricing_interval, interval_count int, trial_period_days int, metadata jsonb
);
alter table public.prices enable row level security;
create policy "prices: public read" on public.prices for select using (true);

create table public.subscriptions (
  id text primary key,                                  -- Stripe subscription id
  user_id uuid not null references auth.users on delete cascade,
  status sub_status,
  price_id text references public.prices,
  quantity int,
  cancel_at_period_end boolean,
  created timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz not null default now(),
  ended_at timestamptz, cancel_at timestamptz, canceled_at timestamptz,
  trial_start timestamptz, trial_end timestamptz, metadata jsonb
);
alter table public.subscriptions enable row level security;
create policy "subscriptions: own read" on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());

-- ============================ STUDENT VERIFICATION =========================
create table public.university_domains (
  domain text primary key, university text, auto_approve boolean not null default true
);
alter table public.university_domains enable row level security;
create policy "domains: public read" on public.university_domains for select using (true);

create table public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  method text not null,                                 -- 'email_domain' | 'id_upload'
  evidence_url text,                                    -- private Storage path
  status verify_status not null default 'pending',
  reviewed_by uuid references auth.users, reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.student_verifications enable row level security;
create policy "verifications: own"   on public.student_verifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "verifications: admin" on public.student_verifications for select using (public.is_admin());

-- ============================ ADMIN / SECURITY =============================
create table public.feature_flags (
  key text primary key, enabled boolean not null default false, rollout int not null default 0, description text
);
alter table public.feature_flags enable row level security;
create policy "flags: public read" on public.feature_flags for select using (true);
create policy "flags: admin write" on public.feature_flags for all using (public.is_admin()) with check (public.is_admin());

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users, action text not null, target text, meta jsonb,
  ip inet, created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit: admin read" on public.audit_log for select using (public.is_admin());

-- seed a few university domains for auto-approve
insert into public.university_domains (domain, university, auto_approve) values
  ('univ.fr','Universités françaises', true),
  ('etu.u-paris.fr','Université Paris Cité', true),
  ('sorbonne-universite.fr','Sorbonne Université', true),
  ('edu','Établissements .edu', true)
on conflict do nothing;
