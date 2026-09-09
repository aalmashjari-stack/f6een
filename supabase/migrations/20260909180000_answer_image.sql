/* ═══════════════════════════════════════════════════════════════════════
   صورةٌ تظهر مع الإجابة لا مع السؤال — `answer_image`

   الحقلُ القائم `image` يعني «الصورةُ هي السؤال»: شاشةُ السؤال تعرضها
   وفوقها «من صاحب الصورة؟»، والإجابةُ اسمُ صاحبها. فلا سبيل به إلى العكس
   — سؤالٌ نصّيّ («من مؤسّس واتساب؟») يُكشف عنه الوجهُ مع الاسم — لأنّ
   الصورة كانت ستظهر مع السؤال فتفضح جوابه قبل أن يُسأل.

   فحقلٌ ثانٍ، لا رايةٌ على الأوّل: الرايةُ تعني قراءةَ نيّةِ الصفّ من نصّه
   («أهو من صاحب الصورة؟») — وهو ضمنيٌّ ينكسر بأوّل صياغةٍ جديدة.

   والمفتاح يُحلّ بالسلسلة نفسها (`shippedImage`): لا مجلّد صورٍ جديد ولا
   قاعدةَ تسمية جديدة، فمن رُفعت صورتُه للوحة أمس تصلح اليوم وجهاً لإجابة.

   **ومكسبٌ عرضيّ:** الوجوهُ التي استُبعدت لأنّها لا تصلح سؤالَ صورة —
   وجهٌ لا يعرفه المجلس — تصلح هنا: الوجهُ ليس السؤال بل ثمرةُ الكشف.

   ٩ سبتمبر ٢٠٢٦ — طلب علي: «توليد أسئلة للمشاهير وإضافة صورهم كإجابة».
   ═══════════════════════════════════════════════════════════════════════ */

alter table public.question_overrides
  add column if not exists answer_image text;

comment on column public.question_overrides.answer_image is
  'مفتاح صورةٍ تُعرض في شاشة الكشف إلى جانب الإجابة. عكسُ image: السؤال يبقى نصّاً.';

/* ═══════════════ ١) القراءة: البنك والطبقة ═══════════════ */

create or replace function public.question_bank()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'mode',
    case when coalesce((select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false)
         then 'db' else 'overlay' end,
    'rows',
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'question_id', o.question_id, 'category', o.category, 'level', o.level,
        'topic', o.topic, 'question', o.question, 'answer', o.answer,
        'image', o.image, 'answer_image', o.answer_image, 'family', o.family
      ) order by o.question_id)
      from public.question_overrides o
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.question_bank() from public, anon;
grant  execute on function public.question_bank() to authenticated;

-- تغييرُ أعمدة `returns table` تغييرٌ لنوع الإرجاع ولا يقبله `create or
-- replace` — فالإسقاطُ أوّلاً والإنشاءُ في السطر التالي.
drop function if exists public.question_overlay();

