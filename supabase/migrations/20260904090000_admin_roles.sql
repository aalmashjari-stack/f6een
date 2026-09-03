-- دوران للإدارة: **مدير عامّ** و**محرّر أسئلة**.
--
-- كان الدور واحداً: من كان في `public.admins` فتحت له اللوحةُ كلَّها —
-- الحسابات والأرصدة وأكواد الهدية والرسائل. وطلبُ علي (٤ سبتمبر ٢٠٢٦) أن
-- يستعين بمن يثق به في الأسئلة وحدها، فلزم فصلُ الصلاحيتين.
--
-- **`super`**  — كلُّ شيء، ومنه منحُ الأدوار وسحبُها.
-- **`editor`** — كلُّ ما يتعلّق بالأسئلة: إضافةً وتعديلاً وحذفاً ورفعاً
--                بالجملة، والفئاتِ وصورَها، وطابورَ البلاغات. ولا يرى
--                حساباً ولا رصيداً ولا كوداً ولا رسالة.
--
-- والقائم اليوم في الجدول يصير `super` بحكم القيمة الافتراضية — فلا تنقلب
-- صلاحيةُ أحدٍ بتطبيق هذه الهجرة.
--
-- **الحارس في القاعدة لا في الواجهة.** إخفاءُ لسانٍ في اللوحة زينةٌ لا
-- حماية: المفتاح العلنيّ في يد كلّ لاعب، ومن عدّل سطراً في المتصفّح نادى
-- الدالّة مباشرة. فكلُّ نداءٍ ماليّ أو حسابيّ يشترط `is_super()` أدناه.

alter table public.admins
  add column if not exists role text not null default 'super'
  check (role in ('super', 'editor'));

comment on table public.admins is
  'حسابات الإدارة ودورُها. المدير العامّ يمنح ويسحب من لوحة الإدارة.';
comment on column public.admins.role is
  'super = كلّ شيء · editor = الأسئلة وحدها (انظر admin_set_admin).';

-- هل الحسابُ الحاليّ مديرٌ عامّ؟ نظيرةُ `is_admin()` بدورٍ محدّد.
create function public.is_super()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
     where a.id = (select auth.uid()) and a.role = 'super'
  );
$$;

revoke execute on function public.is_super() from public, anon;
grant  execute on function public.is_super() to authenticated;

-- منحُ الدور وسحبُه — للمدير العامّ وحده.
--
-- `p_role` فارغ = سحبُ الصلاحية كلّها.
--
-- **ولا يغيّر المديرُ دورَ نفسه.** هذا القيدُ وحده يضمن ألّا تخلو القاعدة
-- من مديرٍ عامّ: لا أحد يعزل نفسه، فيبقى العازلُ قائماً دائماً. ولولاه
-- لأغلق مديرٌ البابَ على نفسه بضغطة، ولا سبيل بعدها إلّا محرّر SQL.
create function public.admin_set_admin(p_user uuid, p_role text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := nullif(btrim(coalesce(p_role, '')), '');
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;

  if p_user is null then
    raise exception 'no_such_user';
  end if;

  if p_user = (select auth.uid()) then
    raise exception 'cannot_change_self';
  end if;

  if wanted is not null and wanted not in ('super', 'editor') then
    raise exception 'bad_role';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user) then
    raise exception 'no_such_user';
  end if;

  if wanted is null then
    delete from public.admins a where a.id = p_user;
    return 'none';
  end if;

  insert into public.admins (id, role) values (p_user, wanted)
  on conflict (id) do update set role = excluded.role;

  return wanted;
end;
$$;

revoke execute on function public.admin_set_admin(uuid, text) from public, anon;
grant  execute on function public.admin_set_admin(uuid, text) to authenticated;

-- قائمة الحسابات تحمل الدور ليُعرض في اللوحة — فتغيّر توقيعُها ووجب حذفُها أوّلاً.
drop function if exists public.admin_users();

