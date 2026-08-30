-- قائمة المحجوز — ما لا يُسحب.
--
-- المعرّفات وحدها: الجهاز يحمل البنك كاملاً فيحلّها بنفسه، وملاحظات
-- المراجعة تبقى في القاعدة. وتُقرأ مرّةً عند الإقلاع وتُخزَّن محلّياً،
-- فاللعبة تعمل بلا إنترنت كما هي (SPEC ٦).

create function public.blocked_questions()
returns table (question_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select f.question_id
  from public.question_flags f
  where f.status in ('pending', 'disabled');
$$;

revoke execute on function public.blocked_questions() from public, anon;
grant  execute on function public.blocked_questions() to authenticated;
