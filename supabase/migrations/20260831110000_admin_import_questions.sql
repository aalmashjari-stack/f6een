-- لوحة الإدارة — رفع دفعة أسئلة من ملفّ.
--
-- **الدفعة كلّها في معاملة واحدة**: خمسمئة نداء متتابع من المتصفّح تعني
-- ملفّاً يدخل نصفه ثمّ تنقطع الشبكة، فلا يعرف المدير أين وقف. هنا إمّا أن
-- يدخل ما أُرسل كلّه أو لا شيء منه.
--
-- **والتحقّق من الفئة في العميل لا هنا**: الفئات المشحونة تعيش في ملفّ
-- التطبيق ولا تعرفها القاعدة. فاللوحة ترفض الصفوف بفئةٍ لا وجود لها قبل
-- الإرسال، وهذه الدالّة تحرس ما تعرفه: المستوى، وألّا يكون سؤالٌ أو إجابة
-- فارغاً.
--
-- والصفّ بمعرّف = تعديل سؤالٍ قائم (بنكاً كان أو مضافاً)، وبلا معرّف =
-- سؤال جديد يأخذ `ADM####` من التسلسل نفسه.

create function public.admin_import_questions(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r       jsonb;
  qid     text;
  kind    text;
  added   integer := 0;
  updated integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'bad_payload';
  end if;

  if jsonb_array_length(p_rows) > 1000 then
    raise exception 'too_many_rows';
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    if btrim(coalesce(r ->> 'question', '')) = ''
       or btrim(coalesce(r ->> 'answer', '')) = '' then
      raise exception 'empty_question';
    end if;

    if btrim(coalesce(r ->> 'category', '')) = '' then
      raise exception 'no_category';
    end if;

    if (r ->> 'level') not in ('سهل', 'متوسط', 'صعب') then
      raise exception 'bad_level';
    end if;

    qid := nullif(btrim(coalesce(r ->> 'id', '')), '');

    if qid is null then
      qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');
      kind := 'new';
      added := added + 1;
    else
      select o.origin into kind from public.question_overrides o where o.question_id = qid;
      if kind is null then
        kind := 'override';
      end if;
      updated := updated + 1;
    end if;

    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, origin, updated_by)
    values
      (qid, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       kind, (select auth.uid()))
    on conflict (question_id) do update
      set category   = excluded.category,
          level      = excluded.level,
          topic      = excluded.topic,
          question   = excluded.question,
          answer     = excluded.answer,
          updated_at = now(),
          updated_by = excluded.updated_by;
  end loop;

  return jsonb_build_object('added', added, 'updated', updated);
end;
$$;

revoke execute on function public.admin_import_questions(jsonb) from public, anon;
grant  execute on function public.admin_import_questions(jsonb) to authenticated;
