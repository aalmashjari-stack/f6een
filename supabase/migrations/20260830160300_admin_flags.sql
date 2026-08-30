-- لوحة الإدارة — طابور مراجعة الأسئلة.
--
-- يحلّ محلّ `admin_reports` التي كانت تمشّط حالات الجلسات: تلك تعدّ ما كُتب
-- في لقطة كل جلسة، وهذه تقرأ سجلّاً صريحاً فيه الحالة وعدد الحسابات
-- المختلفة وآخر بلاغ — والقرار يُكتب عليها.

create function public.admin_flags()
returns table (
  question_id text,
  status      text,
  reports     integer,
  first_at    timestamptz,
  last_at     timestamptz,
  note        text,
  reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.question_id, f.status, f.reports, f.first_at, f.last_at, f.note, f.reviewed_at
  from public.question_flags f
  where public.is_admin()
  order by (f.status = 'pending') desc, f.last_at desc;
$$;

revoke execute on function public.admin_flags() from public, anon;
grant  execute on function public.admin_flags() to authenticated;
