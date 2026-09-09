-- مستوىً رابع: «تعجيزي».
--
-- **هذه المرحلة الأولى: الطريقُ يقبله والبنكُ يحمله، واللوحُ لا يعرضه بعد.**
-- اللعبة لا تعرض فئةً إلّا إذا امتلأت صفوفُها كلُّها (`playableCategories`)،
-- فتشغيلُ المستوى قبل امتلاء الخانات يُسقط الفئات التسع عشرة دفعةً واحدة.
-- التشغيل في `STAGE1_LEVELS` وحده، ويأتي بعد المحتوى.
--
-- والقيدُ كان مكتوباً في عشرة مواضع: قيدَي جدولٍ وأربع دوالّ. والدوالّ
-- تُعاد كاملةً من مالكها الأخير — تبديلُ سطرٍ في هجرةٍ سابقة يغيّر الملفّ
-- ولا يمسّ القاعدة الحيّة.

/* ═══════════ قيدا الجدولين ═══════════ */

alter table public.question_overrides drop constraint if exists question_overrides_level_check;
alter table public.question_overrides
  add constraint question_overrides_level_check
  check (level in ('سهل', 'متوسط', 'صعب', 'تعجيزي'));

alter table public.question_drafts drop constraint if exists question_drafts_level_check;
alter table public.question_drafts
  add constraint question_drafts_level_check
  check (level in ('سهل', 'متوسط', 'صعب', 'تعجيزي'));

/* ═══════════ الدوالّ ═══════════ */

/* ── طريقُ المسوّدات — بابُ دخول الأسئلة الجديدة. (1 موضع) ── */
create or replace function public.agent_submit_drafts(p_key text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  k       public.agent_keys;
  b       uuid := gen_random_uuid();
  used    integer;
  n       integer;
  r       jsonb;
  img     text;
  ins     integer := 0;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'no_key';
  end if;

  select * into k from public.agent_keys a
   where a.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex');

  if not found or k.revoked or (k.expires_at is not null and k.expires_at < now()) then
    raise exception 'bad_key';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'bad_payload';
  end if;

  n := jsonb_array_length(p_rows);
  if n = 0 then
    raise exception 'empty_payload';
  end if;
  if n > 1000 then
    raise exception 'too_many_rows';
  end if;

  select count(*) into used
    from public.question_drafts d
   where d.source = k.name and d.created_at > now() - interval '24 hours';
  if used + n > k.daily_limit then
    raise exception 'daily_limit: %/%', used + n, k.daily_limit;
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

    img := nullif(btrim(coalesce(r ->> 'image', '')), '');
    /* صورةٌ من دلو هذا المشروع وحده. `%/storage/v1/object/public/art/%`
       يطابق مسار الرابط العامّ الذي يُصدره `getPublicUrl`. */
    /* يُقبل أحد شكلين لا ثالث: **مفتاح صورة مشحونة** مع التطبيق
       (`celeb-…` أو `landmark-…` أو `zaman-…`، يحلّه العميل من `assets/`)،
       أو **رابطٌ في دلو `art`** من تخزين هذا المشروع. وما عداهما يُردّ، فلا
       يحقن الطريقُ رابطاً خارجيّاً تحمّله شاشةُ المجلس من خادمٍ غريب.

       **وكلّ مجلّد صورٍ جديد يمرّ من هنا**: أُضيف `zaman` في ٨ سبتمبر ٢٠٢٦
       بعد أن ردّ الحارسُ دفعةَ «زمن جميل» كلَّها بـ`bad_image_url` — وهذا
       عملُه لا خللُه. فمن أنشأ `assets/<اسم>/` ووحدةَ حلٍّ له، فليضف اسمه
       في هذا النمط وإلّا لم يُرفع سؤالٌ بصورته. */
    if img is not null
       and img !~ '^(celeb|landmark|zaman)-[A-Za-z0-9._-]+$'
       and img not like '%/storage/v1/object/public/art/%' then
      raise exception 'bad_image_url';
    end if;

    insert into public.question_drafts
      (batch, source, category, level, topic, question, answer, family, image)
    values
      (b, k.name, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       nullif(btrim(coalesce(r ->> 'family', '')), ''),
       img);
    ins := ins + 1;
  end loop;

  update public.agent_keys set last_used_at = now() where name = k.name;

  return jsonb_build_object('batch', b, 'rows', ins);
end;
$$;
revoke execute on function public.agent_submit_drafts(text, jsonb) from public;
grant  execute on function public.agent_submit_drafts(text, jsonb) to anon, authenticated;

/* ── حفظُ سؤالٍ من اللوحة — لتعديل «تعجيزي» بعد اعتماده. (1 موضع) ── */
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

/* ── رفعُ ملفٍّ من اللوحة. (1 موضع) ── */
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

/* ── بذرُ بنك الملفّ في القاعدة. (1 موضع) ── */
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
       and level in ('سهل', 'متوسط', 'صعب', 'تعجيزي')
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
