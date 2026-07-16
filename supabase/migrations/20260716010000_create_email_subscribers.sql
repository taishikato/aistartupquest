-- Email subscribers for quest herald alerts (new startups & meetups).
-- Writes go through the server action's service-role client only.

create table if not exists public.email_subscribers (
  id bigint generated always as identity primary key,
  email text not null,
  source text not null default 'map_footer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz,
  constraint email_subscribers_email_len check (
    char_length(btrim(email)) between 3 and 255
  ),
  constraint email_subscribers_source_len check (
    char_length(btrim(source)) between 1 and 64
  )
);

-- Case-insensitive uniqueness on trimmed email
create unique index if not exists email_subscribers_email_lower_uidx
  on public.email_subscribers (lower(btrim(email)));

create index if not exists email_subscribers_created_at_idx
  on public.email_subscribers (created_at desc);

drop trigger if exists set_email_subscribers_updated_at on public.email_subscribers;

create trigger set_email_subscribers_updated_at
before update on public.email_subscribers
for each row
execute function public.set_updated_at();

alter table public.email_subscribers enable row level security;

revoke all on public.email_subscribers from anon, authenticated;
revoke all on sequence public.email_subscribers_id_seq from anon, authenticated;
