-- لوحة الإدارة (٤) — كل الحسابات.
--
-- البريد والاسم والهاتف والميلاد تعيش في `auth.users` وهو **غير مكشوف**
-- للعميل بأي سياسة. الوصول الوحيد دالّةٌ `security definer` تحرسها
-- `is_admin()`، فتُقرأ من الواجهة ولا يُفتح المخطّط `auth` نفسه.
--
-- والحارس شرطٌ في `where` لا `raise`: الدالّة `language sql` وتُرجع صفر
-- صفوف لغير المدير — لا رسالة تفرّق بين «لست مديراً» و«لا حسابات».

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
  questions_seen integer
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
    (select count(*) from public.used_questions q where q.user_id = u.id)::int
  from auth.users u
  left join public.profiles p on p.id = u.id
  where public.is_admin()
  order by u.created_at desc;
$$;

revoke execute on function public.admin_users() from public, anon;
grant  execute on function public.admin_users() to authenticated;
