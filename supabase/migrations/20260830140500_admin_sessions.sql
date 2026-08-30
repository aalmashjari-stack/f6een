-- لوحة الإدارة (٦) — الجلسات كلّها.
--
-- `state->'teams'` لا `state` كاملاً: العمود يحمل طابور المرحلة الثالثة
-- بنصوص أسئلته وذاكرة الأسئلة كاملةً، فقراءته لمئة جلسة تنقل ميغابايتات
-- لعرض اسمين ورقمين.

create function public.admin_sessions(p_limit integer default 200)
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
  where public.is_admin()
  order by s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
$$;

revoke execute on function public.admin_sessions(integer) from public, anon;
grant  execute on function public.admin_sessions(integer) to authenticated;