create function public.question_overlay()
returns table (
  question_id  text,
  category     text,
  level        text,
  topic        text,
  question     text,
  answer       text,
  image        text,
  answer_image text,
  family       text
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.question_id, o.category, o.level, o.topic, o.question, o.answer,
         o.image, o.answer_image, o.family
  from public.question_overrides o;
$$;

revoke execute on function public.question_overlay() from public, anon;
grant  execute on function public.question_overlay() to authenticated;

/* ═══════════════ ٢) اللوحة: القائمة ═══════════════ */

drop function if exists public.admin_questions();

create function public.admin_questions()
returns table (
  question_id  text,
  category     text,
  level        text,
  topic        text,
  question     text,
  answer       text,
  image        text,
  answer_image text,
  family       text,
  origin       text,
  updated_at   timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.question_id, o.category, o.level, o.topic, o.question, o.answer,
         o.image, o.answer_image, o.family, o.origin, o.updated_at
  from public.question_overrides o
  where public.is_admin()
  order by o.updated_at desc;
$$;

revoke execute on function public.admin_questions() from public, anon;
grant  execute on function public.admin_questions() to authenticated;

/* ═══════════════ ٣) الحفظ من نموذج اللوحة ═══════════════ */
--
-- الإسقاطُ قبل الإنشاء لا `create or replace`: زيادةُ وسيطٍ بقيمةٍ افتراضيّة
-- تُنشئ حِملاً زائداً ثانياً، فيصير النداءُ بالأسماء غامضاً بين النسختين.

drop function if exists public.admin_save_question(text, text, text, text, text, text, text);

create function public.admin_save_question(
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

  if fresh then
    qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');
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

revoke execute on function public.admin_save_question(text, text, text, text, text, text, text, text) from public, anon;
grant  execute on function public.admin_save_question(text, text, text, text, text, text, text, text) to authenticated;

/* ═══════════════ ٤) رفعُ ملفٍّ من اللوحة ═══════════════ */
--
-- `coalesce(excluded.…, القائم)` كما في `image`: ملفُّ تصحيحٍ لا يحمل عمودَ
-- الصورة لا يمحو وجهاً مرفوعاً من اللوحة.

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
  old_cat text;
  old_lvl text;
  added   integer := 0;
  updated integer := 0;
  skipped integer := 0;
  moved   text[] := '{}';
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
      qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');
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
          topic        = excluded.topic,
          question     = excluded.question,
          answer       = excluded.answer,
          image        = coalesce(excluded.image, public.question_overrides.image),
          answer_image = coalesce(excluded.answer_image, public.question_overrides.answer_image),
          family       = coalesce(excluded.family, public.question_overrides.family),
          updated_at   = now(),
          updated_by   = excluded.updated_by;

    if old_cat is not null and (old_cat <> btrim(r ->> 'category') or old_lvl <> (r ->> 'level')) then
      cell := old_cat || '|' || old_lvl;
      if not (cell = any (moved)) then
        moved := moved || cell;
      end if;
    end if;
  end loop;

  foreach cell in array moved
  loop
    perform public.assert_cell_floor(split_part(cell, '|', 1), split_part(cell, '|', 2));
  end loop;

  return jsonb_build_object('added', added, 'updated', updated, 'skipped', skipped);
end;
$$;

revoke execute on function public.admin_import_questions(jsonb) from public, anon;
grant  execute on function public.admin_import_questions(jsonb) to authenticated;

/* ═══════════════ ٥) بذرُ بنك الملفّ ═══════════════ */

create or replace function public.admin_seed_bank(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ins integer;
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

  with src as (
    select r ->> 'id'       as question_id,
           btrim(r ->> 'category') as category,
           r ->> 'level'    as level,
           nullif(btrim(coalesce(r ->> 'topic', '')), '')  as topic,
           btrim(r ->> 'question') as question,
           btrim(r ->> 'answer')   as answer,
           nullif(btrim(coalesce(r ->> 'image', '')), '')  as image,
           nullif(btrim(coalesce(r ->> 'answer_image', '')), '') as answer_image,
           nullif(btrim(coalesce(r ->> 'family', '')), '') as family
      from jsonb_array_elements(p_rows) r
  ), ok as (
    select * from src
     where question_id is not null and btrim(question_id) <> ''
       and question <> '' and answer <> '' and category <> ''
       and level in ('سهل', 'متوسط', 'صعب', 'تعجيزي')
  ), done as (
    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, image, answer_image,
       family, origin, updated_by)
    select question_id, category, level, topic, question, answer, image, answer_image,
           family, 'bank', (select auth.uid())
      from ok
    on conflict (question_id) do nothing
    returning 1
  )
  select count(*)::integer into ins from done;

  return jsonb_build_object(
    'inserted', ins,
    'sent',     jsonb_array_length(p_rows),
    'total',    (select count(*) from public.question_overrides)
  );
end;
$$;

revoke execute on function public.admin_seed_bank(jsonb) from public, anon;
grant  execute on function public.admin_seed_bank(jsonb) to authenticated;
