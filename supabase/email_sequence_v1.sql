-- Reconnect email sequence: 3 emails per contact, sent by hand from the app.
-- email_step: 0 = not started, 1-3 = emails sent, 99 = done (replied or stopped).
alter table public.contacts add column if not exists email_step int not null default 0;
alter table public.contacts add column if not exists email_next date;
create index if not exists contacts_email_due_idx on public.contacts(user_id, email_step, email_next);
