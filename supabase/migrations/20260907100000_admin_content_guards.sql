-- حرّاس المحتوى في مسارات التعديل كلّها، وتحقّق البلاغ (٧ سبتمبر ٢٠٢٦).
--
-- أربعة ثغرات من تدقيق ٦ سبتمبر ٢٠٢٦، كلّها في القاعدة لا في الواجهة:
-- ١. حارس العشرين كان في الحذف وحده — نقلُ سؤالٍ من خليّة بالحفظ أو الرفع
--    كان ينزل بها إلى تسعة عشر.
-- ٢. رفعُ دفعةٍ انقطعت في منتصفها ثمّ أُعيدت كان يضيف صفوف الرزم الناجحة
--    مرّةً ثانية بمعرّفات جديدة.
-- ٣. قلبُ البنك إلى القاعدة بلا عدد متوقَّع كان يمرّ بلا فحص.
-- ٤. البلاغ كان يقبل أيّ معرّف بلا جلسة، فيحجز سؤالاً لم يُعرض على أحد —
--    أو معرّفاً لا وجود له.
--
-- يُطبَّق في محرّر SQL كتلةً كتلة، كلُّ دالّة وحدها في تشغيل مستقلّ.

/* ═══════════════ ١) حارس الخليّة — دالّة مشتركة ═══════════════ */
--
-- تُنادى **بعد** أن يغادر السؤال خليّته (حذفاً أو نقلاً)، على الخليّة التي
-- غادرها. الشرطان كما في الحذف: الإفراغ مرفوض دائماً، والعبور نزولاً تحت
-- العشرين مرفوض؛ وخليّةٌ هي دونها أصلاً تنقص ولا تفرغ. ولا حراسة إلّا حين
-- تكون القاعدة مرجع الأسئلة (`bank_in_db`).

