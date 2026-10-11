-- معرّف السؤال الجديد كان `'ADM' || lpad(nextval(...)::text, 4, '0')`، و`lpad` في
-- Postgres **يقصّ** النصّ الأطول من العرض: فلمّا عبر العدّاد 9999 (١٢ أكتوبر ٢٠٢٦،
-- اعتماد دفعة 374 مسوّدة) صار 10000 ← «ADM1000» الموجود، فردّت القاعدة الاعتماد كلّه
-- بـ`question_overrides_pkey`. والإصلاح دالّةٌ واحدة تولّد المعرّف بأربع خاناتٍ على
-- الأقلّ لا بأربعٍ بالضبط (ADM0042، ADM9999، ADM10000)، وتُستدعى من الدوالّ الثلاث
-- التي تولّده؛ وكلُّ دالّةٍ هنا نسخةُ آخر تعريفٍ لها بلا تغييرٍ سوى هذا السطر.

create or replace function public.admin_qid()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'ADM' || lpad(n::text, greatest(4, length(n::text)), '0')
    from (select nextval('public.question_admin_seq') as n) s
$$;

revoke execute on function public.admin_qid() from public, anon, authenticated;

create or replace function public.admin_approve_drafts(p_batch uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d       public.question_drafts;
  qid     text;
  added   integer := 0;
  skipped integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  for d in select * from public.question_drafts x
            where x.batch = p_batch and x.status = 'pending' order by x.id
  loop
    if not exists (select 1 from public.question_overrides o where o.category = d.category)
       and not exists (select 1 from public.categories c where c.name = d.category) then
      raise exception 'unknown_category: %', d.category;
    end if;

    /* المصوَّر خارج مقارنة النصّ — الفرق في الصورة لا في السؤال. */
    if d.image is null and exists (
      select 1 from public.question_overrides o
       where o.image is null
         and public.norm_question(o.question) = public.norm_question(d.question)
    ) then
      skipped := skipped + 1;
      update public.question_drafts set status = 'rejected', decided_at = now(),
             decided_by = (select auth.uid())
       where id = d.id;
      continue;
    end if;

    qid := public.admin_qid();

    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, image, answer_image, family, origin, updated_by)
    values
      (qid, d.category, d.level, d.topic, d.question, d.answer, d.image, d.answer_image, d.family, 'new',
       (select auth.uid()));

    update public.question_drafts
       set status = 'approved', decided_at = now(),
           decided_by = (select auth.uid()), question_id = qid
     where id = d.id;
    added := added + 1;
  end loop;

  return jsonb_build_object('added', added, 'skipped', skipped);
end;
$$;

CREATE OR REPLACE FUNCTION public.admin_import_questions(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r       jsonb;
  qid     text;
  kind    text;
  old_cat text;
  old_lvl text;
  added   integer := 0;
  updated integer := 0;
  skipped integer := 0;
  moved   jsonb := '{}'::jsonb;
  cell    text;
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

    if (r ->> 'level') not in ('سهل', 'متوسط', 'صعب', 'تعجيزي') then
      raise exception 'bad_level';
    end if;

    qid := nullif(btrim(coalesce(r ->> 'id', '')), '');
    old_cat := null;
    old_lvl := null;

    if qid is null then
      if exists (
        select 1 from public.question_overrides o
         where o.image is null
           and public.norm_question(o.question) = public.norm_question(r ->> 'question')
      ) then
        skipped := skipped + 1;
        continue;
      end if;
      qid := public.admin_qid();
      kind := 'new';
      added := added + 1;
    else
      select o.origin, o.category, o.level into kind, old_cat, old_lvl
        from public.question_overrides o where o.question_id = qid;
      if kind is null then
        kind := 'override';
      end if;
      updated := updated + 1;
    end if;

    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, image, answer_image,
       family, origin, updated_by)
    values
      (qid, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       nullif(btrim(coalesce(r ->> 'image', '')), ''),
       nullif(btrim(coalesce(r ->> 'answer_image', '')), ''),
       nullif(btrim(coalesce(r ->> 'family', '')), ''),
       kind, (select auth.uid()))
    on conflict (question_id) do update
      set category     = excluded.category,
          level        = excluded.level,
          topic        = coalesce(excluded.topic, public.question_overrides.topic),
          question     = excluded.question,
          answer       = excluded.answer,
          image        = coalesce(excluded.image, public.question_overrides.image),
          answer_image = coalesce(excluded.answer_image, public.question_overrides.answer_image),
          family       = coalesce(excluded.family, public.question_overrides.family),
          updated_at   = now(),
          updated_by   = excluded.updated_by;

    if old_cat is not null and (old_cat <> btrim(r ->> 'category') or old_lvl <> (r ->> 'level')) then
      cell := old_cat || '|' || old_lvl;
      moved := jsonb_set(moved, array[cell], to_jsonb(coalesce((moved ->> cell)::int, 0) + 1));
    end if;
  end loop;

  for cell in select jsonb_object_keys(moved)
  loop
    perform public.assert_cell_floor(split_part(cell, '|', 1), split_part(cell, '|', 2),
                                     (moved ->> cell)::int);
  end loop;

  return jsonb_build_object('added', added, 'updated', updated, 'skipped', skipped);
