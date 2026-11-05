-- Team list shows only active users. Blocked accounts (auth.users.banned_until set) are marked inactive.
alter table public.profiles add column if not exists active boolean not null default true;
update public.profiles p set active = (u.banned_until is null) from auth.users u where u.id = p.id;