create or replace function public.assert_cell_floor(p_category text, p_level text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  live  boolean;
  n     bigint;
  min_n integer;
begin
  live := coalesce(
    (select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false);
  if not live then
    return;
  end if;

  select count(*) into n
    from public.question_overrides o
   where o.category = p_category and o.level = p_level;

  select case when exists (
           select 1 from public.question_overrides i
            where i.category = p_category and i.image is not null
         ) then 1 else 20 end
    into min_n;

  if n = 0 or (n < min_n and n + 1 >= min_n) then
    raise exception 'cell_floor: % · % — % من %', p_category, p_level, n, min_n;
  end if;
end;
$$;

revoke execute on function public.assert_cell_floor(text, text) from public, anon;

/* ═══════════════ ٢) تطبيع نصّ السؤال — كما في اللوحة ═══════════════ */
--
-- المقارنة نفسها التي يفرز بها `importQuestions.ts` التكرار: بلا تشكيل،
-- والهمزات ألفاً، والتاء المربوطة هاءً، والألف المقصورة ياءً، وبلا فراغ
-- ولا ترقيم. (المتصفّح يُبقي الحروف والأرقام بصنف `\p{L}`، وPostgres لا
-- يعرفه — فتُحذف الفراغات والعلامات صراحةً، وهو الفرق الذي يهمّ.)

create or replace function public.norm_question(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
           translate(
             regexp_replace(coalesce(p, ''), '[ً-ْـ]', '', 'g'),
             'أإآةى', 'ااايي'),
           '[\s[:punct:]؟،؛«»…]+', '', 'g');
$$;

/* ═══════════════ ٣) الحفظ يحرس الخليّة التي غادرها السؤال ═══════════════ */

create or replace function public.admin_save_question(
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

  if p_level not in ('سهل', 'متوسط', 'صعب') then
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

  /* انتقل من خليّة إلى أخرى: الخليّة التي غادرها تُقاس كما لو حُذف منها. */
  if old_cat is not null and (old_cat <> btrim(p_category) or old_lvl <> p_level) then
    perform public.assert_cell_floor(old_cat, old_lvl);
  end if;

  return qid;
end;
$$;

/* ═══════════════ ٤) الرفع: حارس الخليّة، وإعادةُ الدفعة لا تكرّر ═══════════════ */
--
-- الصفّ الجديد (بلا معرّف) الذي نصُّه موجود أصلاً في القاعدة — بالتطبيع
-- نفسه — يُتخطّى ويُعدّ في `skipped`: رزمةٌ نجحت ثمّ أُعيدت مع الملفّ كلّه
-- لا تضيف أسئلتها ثانيةً. وأسئلةُ الصور خارج المقارنة: نصُّها واحد بطبعه.

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

    if (r ->> 'level') not in ('سهل', 'متوسط', 'صعب') then
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
      (question_id, category, level, topic, question, answer, image, family, origin, updated_by)
    values
      (qid, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       nullif(btrim(coalesce(r ->> 'image', '')), ''),
       nullif(btrim(coalesce(r ->> 'family', '')), ''),
       kind, (select auth.uid()))
    on conflict (question_id) do update
      set category   = excluded.category,
          level      = excluded.level,
          topic      = excluded.topic,
          question   = excluded.question,
          answer     = excluded.answer,
          image      = coalesce(excluded.image, public.question_overrides.image),
          family     = coalesce(excluded.family, public.question_overrides.family),
          updated_at = now(),
          updated_by = excluded.updated_by;

    if old_cat is not null and (old_cat <> btrim(r ->> 'category') or old_lvl <> (r ->> 'level')) then
      cell := old_cat || '|' || old_lvl;
      if not (cell = any (moved)) then
        moved := moved || cell;
      end if;
    end if;
  end loop;

  /* الخلايا المغادَرة تُقاس على حالها النهائيّ بعد الدفعة كلّها: ملفٌّ ينقل
     عشرة أسئلة من خليّة ويعيد إليها عشرة لا يُردّ. */
  foreach cell in array moved
  loop
    perform public.assert_cell_floor(split_part(cell, '|', 1), split_part(cell, '|', 2));
  end loop;

  return jsonb_build_object('added', added, 'updated', updated, 'skipped', skipped);
end;
$$;

/* ═══════════════ ٥) قلب البنك يشترط العدد ═══════════════ */

create or replace function public.admin_set_bank_mode(p_on boolean, p_expect integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  have integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select count(*) into have from public.question_overrides;

  /* التشغيل بلا عددٍ متوقَّع مرفوض: العدد هو الفحص كلّه، وبدونه يمرّ زرعٌ
     ناقص. الإطفاء رجوعٌ إلى ملفّ التطبيق وهو آمنٌ دائماً. */
  if p_on and coalesce(p_expect, 0) <= 0 then
    raise exception 'expect_required';
  end if;

  if p_on and have < p_expect then
    raise exception 'bank_incomplete: %/%', have, p_expect;
  end if;

  insert into public.app_flags (key, enabled, updated_by)
  values ('bank_in_db', p_on, (select auth.uid()))
  on conflict (key) do update
    set enabled    = excluded.enabled,
        updated_at = now(),
        updated_by = excluded.updated_by;

  return jsonb_build_object('enabled', p_on, 'rows', have);
end;
$$;

/* ═══════════════ ٦) البلاغ يُقبل عن سؤالٍ عُرض على المبلِّغ ═══════════════ */
--
-- الجلسة شرط: لصاحبها، ولقطتُها تحمل المعرّف بين ما عُرض فيها
-- (`askedQuestionIds`). والمعرّف موجودٌ في البنك حين تكون القاعدة مرجعَه.
-- فلا يحجز حسابٌ واحد البنك كلّه بنصٍّ في الطرفيّة. أمّا **عتبة** الحجز
-- عند الفتح للعامّة (بلاغان من حسابين) فقرارٌ في SPEC ١٠ لم يُحسم بعد،
-- وليست هنا.

create or replace function public.report_question(p_question_id text, p_session_id uuid default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  qid    text := btrim(coalesce(p_question_id, ''));
  result text;
  live   boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;

  if qid = '' then
    raise exception 'no_question';
  end if;

  if p_session_id is null then
    raise exception 'no_session';
  end if;

  if not exists (
    select 1 from public.sessions s
     where s.id = p_session_id
       and s.user_id = (select auth.uid())
       and s.state -> 'askedQuestionIds' ? qid
  ) then
    raise exception 'not_shown';
  end if;

  live := coalesce(
    (select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false);
  if live and not exists (
    select 1 from public.question_overrides o where o.question_id = qid
  ) then
    raise exception 'unknown_question';
  end if;

  insert into public.question_reports (question_id, user_id, session_id)
  values (qid, (select auth.uid()), p_session_id)
  on conflict (question_id, user_id) do nothing;

  if not found then
    select f.status into result from public.question_flags f where f.question_id = qid;
    return coalesce(result, 'pending');
  end if;

  insert into public.question_flags (question_id, reports, last_at)
  values (qid, 1, now())
  on conflict (question_id) do update
    set reports = public.question_flags.reports + 1,
        last_at = now(),
        status  = case
                    when public.question_flags.status = 'ok' then 'ok'
                    else 'pending'
                  end
  returning status into result;

  return result;
end;
$$;
