-- طبقة الأسئلة كما يقرؤها اللاعب — الحقول وحدها بلا أثر إداريّ.
--
-- تُقرأ مرّة عند الإقلاع وتُخزَّن محلّياً، كقائمة المحجوز تماماً: اللعبة
-- تعمل بلا إنترنت، فلا ينتظر سحبُ سؤالٍ شبكةً.

create function public.question_overlay()
returns table (
  question_id text,
  category    text,
  level       text,
  topic       text,
  question    text,
  answer      text,
  image       text
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.question_id, o.category, o.level, o.topic, o.question, o.answer, o.image
  from public.question_overrides o;
$$;

revoke execute on function public.question_overlay() from public, anon;
grant  execute on function public.question_overlay() to authenticated;
