/* ═══════════════════════════════════════════════════════════════════════
   `admin_questions()` تعود قيمةً واحدة — إصلاحُ نكسةٍ أدخلتُها بالأمس

   ترحيلُ «صورة الإجابة» (`20260909180000`) أعاد تعريفَ الدالّة، ونسخَ
   تعريفَها من `20260905120000_bank_in_db.sql` — وهو **ليس الأحدث**: في
   `20260905180000_admin_questions_jsonb.sql` كانت قد تحوّلت من `returns
   table` إلى `returns jsonb`، لأنّ PostgREST يقصّ أيَّ استجابة صفوفٍ عند
   ألف (`db-max-rows`) فرأى علي ١٠٠٠ من ٢٢١١ وظنّ الزرعَ ناقصاً.

   فعاد القصُّ: تصديرُ اللوحة في ١٠ سبتمبر خرج بألف صفٍّ من نحو ٣٤٠٠.

   والخطأ نفسُه الذي يتكرّر في هذا المشروع: تعريفٌ في موضعين، فيُنسخ الأقدم.
   **فمن أعاد تعريفَ دالّةٍ فليأخذ آخرَ ترحيلٍ يذكرها لا أوّلَه** —
   `grep -l "function public.<اسمها>" supabase/migrations/*.sql` ثمّ الأحدث
   زمناً.
   ═══════════════════════════════════════════════════════════════════════ */

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
      'image', o.image, 'answer_image', o.answer_image, 'family', o.family,
      'origin', o.origin, 'updated_at', o.updated_at
    ) order by o.updated_at desc)
    from public.question_overrides o
  ), '[]'::jsonb) else '[]'::jsonb end;
$$;

revoke execute on function public.admin_questions() from public, anon;
grant  execute on function public.admin_questions() to authenticated;