create function public.admin_users()
returns table (
  id             uuid,
  email          text,
  name           text,
  phone          text,
  birth_date     text,
  joined_at      timestamptz,
  balance        integer,
  games          integer,
  last_game      timestamptz,
  questions_seen integer,
  role           text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    nullif(btrim(coalesce(
      u.raw_user_meta_data ->> 'full_name',
      concat_ws(' ',
        u.raw_user_meta_data ->> 'first_name',
        u.raw_user_meta_data ->> 'last_name')
    )), '') as name,
    u.raw_user_meta_data ->> 'phone'      as phone,
    u.raw_user_meta_data ->> 'birth_date' as birth_date,
    u.created_at,
    p.games_balance,
    (select count(*) from public.sessions s where s.user_id = u.id)::int,
    (select max(s.created_at) from public.sessions s where s.user_id = u.id),
    (select count(*) from public.used_questions q where q.user_id = u.id)::int,
    a.role
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.admins   a on a.id = u.id
  where public.is_super()
  order by u.created_at desc;
$$;

revoke execute on function public.admin_users() from public, anon;
grant  execute on function public.admin_users() to authenticated;

-- ما يلي أجسامٌ لم تتغيّر — حارسُها وحده صار `is_super()`.


create or replace function public.admin_set_balance(p_user uuid, p_balance integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;

  if p_balance is null or p_balance < 0 then
    raise exception 'bad_balance';
  end if;

  update public.profiles set games_balance = p_balance where id = p_user;

  if not found then
    raise exception 'no_such_user';
  end if;

  return p_balance;
end;
$$;


revoke execute on function public.admin_set_balance(uuid, integer) from public, anon;
grant  execute on function public.admin_set_balance(uuid, integer) to authenticated;

create or replace function public.admin_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'users',        (select count(*) from auth.users),
    'balance',      (select coalesce(sum(p.games_balance), 0) from public.profiles p),
    'sessions',     (select count(*) from public.sessions),
    'open',         (select count(*) from public.sessions s where s.status = 'open'),
    'finished',     (select count(*) from public.sessions s where s.status = 'finished'),
    'abandoned',    (select count(*) from public.sessions s where s.status = 'abandoned'),
    'codes',        (select count(*) from public.gift_codes),
    'redemptions',  (select count(*) from public.gift_redemptions),
    'played_today', (select count(*) from public.sessions s
                      where s.created_at >= date_trunc('day', now()))
  )
  where public.is_super();
$$;


revoke execute on function public.admin_stats() from public, anon;
grant  execute on function public.admin_stats() to authenticated;

create or replace function public.admin_sessions(p_limit integer default 200)
returns table (
  id         uuid,
  user_id    uuid,
  email      text,
  status     text,
  created_at timestamptz,
  updated_at timestamptz,
  teams      jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.user_id, u.email::text, s.status, s.created_at, s.updated_at,
         s.state -> 'teams'
  from public.sessions s
  join auth.users u on u.id = s.user_id
  where public.is_super()
  order by s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
$$;


revoke execute on function public.admin_sessions(integer) from public, anon;
grant  execute on function public.admin_sessions(integer) to authenticated;

create or replace function public.admin_gift_codes()
returns table (
  code            text,
  games           integer,
  max_redemptions integer,
  expires_at      timestamptz,
  owner           text,
  created_at      timestamptz,
  redeemed        integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.code, g.games, g.max_redemptions, g.expires_at, g.owner, g.created_at,
         (select count(*) from public.gift_redemptions r where r.code = g.code)::int
  from public.gift_codes g
  where public.is_super()
  order by g.created_at desc;
$$;


revoke execute on function public.admin_gift_codes() from public, anon;
grant  execute on function public.admin_gift_codes() to authenticated;

create or replace function public.admin_create_gift_code(
  p_code    text,
  p_games   integer default 1,
  p_max     integer default null,
  p_expires timestamptz default null,
  p_owner   text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := upper(btrim(coalesce(p_code, '')));
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;

  if length(clean) < 3 then
    raise exception 'code_too_short';
  end if;

  if p_games is null or p_games < 1 then
    raise exception 'bad_games';
  end if;

  insert into public.gift_codes (code, games, max_redemptions, expires_at, owner)
  values (clean, p_games, p_max, p_expires, nullif(btrim(coalesce(p_owner, '')), ''));

  return clean;

exception
  when unique_violation then
    raise exception 'code_exists';
end;
$$;


revoke execute on function public.admin_create_gift_code(text, integer, integer, timestamptz, text) from public, anon;
grant  execute on function public.admin_create_gift_code(text, integer, integer, timestamptz, text) to authenticated;

create or replace function public.admin_delete_gift_code(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;

  delete from public.gift_codes where code = upper(btrim(p_code));

  if not found then
    raise exception 'code_not_found';
  end if;
end;
$$;


revoke execute on function public.admin_delete_gift_code(text) from public, anon;
grant  execute on function public.admin_delete_gift_code(text) to authenticated;

create or replace function public.admin_messages(p_limit integer default 200)
returns table (
  id         uuid,
  email      text,
  body       text,
  status     text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.email, m.body, m.status, m.created_at
    from public.messages m
   where public.is_super()
   order by m.created_at desc
   limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;


revoke execute on function public.admin_messages(integer) from public, anon;
grant  execute on function public.admin_messages(integer) to authenticated;

create or replace function public.admin_set_message_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;

  if p_status not in ('new', 'read', 'done') then
    raise exception 'bad_status';
  end if;

  update public.messages set status = p_status where id = p_id;
end;
$$;


revoke execute on function public.admin_set_message_status(uuid, text) from public, anon;
grant  execute on function public.admin_set_message_status(uuid, text) to authenticated;

-- وسياساتُ القراءة المباشرة كذلك: لو بقيت على `is_admin()` لقرأ المحرّرُ
-- جدولَ الحسابات والأرصدة من واجهة الجداول رغم إقفال الدوالّ في وجهه.
drop policy if exists "profiles: admin reads all"          on public.profiles;
drop policy if exists "sessions: admin reads all"          on public.sessions;
drop policy if exists "used_questions: admin reads all"    on public.used_questions;
drop policy if exists "gift_codes: admin reads all"        on public.gift_codes;
drop policy if exists "gift_redemptions: admin reads all"  on public.gift_redemptions;

create policy "profiles: super reads all"
  on public.profiles for select using (public.is_super());
create policy "sessions: super reads all"
  on public.sessions for select using (public.is_super());
create policy "used_questions: super reads all"
  on public.used_questions for select using (public.is_super());
create policy "gift_codes: super reads all"
  on public.gift_codes for select using (public.is_super());
create policy "gift_redemptions: super reads all"
  on public.gift_redemptions for select using (public.is_super());
