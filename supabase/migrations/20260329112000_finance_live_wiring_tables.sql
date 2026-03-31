-- Finance dashboard live wiring: ad spend, admin notes, reports, and strikes.

create table if not exists public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  url text not null default '',
  status text not null default 'active' check (status in ('active', 'cancelled')),
  recurring_cost numeric(12,2) not null default 0 check (recurring_cost >= 0),
  cost_cadence text not null default 'mo' check (cost_cadence in ('mo', 'yr')),
  start_date date null,
  spent_override numeric(12,2) null check (spent_override is null or spent_override >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_spend_status_idx
  on public.ad_spend (status, created_at desc);

create index if not exists ad_spend_created_by_idx
  on public.ad_spend (created_by, created_at desc);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  note_key text not null unique,
  content_html text not null default '',
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_notes_note_key_idx
  on public.admin_notes (note_key);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  accused_user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid null references public.stories(id) on delete set null,
  reason text not null,
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_idx
  on public.reports (status, created_at desc);

create index if not exists reports_accused_idx
  on public.reports (accused_user_id, created_at desc);

create index if not exists reports_reporter_idx
  on public.reports (reporter_user_id, created_at desc);

create table if not exists public.user_strikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid null references public.reports(id) on delete set null,
  reason text not null,
  points integer not null default 1 check (points >= 0),
  note text not null default '',
  status text not null default 'active' check (status in ('active', 'reversed')),
  issued_by uuid null references auth.users(id) on delete set null,
  issued_at timestamptz not null default now(),
  falls_off_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_strikes_user_idx
  on public.user_strikes (user_id, issued_at desc);

create index if not exists user_strikes_status_idx
  on public.user_strikes (status, issued_at desc);

create or replace function public.set_updated_at_finance_live_tables()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ad_spend_updated_at on public.ad_spend;
create trigger trg_ad_spend_updated_at
before update on public.ad_spend
for each row
execute function public.set_updated_at_finance_live_tables();

drop trigger if exists trg_admin_notes_updated_at on public.admin_notes;
create trigger trg_admin_notes_updated_at
before update on public.admin_notes
for each row
execute function public.set_updated_at_finance_live_tables();

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
before update on public.reports
for each row
execute function public.set_updated_at_finance_live_tables();

drop trigger if exists trg_user_strikes_updated_at on public.user_strikes;
create trigger trg_user_strikes_updated_at
before update on public.user_strikes
for each row
execute function public.set_updated_at_finance_live_tables();

alter table public.ad_spend enable row level security;
alter table public.admin_notes enable row level security;
alter table public.reports enable row level security;
alter table public.user_strikes enable row level security;

drop policy if exists "Admins can view ad spend" on public.ad_spend;
create policy "Admins can view ad spend"
on public.ad_spend
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert ad spend" on public.ad_spend;
create policy "Admins can insert ad spend"
on public.ad_spend
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update ad spend" on public.ad_spend;
create policy "Admins can update ad spend"
on public.ad_spend
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete ad spend" on public.ad_spend;
create policy "Admins can delete ad spend"
on public.ad_spend
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can view admin notes" on public.admin_notes;
create policy "Admins can view admin notes"
on public.admin_notes
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert admin notes" on public.admin_notes;
create policy "Admins can insert admin notes"
on public.admin_notes
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update admin notes" on public.admin_notes;
create policy "Admins can update admin notes"
on public.admin_notes
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete admin notes" on public.admin_notes;
create policy "Admins can delete admin notes"
on public.admin_notes
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can view reports" on public.reports;
create policy "Admins can view reports"
on public.reports
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
on public.reports
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
on public.reports
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own submitted reports" on public.reports;
create policy "Users can view own submitted reports"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_user_id);

drop policy if exists "Admins can view user strikes" on public.user_strikes;
create policy "Admins can view user strikes"
on public.user_strikes
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert user strikes" on public.user_strikes;
create policy "Admins can insert user strikes"
on public.user_strikes
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update user strikes" on public.user_strikes;
create policy "Admins can update user strikes"
on public.user_strikes
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete user strikes" on public.user_strikes;
create policy "Admins can delete user strikes"
on public.user_strikes
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own strikes" on public.user_strikes;
create policy "Users can view own strikes"
on public.user_strikes
for select
to authenticated
using (auth.uid() = user_id);
