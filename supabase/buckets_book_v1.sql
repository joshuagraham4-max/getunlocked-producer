-- Contactually buckets + "book" (mine vs past LO fundings). Oct 30, 2026. Additive.
alter table public.contacts add column if not exists buckets text[] not null default '{}',   -- original Contactually bucket names (editable)
                            add column if not exists book text;                              -- past clients: 'mine' | 'past LO'
create index if not exists contacts_book_idx on public.contacts (user_id, book);
-- Backfill (done once, Oct 30): buckets matched by email/phone from the 2022 Contactually bucket exports;
-- book = 'past LO' when tagged 'past lo fundings' (Konnectd), else 'mine'; co-borrowers inherit the borrower's book.
-- Backup before this step: contacts_backup_20261030c.
