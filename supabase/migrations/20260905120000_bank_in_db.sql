-- نقلُ البنك المشحون إلى القاعدة — ٥ سبتمبر ٢٠٢٦، قرار علي.
--
-- كان `question_overrides` يحمل **الفرق وحده**: ما عُدّل وما أُضيف، والبنك
-- ملفٌّ في التطبيق (`20260830180000_question_overrides.sql`). فصار حذفُ
-- سؤالٍ مشحون مستحيلاً من اللوحة — نسخته في جهاز كل لاعب.
--
-- من هنا: الجدول نفسه يحمل **الأسئلة كلّها** بصفوف `origin = 'bank'`،
-- والملفّ يبقى في التطبيق **بذرةً لأوّل إقلاع لا مرجعاً**. فتُحذف الأسئلة
-- وتُعدَّل من اللوحة، ولا يسقط مجلسٌ لأنّ التغطية ضعيفة.
--
-- والانتقال على مرحلتين لا واحدة: تُزرع الصفوف أوّلاً (`admin_seed_bank`)،
-- ثمّ يُقلب المفتاح (`admin_set_bank_mode`) بعد أن يتأكّد اكتمالُها. لو
-- قُلب المفتاحُ مع زرعٍ نصفِه لوجد اللاعبون بنكاً ناقصاً — ولهذا تعدّ
-- القاعدةُ صفوفَها وتقارنها بما تُرسله اللوحة قبل أن تسمح بالقلب.

/* ═══════════════ ١) الجدول يتّسع للبنك ═══════════════ */

-- الموضوع المصرَّح به (`Question.family`) يجمع سؤالين جوابهما واحد
-- وصيغتاهما مختلفتان، ويحرس ألّا يظهرا في جلسة واحدة. لولا هذا العمود
-- لضاع الحرسُ لحظةَ انتقال البنك.
alter table public.question_overrides add column if not exists family text;

alter table public.question_overrides drop constraint if exists question_overrides_origin_check;
alter table public.question_overrides add constraint question_overrides_origin_check
  check (origin in ('bank', 'override', 'new'));

comment on column public.question_overrides.origin is
  'bank = سؤالٌ من البنك المنقول · override = يحلّ محلّ سؤالٍ في ملفّ البذرة · new = أضافته اللوحة.';

/* ═══════════════ ٢) مفتاح المصدر ═══════════════ */

create table if not exists public.app_flags (
  key        text primary key,
  enabled    boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.app_flags enable row level security;

comment on table public.app_flags is
  'مفاتيح تشغيلٍ عامّة. bank_in_db = القاعدة هي مرجع الأسئلة لا ملفّ التطبيق.';

-- لا سياسة كتابة: القلب عبر `admin_set_bank_mode` وحدها.
drop policy if exists "app_flags: admin reads" on public.app_flags;
create policy "app_flags: admin reads" on public.app_flags
  for select using (public.is_admin());

/* ═══════════════ ٣) حدُّ الخليّة — الحارس الذي كان في الاختبار ═══════════════ */
--
-- `bank.test.ts` يحرس: لكل خليّة (تصنيف × مستوى) نصّية عشرون سؤالاً، ولكل
-- خليّة صور واحد. كان يعمل وقت البناء على الملفّ؛ والبنك في القاعدة يخرج
-- من مداه — فبضغطةِ «حذف المحدَّد» تنزل خليّةٌ إلى أحد عشر سؤالاً وتنكسر
-- اللعبة على كل جهازٍ خلال دقيقة. فينتقل الحارس معه إلى هنا.
--
-- وهذه الدالّة تقريرٌ لا حارس: تعرضها اللوحة تحذيراً. الحارسُ الفاعل في
-- `admin_delete_question` أدناه، وهو أرفق — يمنع العبور نزولاً ولا يقفل
-- بابَ فئةٍ لم تكتمل بعد.

create or replace function public.bank_floor_breaches()
returns table (category text, level text, n bigint, floor integer)
language sql
stable
security definer
set search_path = ''
as $$
  with cells as (
    select o.category,
           o.level,
           count(*) as n,
           -- فئةُ صورٍ محتواها يُزوَّد تدريجياً، فيكفيها واحد (نفسُ قاعدة الاختبار).
           case when exists (
             select 1 from public.question_overrides i
              where i.category = o.category and i.image is not null
           ) then 1 else 20 end as floor
      from public.question_overrides o
     group by o.category, o.level
  )
  select c.category, c.level, c.n, c.floor from cells c where c.n < c.floor;
$$;

revoke execute on function public.bank_floor_breaches() from public, anon;
grant  execute on function public.bank_floor_breaches() to authenticated;

/* ═══════════════ ٤) الزرع ═══════════════ */
--
-- **لا يمسّ صفّاً قائماً** (`do nothing` عند التعارض): ما عدّلتَه من اللوحة
-- قبل النقل يبقى كما عدّلتَه، ولا تعيده البذرةُ إلى أصله. ولهذا يمكن
-- تشغيلُ الزرع مرّتين بلا ضرر — يُكمل ما نقص ولا يكرّر.

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
           nullif(btrim(coalesce(r ->> 'family', '')), '') as family
      from jsonb_array_elements(p_rows) r
  ), ok as (
    select * from src
     where question_id is not null and btrim(question_id) <> ''
       and question <> '' and answer <> '' and category <> ''
       and level in ('سهل', 'متوسط', 'صعب')
  ), done as (
    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, image, family, origin, updated_by)
    select question_id, category, level, topic, question, answer, image, family,
           'bank', (select auth.uid())
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

