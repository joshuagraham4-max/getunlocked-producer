-- Bounced emails: flag the address as bad so it leaves the email list and goes to a call to get a new one.
alter table public.contacts add column if not exists email_bad boolean not null default false;
