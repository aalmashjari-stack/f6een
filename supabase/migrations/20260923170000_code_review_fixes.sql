-- إصلاحات مراجعة الشيفرة (٢٣ سبتمبر ٢٠٢٦، طلب علي: «check the code and fix
-- every issue»). كلُّ دالّةٍ هنا مأخوذةٌ من تعريفها الحيّ (`pg_get_functiondef`)
-- لا من أوّل هجرةٍ تذكرها، ثمّ عُدّلت في مواضعها وحدها.

-- ── ١. المحجوز يتجاوز الألف ─────────────────────────────────────────────
-- `blocked_questions()` تُرجع صفّاً لكلّ سؤال، وPostgREST يقصّ الجواب عند ألف
-- صفّ بصمت. في يوم المراجعة 1184 محجوزاً — فنحو مئتي سؤالٍ معطَّل (يتبدّل
-- عشوائيّاً بلا `order by`) كانت تُسحب في كلّ جهاز. البديل قيمةٌ jsonb واحدة
-- كـ`admin_questions()`. والقديمة تبقى كما هي: نسخٌ من التطبيق في جيوب
-- اللاعبين تناديها وتنتظر شكلها.
create or replace function public.blocked_question_ids()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(f.question_id order by f.question_id), '[]'::jsonb)
    from public.question_flags f
   where f.status in ('pending', 'disabled');
$$;

revoke execute on function public.blocked_question_ids() from public, anon;
grant execute on function public.blocked_question_ids() to authenticated;

-- ── ٢. البلاغ: المعطَّل يبقى معطَّلاً، وسقفٌ يوميّ ────────────────────────
-- شرط «عُرض عليك» يقرأ `sessions.state` وهو عمودٌ يكتبه صاحبه، فحسابٌ مجّانيّ
-- يستطيع حشوه بالبنك كلّه ثمّ حجز كلّ سؤالٍ عن كلّ المجالس. السقف (20 في
-- اليوم، والمدير معفى) يجعل ذلك عملَ أشهر؛ وأكثرُ يومٍ حقيقيّ حتى الآن 5.
-- وكان بلاغٌ على سؤالٍ **معطَّل** يعيده «معلَّقاً» — فيخرج من قائمة المعطَّل
-- في اللوحة إلى قائمة المراجعة كأنّه جديد.
CREATE OR REPLACE FUNCTION public.report_question(p_question_id text, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  if not public.is_admin() and (
    select count(*) from public.question_reports q
     where q.user_id = (select auth.uid()) and q.created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'report_limit';
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
                    when public.question_flags.status in ('ok', 'disabled')
                      then public.question_flags.status
                    else 'pending'
                  end
  returning status into result;

  return result;
end;
$function$;

-- ── ٣. حدّ الخليّة في الرفع بالجملة ─────────────────────────────────────
-- كان الحارس يفترض خروج سؤالٍ واحد (`n + 1 >= min_n`): ملفٌّ ينقل خمسةً من
-- خليّةٍ فيها 22 يتركها 17 ويمرّ. الآن يُمرَّر عدد الخارجين. وكان يردّ نقلَ
-- آخر سؤالٍ في خليّة (`n = 0`) مع أنّ حذفه مسموح — فصار `n > 0` كحارس الحذف.
drop function if exists public.assert_cell_floor(text, text);

create function public.assert_cell_floor(p_category text, p_level text, p_removed integer default 1)
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

  if n > 0 and n < min_n and n + greatest(p_removed, 1) >= min_n then
    raise exception 'cell_floor: % · % — % من %', p_category, p_level, n, min_n;
  end if;
end;
$$;

revoke execute on function public.assert_cell_floor(text, text, integer) from public, anon, authenticated;

-- والرفعُ بالجملة يعدّ الخارجين من كلّ خليّة. **والموضوع لا يُمحى** حين يخلو
-- الملفّ من عموده: تصحيحٌ بخمسة أعمدة كان يُسقط تلميح «أكمل المثل» ونوعَ
-- تمثيل «ولا كلمة» — كما تُحمل الصورة وصورة الإجابة من القائم.
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

-- ── ٤. صورة المسوّدة من دلو هذا المشروع لا من أيّ نطاق ────────────────────
-- `%/storage/v1/object/public/art/%` يطابق المسار نفسه على أيّ خادم. والمفتاح
-- يُقفل قبل عدّ السقف اليوميّ، فلا يعبره نداءان متوازيان.
CREATE OR REPLACE FUNCTION public.agent_submit_drafts(p_key text, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
   where a.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex')
     for update;

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
       (`celeb-…` أو `landmark-…` أو `zaman-…` أو `pic-…`، يحلّه العميل من
       `assets/`)، أو **رابطٌ في دلو `art`** من تخزين هذا المشروع. وما عداهما
       يُردّ، فلا يحقن الطريقُ رابطاً خارجيّاً تحمّله شاشةُ المجلس من خادمٍ غريب.

       **وكلّ مجلّد صورٍ جديد يمرّ من هنا**: أُضيف `zaman` في ٨ سبتمبر ٢٠٢٦
       بعد أن ردّ الحارسُ دفعةَ «زمن جميل» كلَّها بـ`bad_image_url`، و`pic`
       في ١٢ سبتمبر لصور الفئات القائمة — وهذا عملُه لا خللُه. فمن أنشأ
       `assets/<اسم>/` ووحدةَ حلٍّ له، فليضف اسمه في هذا النمط وإلّا لم
       يُرفع سؤالٌ بصورته. */
    if img is not null
       and img !~ '^(celeb|landmark|zaman|pic)-[A-Za-z0-9._-]+$'
       and img not like 'https://ajtexbwnrzwidoncbodi.supabase.co/storage/v1/object/public/art/%' then
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
$function$;

-- ── ٥. التوقيع يتحرّك مع كلّ تعديل ──────────────────────────────────────
-- `bank_signature()` = العدد + أحدث `updated_at`، ولا مشغّل يحدّثه: هجرتا
-- `math_split` عدّلتا المحتوى دون العمود فبقيت الأجهزة على نسخها. المشغّل
-- يجعله صادقاً لكلّ كاتب، يدويّاً كان أو هجرة.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists question_overrides_touch on public.question_overrides;
create trigger question_overrides_touch
  before update on public.question_overrides
  for each row execute function public.touch_updated_at();

-- ── ٦. ذاكرة الأسئلة: السؤال المعاد يصير الأحدث ─────────────────────────
-- «الأقدم استخداماً» (SPEC ٨) يعمل على `used_at`، وكان زمنَ أوّل ظهورٍ لا
-- يتحرّك: حسابٌ استنفد خليّةً يُعاد عليه **السؤال نفسه** في كلّ جلسة. فيُحدَّث
-- الزمن حين يُعاد السؤال — تعديلٌ لصفّ صاحبه وحده. وأقصى ما يفعله لاعبٌ بهذا
-- إعادة ترتيب ذاكرته هو، لا محوها: الحذف ما زال ممنوعاً.
drop policy if exists "used_questions: update own" on public.used_questions;
create policy "used_questions: update own"
  on public.used_questions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on column public.used_questions.used_at is
  'زمن آخر ظهور (كان أوّله حتى ٢٣ سبتمبر ٢٠٢٦). تعتمد عليه قاعدة «الأقدم استخداماً» (SPEC ٨).';
