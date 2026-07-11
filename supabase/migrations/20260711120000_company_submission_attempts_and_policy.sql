-- Rate limiting and abuse tracking for company submission requests
-- (service role only; no public access — same posture as meetup_submission_attempts)

create table if not exists public.company_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists company_submission_attempts_ip_created_idx
  on public.company_submission_attempts (ip_hash, created_at desc);

create index if not exists company_submission_attempts_payload_created_idx
  on public.company_submission_attempts (payload_hash, created_at desc);

alter table public.company_submission_attempts enable row level security;

revoke all on public.company_submission_attempts from anon, authenticated;

-- Close the stale anon/authenticated insert surface; inserts go through the
-- server action's service-role client only.
drop policy if exists "Anyone can create company submission requests"
on public.company_submission_requests;
