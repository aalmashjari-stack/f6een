-- رفع الدفعة يحفظ صورة السؤال (٤ سبتمبر ٢٠٢٦).
--
-- كان تعديلُ سؤالٍ من ملفٍّ يُنشئ صفَّ الطبقة بلا `image`: من صحّح اسمَ صاحب
-- صورةٍ في «مشاهير» بملفّ CSV وجد السؤال يعود نصّاً عارياً «من صاحب الصورة؟»
-- بلا صورة — لأنّ صفّ الطبقة يحلّ محلّ سؤال البنك كلّه لا حقلاً منه.
--
-- اللوحة تحمل البنك فتعرف صورة كلّ معرّف، وصارت تُرسلها مع صفّ التعديل
-- (`ImportRow.image`)؛ وهنا تُحفظ. والصفّ الذي لا يحملها لا يمحو ما كان
-- (`coalesce` عند التعارض) — فملفٌّ قديم بلا العمود لا يُفسد صورةً.
--
-- `create or replace` على دالّةٍ قائمة بالتوقيع نفسه، فلا حذفَ قبلها.
-- تُلصق وحدها في تشغيلٍ مستقلّ كبقيّة الدوالّ.

create or replace function public.admin_import_questions(p_rows jsonb)
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
      (question_id, category, level, topic, question, answer, image, origin, updated_by)
    values
      (qid, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       nullif(btrim(coalesce(r ->> 'image', '')), ''),
       kind, (select auth.uid()))
    on conflict (question_id) do update
      set category   = excluded.category,
          level      = excluded.level,
          topic      = excluded.topic,
          question   = excluded.question,
          answer     = excluded.answer,
          -- الصورة لا تُمحى بصفٍّ لا يحملها؛ تُبدَّل حين يحملها فقط.
          image      = coalesce(excluded.image, public.question_overrides.image),
          updated_at = now(),
          updated_by = excluded.updated_by;
  end loop;

  return jsonb_build_object('added', added, 'updated', updated);
end;
$$;

revoke execute on function public.admin_import_questions(jsonb) from public, anon;
grant  execute on function public.admin_import_questions(jsonb) to authenticated;
