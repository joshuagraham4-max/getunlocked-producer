-- (1) Calculator leads → Contacts automatically.  (2) Nickname-aware duplicate finder.  Oct 30, 2026. Re-runnable.

-- (1) Every new calculator lead lands in Joshua's Contacts as a Lead with a follow-up due today.
--     If the person already exists (same email or phone), that record is tagged + flagged for follow-up instead.
create or replace function public.calculator_lead_to_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner uuid := 'f43a0121-3b76-4d1e-92b5-73e685b81c52';
  d text := regexp_replace(coalesce(new.phone,''), '\D', '', 'g');
  ph text; em text := nullif(lower(trim(coalesce(new.email,''))), '');
  existing uuid;
  note text := concat_ws(' · ', to_char(now() at time zone 'America/Denver','YYYY-MM-DD'), 'Calculator lead',
                 'ref ' || new.ref, case when new.est_loan_amount is not null then 'est. loan $' || to_char(new.est_loan_amount,'FM999,999,999') end,
                 new.property_state, new.zip, new.source);
begin
  if length(d) = 11 and left(d,1) = '1' then d := substr(d,2); end if;
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) end;
  select id into existing from contacts where user_id = owner and ((em is not null and (email = em or email_2 = em)) or (ph is not null and (phone = ph or phone_2 = ph))) limit 1;
  if existing is not null then
    update contacts set follow_up_date = current_date,
      contact_note = concat_ws(E'\n', contact_note, note),
      tags = array(select distinct x from unnest(coalesce(tags,'{}') || array['calculator lead']) x)
    where id = existing;
  else
    insert into contacts (user_id, first_name, last_name, email, phone, zip, property_state, contact_type, subtype, follow_up_date,
                          contact_note, tags, source_category, source_file, external_id, do_not_contact)
    values (owner, initcap(trim(new.first_name)), initcap(trim(new.last_name)), em, ph, new.zip, new.property_state, 'lead', 'calculator lead', current_date,
            note, array['calculator lead', coalesce(new.ref,'no ref')], 'calculator', 'rental calculator', 'calc-' || new.id, false)
    on conflict (user_id, external_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists calculator_lead_to_contact on public.calculator_leads;
create trigger calculator_lead_to_contact after insert on public.calculator_leads
  for each row execute function public.calculator_lead_to_contact();

-- (2) Nicknames: Chris = Christopher, Mike = Michael, etc.
create table if not exists public.name_nicknames (nick text primary key, canon text not null);
insert into public.name_nicknames (nick, canon) values
 ('chris','christopher'),('kris','christopher'),('topher','christopher'),('mike','michael'),('mikey','michael'),('mick','michael'),
 ('bob','robert'),('bobby','robert'),('rob','robert'),('robby','robert'),('bert','robert'),('bill','william'),('billy','william'),('will','william'),('willy','william'),('liam','william'),
 ('jim','james'),('jimmy','james'),('jamie','james'),('joe','joseph'),('joey','joseph'),('tom','thomas'),('tommy','thomas'),
 ('dan','daniel'),('danny','daniel'),('dave','david'),('davey','david'),('steve','steven'),('stephen','steven'),('stevie','steven'),
 ('matt','matthew'),('matty','matthew'),('nick','nicholas'),('nicky','nicholas'),('tony','anthony'),('andy','andrew'),('drew','andrew'),
 ('ben','benjamin'),('benny','benjamin'),('alex','alexander'),('al','albert'),('rick','richard'),('ricky','richard'),('rich','richard'),('dick','richard'),
 ('ed','edward'),('eddie','edward'),('ted','edward'),('greg','gregory'),('jeff','jeffrey'),('geoff','jeffrey'),('jon','jonathan'),('johnny','john'),('jack','john'),
 ('josh','joshua'),('jake','jacob'),('sam','samuel'),('sammy','samuel'),('tim','timothy'),('timmy','timothy'),('ron','ronald'),('ronnie','ronald'),
 ('don','donald'),('donnie','donald'),('ken','kenneth'),('kenny','kenneth'),('larry','lawrence'),('pat','patrick'),('patty','patricia'),('trish','patricia'),
 ('pete','peter'),('phil','phillip'),('philip','phillip'),('ray','raymond'),('chuck','charles'),('charlie','charles'),('frank','francis'),('fran','francis'),
 ('gene','eugene'),('hank','henry'),('harry','henry'),('fred','frederick'),('freddy','frederick'),('gabe','gabriel'),('vince','vincent'),('zach','zachary'),('zack','zachary'),
 ('liz','elizabeth'),('lizzy','elizabeth'),('beth','elizabeth'),('betty','elizabeth'),('eliza','elizabeth'),('libby','elizabeth'),
 ('kate','katherine'),('katie','katherine'),('kathy','katherine'),('cathy','katherine'),('catherine','katherine'),('kat','katherine'),
 ('jen','jennifer'),('jenny','jennifer'),('jenn','jennifer'),('sue','susan'),('susie','susan'),('suzy','susan'),('meg','margaret'),('maggie','margaret'),('peggy','margaret'),
 ('becky','rebecca'),('becca','rebecca'),('vicky','victoria'),('vicki','victoria'),('vickie','victoria'),('tori','victoria'),
 ('mandy','amanda'),('manda','amanda'),('abby','abigail'),('debbie','deborah'),('deb','deborah'),('debra','deborah'),('tina','christina'),('christy','christina'),
 ('sandy','sandra'),('cindy','cynthia'),('angie','angela'),('jess','jessica'),('jessie','jessica'),('steph','stephanie'),('val','valerie'),('nikki','nicole'),
 ('pam','pamela'),('barb','barbara'),('lori','lorraine'),('terri','teresa'),('terry','teresa'),('theresa','teresa'),('mel','melissa'),('missy','melissa')
on conflict (nick) do nothing;
alter table public.name_nicknames enable row level security;
drop policy if exists "anyone reads nicknames" on public.name_nicknames;
create policy "anyone reads nicknames" on public.name_nicknames for select to authenticated using (true);

create or replace view public.contact_dupe_candidates with (security_invoker = true) as
with base as (
  select c.id, c.user_id, lower(c.first_name) fn, lower(c.last_name) ln, coalesce(n.canon, lower(c.first_name)) cfn, c.email, c.email_2, c.phone, c.phone_2
  from public.contacts c left join public.name_nicknames n on n.nick = lower(c.first_name)
  where coalesce(c.contact_type,'') <> 'rolodex'),
pairs as (
  select a.id a_id, b.id b_id, a.user_id, 'same name' reason from base a join base b on a.user_id=b.user_id and a.fn=b.fn and a.ln=b.ln and a.id<b.id
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'nickname (' || a.fn || ' / ' || b.fn || ')' from base a join base b on a.user_id=b.user_id and a.ln=b.ln and a.cfn=b.cfn and a.fn<>b.fn and a.id<>b.id
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'same email' from base a join base b on a.user_id=b.user_id and a.email=b.email and a.id<b.id
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'same email' from base a join base b on a.user_id=b.user_id and a.email=b.email_2 and a.id<>b.id
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'same phone' from base a join base b on a.user_id=b.user_id and a.phone=b.phone and a.id<b.id
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'same phone' from base a join base b on a.user_id=b.user_id and a.phone=b.phone_2 and a.id<>b.id
),
dedup as (select distinct on (a_id,b_id) a_id,b_id,user_id,reason from pairs order by a_id,b_id,reason desc)
select d.* from dedup d
where not exists (select 1 from public.contact_dupe_dismissed x where (x.a=d.a_id and x.b=d.b_id) or (x.a=d.b_id and x.b=d.a_id))
  and not exists (select 1 from public.contact_links l where (l.contact_id=d.a_id and l.linked_id=d.b_id) or (l.contact_id=d.b_id and l.linked_id=d.a_id));
