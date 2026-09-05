-- لوحة الأسئلة كانت تُقصّ عند الألف (٥ سبتمبر ٢٠٢٦).
--
-- `admin_questions()` تُرجع صفوفاً، وPostgREST يحدّ أيَّ استجابة صفوفٍ
-- بألفٍ (`db-max-rows`). وما دامت القاعدة تحمل الفرقَ وحده — بضع مئات —
-- لم يظهر الحدُّ قطّ. ثمّ انتقل البنك إليها فصارت الصفوف ٢٢١١، فرأى علي
-- ألفاً وظنّ الزرعَ ناقصاً. والزرع كامل: قلبُ المفتاح نفسه لا يقع إلّا إن
-- بلغ العدد ما ترسله اللوحة.
--
-- والعلاج أن تُرجع قيمةً واحدة (jsonb) لا صفوفاً — كما تفعل
-- `question_bank()` أصلاً، ولهذا لم يمسّها الحدّ. ولا حدَّ على حجم القيمة.

drop function if exists public.admin_questions();

create function public.admin_questions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_admin() then coalesce((
    select jsonb_agg(jsonb_build_object(
      'question_id', o.question_id, 'category', o.category, 'level', o.level,
      'topic', o.topic, 'question', o.question, 'answer', o.answer,
      'image', o.image, 'family', o.family,
      'origin', o.origin, 'updated_at', o.updated_at
    ) order by o.updated_at desc)
    from public.question_overrides o
  ), '[]'::jsonb) else '[]'::jsonb end;
$$;

revoke execute on function public.admin_questions() from public, anon;
grant  execute on function public.admin_questions() to authenticated;
