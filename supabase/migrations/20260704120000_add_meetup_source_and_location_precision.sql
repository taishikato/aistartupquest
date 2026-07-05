alter table public.meetups
  add column source text not null default 'community',
  add column location_precision text not null default 'exact',
  add column source_event_id text;

alter table public.meetups
  add constraint meetups_source_check
    check (source in ('community', 'cursor')),
  add constraint meetups_location_precision_check
    check (location_precision in ('exact', 'city'));

create unique index meetups_source_source_event_id_key
  on public.meetups (source, source_event_id);

create or replace view public.published_upcoming_meetups
  with (security_barrier = true) as
select
  slug,
  city,
  title,
  description,
  venue_name,
  location_label,
  latitude,
  longitude,
  event_date,
  organizer_name,
  event_url,
  status,
  source,
  location_precision
from meetups
where
  status = 'published'::text
  and event_date >=
    case city
      when 'sf'::text then (now() at time zone 'America/Los_Angeles'::text)::date
      when 'toronto'::text then (now() at time zone 'America/Toronto'::text)::date
      when 'ny'::text then (now() at time zone 'America/New_York'::text)::date
      when 'london'::text then (now() at time zone 'Europe/London'::text)::date
      when 'vancouver'::text then (now() at time zone 'America/Vancouver'::text)::date
      when 'tokyo'::text then (now() at time zone 'Asia/Tokyo'::text)::date
      else current_date
    end;