/* ═══════════════ ٥) قلبُ المفتاح ═══════════════ */

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

  /* التشغيل وحده يُفحص؛ الإطفاء رجوعٌ إلى ملفّ التطبيق وهو آمنٌ دائماً.
     والفحصُ بعددِ ما زُرع لا بحدّ الخليّة: زرعٌ انقطع في منتصفه يترك خلايا
     كاملةً وأخرى ناقصة، ولا يكشفه إلّا العدد. واللوحة تُرسل عدد ملفّها. */
  if p_on and have < coalesce(p_expect, 0) then
    raise exception 'bank_incomplete: %/%', have, p_expect;
  end if;

  insert into public.app_flags (key, enabled, updated_by)
  values ('bank_in_db', p_on, (select auth.uid()))
  on conflict (key) do update
    set enabled = excluded.enabled, updated_at = now(), updated_by = excluded.updated_by;

  return jsonb_build_object('enabled', p_on, 'total', have);
end;
$$;

revoke execute on function public.admin_set_bank_mode(boolean, integer) from public, anon;
grant  execute on function public.admin_set_bank_mode(boolean, integer) to authenticated;

/* ═══════════════ ٦) ما يقرؤه اللاعب ═══════════════ */
--
-- **`question_overlay()` تبقى كما هي** ولا تُحذف: في جيوب اللاعبين نسخٌ
-- قديمة من التطبيق تناديها، وهي بعد النقل تُرجع البنك كلّه فتركّبه تلك
-- النسخُ فوق ملفّها — نصٌّ فوق نصٍّ مطابق، فلا ضرر. أقصى ما يفوتها الحذفُ،
-- وهو أهون من تطبيقٍ يتوقّف.
--
-- والجديدة تنادي `question_bank()`: تُرجع الوضع والصفوف معاً في نداءٍ
-- واحد، فلا يقع أن يصل الوضعُ بلا صفوفه أو العكس.

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
        'image', o.image, 'family', o.family
      ) order by o.question_id)
      from public.question_overrides o
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.question_bank() from public, anon;
grant  execute on function public.question_bank() to authenticated;

-- الطبقة القديمة تحمل الموضوع المصرَّح به أيضاً — مفتاحٌ زائد تتجاهله
-- النسخُ القديمة وتقرؤه الجديدة لو سقطت إلى هذا الباب.
-- تغييرُ أعمدة `returns table` تغييرٌ لنوع الإرجاع، و`create or replace`
-- لا يقبله — فالإسقاطُ أوّلاً. والدالّة تُعاد في السطر التالي، فلا نافذةَ
-- تجد فيها نسخةٌ قديمة بابَها مغلقاً إلّا أجزاءَ الثانية.
drop function if exists public.question_overlay();

