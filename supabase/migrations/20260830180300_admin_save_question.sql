-- لوحة الإدارة — حفظ تعديل أو إضافة سؤال.
--
-- **معرّف فارغ = سؤال جديد**، ويُولَّد له معرّف `ADM####` من تسلسلٍ خاصّ:
-- معرّفات البنك المشحون (`E###` و`M###` و`X###` وأخواتها) لا تصطدم به،
-- فلا يحلّ سؤال جديد محلّ سؤالٍ قائم بالمصادفة.
--
-- ومعرّف موجود = تعديل: `origin` يبقى `new` إن كان السؤال مضافاً، ويصير
-- `override` إن كان من البنك — وعلى هذا الفرق يقوم «أعِد الأصل»: حذف صفّ
-- `override` يعيد سؤال البنك، وحذف صفّ `new` يمحو السؤال.

create function public.admin_save_question(
  p_id       text default null,
  p_category text default null,
  p_level    text default null,
  p_topic    text default null,
  p_question text default null,
  p_answer   text default null,
  p_image    text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  qid  text := nullif(btrim(coalesce(p_id, '')), '');
  fresh boolean := qid is null;
  kind text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if btrim(coalesce(p_question, '')) = '' or btrim(coalesce(p_answer, '')) = '' then
    raise exception 'empty_question';
  end if;

  if btrim(coalesce(p_category, '')) = '' then
    raise exception 'no_category';
  end if;

  if p_level not in ('سهل', 'متوسط', 'صعب') then
    raise exception 'bad_level';
  end if;

  if fresh then
    qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');
    kind := 'new';
  else
    select o.origin into kind from public.question_overrides o where o.question_id = qid;
    kind := coalesce(kind, 'override');
  end if;

  insert into public.question_overrides
    (question_id, category, level, topic, question, answer, image, origin, updated_by)
  values
    (qid, btrim(p_category), p_level, nullif(btrim(coalesce(p_topic, '')), ''),
     btrim(p_question), btrim(p_answer), nullif(btrim(coalesce(p_image, '')), ''),
     kind, (select auth.uid()))
  on conflict (question_id) do update
    set category   = excluded.category,
        level      = excluded.level,
        topic      = excluded.topic,
        question   = excluded.question,
        answer     = excluded.answer,
        image      = excluded.image,
        updated_at = now(),
        updated_by = excluded.updated_by;

  return qid;
end;
$$;

revoke execute on function public.admin_save_question(text, text, text, text, text, text, text) from public, anon;
grant  execute on function public.admin_save_question(text, text, text, text, text, text, text) to authenticated;
