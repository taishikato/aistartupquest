alter table public.company_submission_requests
add column if not exists short_description text,
add column if not exists category text,
add column if not exists founded integer;

update public.company_submission_requests
set
  short_description = coalesce(short_description, ''),
  category = coalesce(category, 'Vertical AI'),
  founded = coalesce(founded, 2024)
where
  short_description is null
  or category is null
  or founded is null;

alter table public.company_submission_requests
alter column short_description set not null,
alter column category set not null,
alter column founded set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_submission_requests_short_description_check'
      and conrelid = 'public.company_submission_requests'::regclass
  ) then
    alter table public.company_submission_requests
    add constraint company_submission_requests_short_description_check check (
      char_length(btrim(short_description)) between 20 and 280
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_submission_requests_category_check'
      and conrelid = 'public.company_submission_requests'::regclass
  ) then
    alter table public.company_submission_requests
    add constraint company_submission_requests_category_check check (
      category in (
        'Core Labs',
        'Consumer AI',
        'Devtools',
        'Infra',
        'Agents',
        'Vertical AI'
      )
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_submission_requests_founded_check'
      and conrelid = 'public.company_submission_requests'::regclass
  ) then
    alter table public.company_submission_requests
    add constraint company_submission_requests_founded_check check (
      founded between 1900 and 2100
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
  and (website is null or char_length(btrim(website)) between 8 and 255)
  and (contact_email is null or char_length(btrim(contact_email)) between 3 and 255)
  and (notes is null or char_length(notes) <= 1000)
);
