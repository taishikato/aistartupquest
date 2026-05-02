create or replace view public.published_upcoming_meetups
with (security_barrier = true)
as
select
  slug,
  city,
  title,
  description,
  venue_name,
  location_label,
  latitude,
  longitude,
  starts_at,
  ends_at,
  organizer_name,
  event_url,
  status
from public.meetups
where
  status = 'published'
  and (
    (ends_at is not null and ends_at >= now())
    or (ends_at is null and starts_at >= now() - interval '2 hours')
  );

drop policy if exists "Published meetups are publicly readable" on public.meetups;
revoke select on public.meetups from anon, authenticated;
revoke all on public.published_upcoming_meetups from anon, authenticated;
grant select on public.published_upcoming_meetups to anon, authenticated;