create function public.question_overlay()
returns table (
  question_id text,
  category    text,
  level       text,
  topic       text,
  question    text,
  answer      text,
  image       text,
  family      text
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.question_id, o.category, o.level, o.topic, o.question, o.answer, o.image, o.family
  from public.question_overrides o;
$$;

revoke execute on function public.question_overlay() from public, anon;
grant  execute on function public.question_overlay() to authenticated;

/* ═══════════════ ٧) اللوحة: الحذف يحرس الحدّ، والموضوع لا يضيع ═══════════════ */

drop function if exists public.admin_questions();

create function public.admin_questions()
returns table (
  question_id text,
  category    text,
  level       text,
  topic       text,
  question    text,
  answer      text,
  image       text,
  family      text,
  origin      text,
  updated_at  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.question_id, o.category, o.level, o.topic, o.question, o.answer, o.image,
         o.family, o.origin, o.updated_at
  from public.question_overrides o
  where public.is_admin()
  order by o.updated_at desc;
$$;

revoke execute on function public.admin_questions() from public, anon;
grant  execute on function public.admin_questions() to authenticated;

-- الحذف: كما كان، وفوقه حارسُ الحدّ.
--
-- قبل النقل كان حذفُ صفّ `override` تراجعاً يعيد سؤالَ الملفّ، فلا ينقص
-- المخزون. بعده يصير الحذفُ حذفاً — فيُفحص ما يبقى في الخليّة، ويُردّ
-- الفعلُ إن نزل تحت الحدّ. والفحص بعد الحذف داخل المعاملة ثمّ `raise`
-- يُرجعها: أدقّ من العدّ قبله، لأنّه يقيس الحالة التي كانت ستقع فعلاً.
create or replace function public.admin_delete_question(p_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind  text;
  cat   text;
  lvl   text;
  live  boolean;
  n     bigint;
  min_n integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  delete from public.question_overrides o
   where o.question_id = btrim(coalesce(p_id, ''))
   returning o.origin, o.category, o.level into kind, cat, lvl;

  if kind is null then
    raise exception 'no_such_question';
  end if;

  live := coalesce(
    (select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false);

  if live then
    select count(*) into n
      from public.question_overrides o
     where o.category = cat and o.level = lvl;

    select case when exists (
             select 1 from public.question_overrides i
              where i.category = cat and i.image is not null
           ) then 1 else 20 end
      into min_n;

    /* شرطان لا واحد. **الإفراغ مرفوض دائماً**: خليّة بلا سؤال تُسقط اللعبة
       عند بلوغها (`playableCategories`). و**العبورُ نزولاً** مرفوض: من كانت
       عشرين فأكثر لا تنزل تحتها. أمّا خليّةٌ هي أصلاً دونها — فئةٌ أضفتَها
       ولمّا تكتمل — فلا يُقفل بابُها عليك: تنقص ولا تفرغ. */
    if n = 0 or (n < min_n and n + 1 >= min_n) then
      raise exception 'cell_floor: % · % — %', cat, lvl, n;
    end if;
  end if;

  return kind;
end;
$$;

revoke execute on function public.admin_delete_question(text) from public, anon;
grant  execute on function public.admin_delete_question(text) to authenticated;

-- رفعُ الدفعة يحفظ الموضوع المصرَّح به كما يحفظ الصورة: ملفٌّ بلا العمود
-- لا يمحو ما كان (`coalesce` عند التعارض).
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
      -- سؤالُ بنكٍ منقول يبقى بنكاً بنصّه الجديد: `origin` لا يُخفَّض.
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
  end loop;

  return jsonb_build_object('added', added, 'updated', updated);
end;
$$;

revoke execute on function public.admin_import_questions(jsonb) from public, anon;
grant  execute on function public.admin_import_questions(jsonb) to authenticated;

/* ═══════════════ ٨) سؤالُ الوضع وحده ═══════════════ */
-- اللوحة تحتاج أن تعرف الوضع لتعرض المفتاح، ولا تحتاج معه ستّمئة كيلوبايت.

create or replace function public.bank_mode()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false);
$$;

revoke execute on function public.bank_mode() from public, anon;
grant  execute on function public.bank_mode() to authenticated;

/* ═══════════════ ٩) التوقيع — كي لا تُنقل الحمولة بلا داعٍ ═══════════════ */
--
-- البنك في القاعدة ستّمئة كيلوبايت. نقلُها في كل إقلاعٍ على شبكة جوّالٍ
-- ضعيفة تأخيرٌ بلا مقابل: البنك لا يتغيّر إلّا حين أعدّله أنا.
--
-- فالإقلاع يسأل التوقيع أوّلاً (بضع عشرات البايتات)، ولا يطلب الصفوف إلّا
-- إن اختلف عمّا في التخزين المحلّي. والعدد مع آخر تعديلٍ مع الوضع: الحذفُ
-- يغيّر العدد، والتصحيحُ يغيّر التاريخ، والقلبُ يغيّر الوضع.

create or replace function public.bank_signature()
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
    'n',  (select count(*) from public.question_overrides),
    'at', (select coalesce(max(o.updated_at), 'epoch'::timestamptz)
             from public.question_overrides o)
  );
$$;

revoke execute on function public.bank_signature() from public, anon;
grant  execute on function public.bank_signature() to authenticated;
