create table if not exists public.ai_usage_test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid null references public.stories(id) on delete set null,
  conversation_id uuid null references public.conversations(id) on delete set null,
  scenario_name text not null default '',
  conversation_name text not null default '',
  status text not null default 'active' check (status in ('active', 'ended')),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_usage_test_sessions_user_idx
  on public.ai_usage_test_sessions (user_id, started_at desc);

create index if not exists ai_usage_test_sessions_status_idx
  on public.ai_usage_test_sessions (status, started_at desc);

create table if not exists public.ai_usage_test_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_usage_test_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  api_call_group text null,
  event_source text not null default 'client',
  model_id text null,
  input_chars integer not null default 0,
  output_chars integer not null default 0,
  input_tokens_est integer not null default 0,
  output_tokens_est integer not null default 0,
  total_tokens_est integer not null default 0,
  est_cost_usd numeric(12,6) not null default 0,
  latency_ms integer null,
  status text not null default 'ok',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (input_chars >= 0),
  check (output_chars >= 0),
  check (input_tokens_est >= 0),
  check (output_tokens_est >= 0),
  check (total_tokens_est >= 0),
  check (est_cost_usd >= 0)
);

create index if not exists ai_usage_test_events_session_idx
  on public.ai_usage_test_events (session_id, created_at desc);

create index if not exists ai_usage_test_events_user_idx
  on public.ai_usage_test_events (user_id, created_at desc);

create index if not exists ai_usage_test_events_event_key_idx
  on public.ai_usage_test_events (event_key, created_at desc);

create index if not exists ai_usage_test_events_call_group_idx
  on public.ai_usage_test_events (api_call_group, created_at desc);

create or replace function public.set_updated_at_ai_usage_test_sessions()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_usage_test_sessions_updated_at on public.ai_usage_test_sessions;
create trigger trg_ai_usage_test_sessions_updated_at
before update on public.ai_usage_test_sessions
for each row
execute function public.set_updated_at_ai_usage_test_sessions();

alter table public.ai_usage_test_sessions enable row level security;
alter table public.ai_usage_test_events enable row level security;

drop policy if exists "Users can insert own test sessions" on public.ai_usage_test_sessions;
create policy "Users can insert own test sessions"
on public.ai_usage_test_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own test sessions" on public.ai_usage_test_sessions;
create policy "Users can update own test sessions"
on public.ai_usage_test_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own test sessions" on public.ai_usage_test_sessions;
create policy "Users can view own test sessions"
on public.ai_usage_test_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all test sessions" on public.ai_usage_test_sessions;
create policy "Admins can view all test sessions"
on public.ai_usage_test_sessions
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can insert own test events" on public.ai_usage_test_events;
create policy "Users can insert own test events"
on public.ai_usage_test_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view own test events" on public.ai_usage_test_events;
create policy "Users can view own test events"
on public.ai_usage_test_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all test events" on public.ai_usage_test_events;
create policy "Admins can view all test events"
on public.ai_usage_test_events
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
