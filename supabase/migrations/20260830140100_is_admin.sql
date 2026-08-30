-- لوحة الإدارة (٢) — الحارس.
--
-- تُنادى داخل سياسات RLS وداخل كل دالّة إدارة. `stable` لا `volatile` كي
-- يقيّمها المخطّط مرّة لكل استعلام لا مرّة لكل صفّ.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