end;
$function$;

create or replace function public.admin_save_question(
  p_id           text default null,
  p_category     text default null,
  p_level        text default null,
  p_topic        text default null,
  p_question     text default null,
  p_answer       text default null,
  p_image        text default null,
  p_answer_image text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  qid      text := nullif(btrim(coalesce(p_id, '')), '');
  fresh    boolean := qid is null;
  kind     text;
  old_cat  text;
  old_lvl  text;
  twin     text;
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

  if p_level not in ('سهل', 'متوسط', 'صعب', 'تعجيزي') then
    raise exception 'bad_level';
  end if;

  /* النصّ نفسه (بعد التطبيع) موجودٌ بمعرّفٍ آخر — كما في الرفع بالجملة
     والاعتماد؛ وأسئلة الصور خارج الفحص لأنّ نصّها قالبٌ («من هذا؟»). */
  if nullif(btrim(coalesce(p_image, '')), '') is null then
    select o.question_id into twin
      from public.question_overrides o
     where public.norm_question(o.question) = public.norm_question(p_question)
       and o.image is null
       and (qid is null or o.question_id <> qid)
     limit 1;
    if twin is not null then
      raise exception 'سؤالٌ بالنصّ نفسه موجود: %', twin;
    end if;
  end if;

  if fresh then
    qid := public.admin_qid();
    kind := 'new';
  else
    select o.origin, o.category, o.level into kind, old_cat, old_lvl
      from public.question_overrides o where o.question_id = qid;
    kind := coalesce(kind, 'override');
  end if;

  insert into public.question_overrides
    (question_id, category, level, topic, question, answer, image, answer_image,
     origin, updated_by)
  values
    (qid, btrim(p_category), p_level, nullif(btrim(coalesce(p_topic, '')), ''),
     btrim(p_question), btrim(p_answer),
     nullif(btrim(coalesce(p_image, '')), ''),
     nullif(btrim(coalesce(p_answer_image, '')), ''),
     kind, (select auth.uid()))
  on conflict (question_id) do update
    set category     = excluded.category,
        level        = excluded.level,
        topic        = excluded.topic,
        question     = excluded.question,
        answer       = excluded.answer,
        image        = excluded.image,
        answer_image = excluded.answer_image,
        updated_at   = now(),
        updated_by   = excluded.updated_by;

  /* انتقل من خليّة إلى أخرى: الخليّة التي غادرها تُقاس كما لو حُذف منها. */
  if old_cat is not null and (old_cat <> btrim(p_category) or old_lvl <> p_level) then
    perform public.assert_cell_floor(old_cat, old_lvl);
  end if;

  return qid;
end;
$$;
