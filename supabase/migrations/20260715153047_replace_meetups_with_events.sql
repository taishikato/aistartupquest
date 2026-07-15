drop view if exists public.published_upcoming_meetups;
drop table if exists public.meetup_submission_attempts;
drop table if exists public.meetups;

create table public.events (
  id bigint generated always as identity primary key,
  source text not null,
  source_event_id text not null,
  company text not null,
  title text not null,
  description text,
  city text not null,
  latitude double precision not null,
  longitude double precision not null,
  event_timezone text not null,
  event_date date not null,
  event_url text not null,
  status text not null default 'published',
  payload_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_source_event_key unique (source, source_event_id),
  constraint events_status_check check (
    status in ('published', 'cancelled', 'hidden')
  ),
  constraint events_latitude_check check (latitude between -90 and 90),
  constraint events_longitude_check check (longitude between -180 and 180),
  constraint events_source_len check (
    char_length(btrim(source)) between 1 and 80
  ),
  constraint events_source_event_id_len check (
    char_length(btrim(source_event_id)) between 1 and 255
  ),
  constraint events_company_len check (
    char_length(btrim(company)) between 1 and 120
  ),
  constraint events_title_len check (
    char_length(btrim(title)) between 1 and 200
  ),
  constraint events_description_len check (
    description is null or char_length(description) between 1 and 5000
  ),
  constraint events_city_len check (
    char_length(btrim(city)) between 1 and 200
  ),
  constraint events_timezone_len check (
    char_length(btrim(event_timezone)) between 1 and 100
  ),
  constraint events_url_len check (
    char_length(event_url) between 1 and 2000
  )
);

create index events_status_event_date_idx
  on public.events (status, event_date);

create index events_company_event_date_idx
  on public.events (company, event_date);

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "Published events are publicly readable"
on public.events
for select
to anon, authenticated
using (status = 'published');

revoke all on public.events from anon, authenticated;

grant select (
  source,
  source_event_id,
  company,
  title,
  description,
  city,
  latitude,
  longitude,
  event_timezone,
  event_date,
  event_url,
  status
) on public.events to anon, authenticated;

create view public.published_upcoming_events
with (security_invoker = true, security_barrier = true)
as
select
  source,
  source_event_id,
  company,
  title,
  description,
  city,
  latitude,
  longitude,
  event_timezone,
  event_date,
  event_url
from public.events
where
  status = 'published'
  and event_date >= (now() at time zone event_timezone)::date;

revoke all on public.published_upcoming_events from anon, authenticated;
grant select on public.published_upcoming_events to anon, authenticated;
