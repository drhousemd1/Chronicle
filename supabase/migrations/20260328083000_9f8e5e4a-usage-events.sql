create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_source text not null default 'client',
  event_count integer not null default 1 check (event_count > 0 and event_count <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_created_at_idx
  on public.ai_usage_events (created_at desc);

create index if not exists ai_usage_events_event_type_idx
  on public.ai_usage_events (event_type);

create index if not exists ai_usage_events_user_id_idx
  on public.ai_usage_events (user_id);

alter table public.ai_usage_events enable row level security;

drop policy if exists "Users can insert own ai usage events" on public.ai_usage_events;
create policy "Users can insert own ai usage events"
on public.ai_usage_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view own ai usage events" on public.ai_usage_events;
create policy "Users can view own ai usage events"
on public.ai_usage_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all ai usage events" on public.ai_usage_events;
create policy "Admins can view all ai usage events"
on public.ai_usage_events
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
