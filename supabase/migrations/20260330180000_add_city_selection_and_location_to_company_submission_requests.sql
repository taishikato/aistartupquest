alter table public.company_submission_requests
add column if not exists location_label text;

update public.company_submission_requests
set location_label = coalesce(location_label, '')
where location_label is null;

alter table public.company_submission_requests
alter column location_label set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_submission_requests_location_label_check'
      and conrelid = 'public.company_submission_requests'::regclass
  ) then
    alter table public.company_submission_requests
    add constraint company_submission_requests_location_label_check check (
      char_length(btrim(location_label)) between 4 and 200
    );
  end if;
end $$;

drop policy if exists "Anyone can create company submission requests"
on public.company_submission_requests;

create policy "Anyone can create company submission requests"
on public.company_submission_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and city in ('sf', 'toronto')
  and char_length(btrim(company_name)) between 2 and 120
  and char_length(btrim(short_description)) between 20 and 280
  and category in (
    'Core Labs',
    'Consumer AI',
    'Devtools',
    'Infra',
    'Agents',
    'Vertical AI'
  )
  and founded between 1900 and 2100
  and char_length(btrim(location_label)) between 4 and 200
  and (website is null or char_length(btrim(website)) between 8 and 255)
  and (contact_email is null or char_length(btrim(contact_email)) between 3 and 255)
  and (notes is null or char_length(notes) <= 1000)
);
