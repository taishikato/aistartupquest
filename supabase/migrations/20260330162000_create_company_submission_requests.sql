create table if not exists public.company_submission_requests (
  id bigint generated always as identity primary key,
  city text not null,
  company_name text not null,
  website text,
  contact_email text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint company_submission_requests_city_check check (
    city in ('sf', 'toronto')
  ),
  constraint company_submission_requests_company_name_check check (
    char_length(btrim(company_name)) between 2 and 120
  ),
  constraint company_submission_requests_website_check check (
    website is null or char_length(btrim(website)) between 8 and 255
  ),
  constraint company_submission_requests_contact_email_check check (
    contact_email is null or char_length(btrim(contact_email)) between 3 and 255
  ),
  constraint company_submission_requests_notes_check check (
    notes is null or char_length(notes) <= 1000
  ),
  constraint company_submission_requests_status_check check (
    status in ('pending', 'reviewed', 'approved', 'rejected')
  )
);

create index if not exists company_submission_requests_city_status_created_at_idx
  on public.company_submission_requests (city, status, created_at desc);

drop trigger if exists set_company_submission_requests_updated_at
on public.company_submission_requests;

create trigger set_company_submission_requests_updated_at
before update on public.company_submission_requests
for each row
execute function public.set_updated_at();

alter table public.company_submission_requests enable row level security;

drop policy if exists "Anyone can create company submission requests"
on public.company_submission_requests;

create policy "Anyone can create company submission requests"
on public.company_submission_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and char_length(btrim(company_name)) between 2 and 120
  and (website is null or char_length(btrim(website)) between 8 and 255)
  and (contact_email is null or char_length(btrim(contact_email)) between 3 and 255)
  and (notes is null or char_length(notes) <= 1000)
);

revoke all on public.company_submission_requests from anon, authenticated;
grant insert on public.company_submission_requests to anon, authenticated;
grant usage, select on sequence public.company_submission_requests_id_seq to anon, authenticated;
