-- لوحة الإدارة — الطبقة كاملة بأثرها.
--
-- البنك المشحون لا يُقرأ من هنا: اللوحة تحمله في المتصفّح كما يحمله
-- اللاعب، فتدمجه بنفسها. الذي لا تعرفه إلّا القاعدةُ هو ما عُدّل ومتى.

create function public.admin_questions()
returns table (
  question_id text,
  category    text,
  level       text,
  topic       text,
  question    text,
  answer      text,
  image       text,
  origin      text,
  updated_at  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.question_id, o.category, o.level, o.topic, o.question, o.answer, o.image,
         o.origin, o.updated_at
  from public.question_overrides o
  where public.is_admin()
  order by o.updated_at desc;
$$;

revoke execute on function public.admin_questions() from public, anon;
grant  execute on function public.admin_questions() to authenticated;
