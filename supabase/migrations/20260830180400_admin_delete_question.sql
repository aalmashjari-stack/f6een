-- لوحة الإدارة — حذف صفّ الطبقة.
--
-- **لسؤال البنك: تراجعٌ لا حذف.** يعود السؤال المشحون كما كان، لأنّ البنك
-- ملفٌّ في التطبيق لا صفٌّ في القاعدة — ومن أراد منعه نهائياً فطريقه
-- «ألغِه» في طابور البلاغات (`question_flags`)، وهي حالة صريحة تبقى
-- مسجّلة بدل حذفٍ صامت.
--
-- وللسؤال المضاف من اللوحة: محوٌ حقيقيّ. ولا يضرّ من رآه في جلسة سابقة:
-- ذاكرة الأسئلة تحفظ المعرّف لا النصّ.

create function public.admin_delete_question(p_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  delete from public.question_overrides o
   where o.question_id = btrim(coalesce(p_id, ''))
   returning o.origin into kind;

  if kind is null then
    raise exception 'no_such_question';
  end if;

  return kind;
end;
$$;

revoke execute on function public.admin_delete_question(text) from public, anon;
grant  execute on function public.admin_delete_question(text) to authenticated;
