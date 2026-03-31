alter table public.companies
drop constraint if exists companies_city_check;

alter table public.companies
add constraint companies_city_check check (
  city in ('sf', 'toronto', 'ny', 'london', 'vancouver')
);
