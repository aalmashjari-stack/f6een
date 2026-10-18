-- «نقلُ مستوى» في المسوّدات — طلب علي ١٨ أكتوبر ٢٠٢٦.
--
-- مراجعةُ «متوسط» رشّحت 168 سؤالاً قائماً للنقل إلى «صعب»، وأراد علي أن يراها
-- في لسان المسوّدات ويعتمدها هناك كما يعتمد الأسئلة الجديدة — لا هجرةً تُطبَّق
-- على قائمةٍ في ملفّ. والمسوّدات كانت **تُضيف ولا تعدّل**: سؤالٌ قائم يُرسَل
-- مسوّدةً يُتخطّى نصُّه عند الاعتماد (مكرّر)، والمصوَّرُ منه يُضاف نسخةً ثانية.
--
-- فالمسوّدة صار لها نوعٌ ثانٍ: `move_of` يحمل معرّف سؤالٍ قائم، و`from_level`
-- مستواه لحظةَ الإرسال، و`level` المستوى المقترح. والاعتماد يغيّر المستوى وحده —
-- لا نصّ ولا إجابة ولا صورة — **وبشرط أنّ المستوى ما زال `from_level`**: سؤالٌ
-- عدّله المدير بعد الإرسال لا يُنقل على حالٍ قديمة، بل تُرفض مسوّدتُه وتُعدّ.
--
-- والطريق ما زال لا يعدّل البنك: هو يقترح النقل، والاعتماد بيد المدير. ونصُّ
-- المسوّدة يُنسخ من السؤال القائم لا ممّا أرسله الطريق، فما يراه المدير في
-- اللسان هو بالضبط ما سيُنقل.
--
-- و`note` سطرٌ يشرح الاقتراح (سبب المراجِع في النقل) يُعرض تحت السؤال.

alter table public.question_drafts add column if not exists move_of text;
alter table public.question_drafts add column if not exists from_level text;
alter table public.question_drafts add column if not exists note text;

comment on column public.question_drafts.move_of is
  'معرّف سؤالٍ قائم في question_overrides — المسوّدة نقلُ مستوى لا سؤالٌ جديد.';
comment on column public.question_drafts.from_level is
  'مستوى السؤال القائم لحظة الإرسال؛ الاعتماد لا ينقل إلّا إن بقي عليه.';
comment on column public.question_drafts.note is
  'سطرٌ يشرح الاقتراح للمدير — يُعرض في لسان المسوّدات ولا يدخل البنك.';

/* ═══════════════ ١) الإرسال ═══════════════ */
-- آخر تعريفٍ (20260925190000) كما هو، وفرعُ `move_of` قبل حرّاس النصّ.

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
  mv      text;
  o       public.question_overrides;
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
    if (r ->> 'level') not in ('سهل', 'متوسط', 'صعب', 'تعجيزي') then
      raise exception 'bad_level';
    end if;

    /* نقلُ مستوى: كلُّ ما عدا المستوى يُنسخ من السؤال القائم. */
    mv := nullif(btrim(coalesce(r ->> 'move_of', '')), '');
    if mv is not null then
      select * into o from public.question_overrides x where x.question_id = mv;
      if not found then
        raise exception 'unknown_question: %', mv;
      end if;
      if o.level = (r ->> 'level') then
        raise exception 'same_level: %', mv;
      end if;

      insert into public.question_drafts
        (batch, source, category, level, topic, question, answer, family, image, answer_image,
         move_of, from_level, note)
      values
        (b, k.name, o.category, r ->> 'level', o.topic, o.question, o.answer, o.family,
         o.image, o.answer_image, mv, o.level,
         nullif(btrim(coalesce(r ->> 'note', '')), ''));
      ins := ins + 1;
      continue;
    end if;

    if btrim(coalesce(r ->> 'question', '')) = ''
       or btrim(coalesce(r ->> 'answer', '')) = '' then
      raise exception 'empty_question';
    end if;
    if btrim(coalesce(r ->> 'category', '')) = '' then
      raise exception 'no_category';
    end if;

    img := nullif(btrim(coalesce(r ->> 'image', '')), '');
    /* مفتاحٌ مشحون أو رابطٌ في دلو art — الشرط كلُّه في `is_art_ref`. */
    if img is not null and not public.is_art_ref(img) then
      raise exception 'bad_image_url';
    end if;

    insert into public.question_drafts
      (batch, source, category, level, topic, question, answer, family, image, note)
    values
      (b, k.name, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       nullif(btrim(coalesce(r ->> 'family', '')), ''),
       img,
       nullif(btrim(coalesce(r ->> 'note', '')), ''));
    ins := ins + 1;
  end loop;

  update public.agent_keys set last_used_at = now() where name = k.name;

  return jsonb_build_object('batch', b, 'rows', ins);
end;
$function$;
revoke execute on function public.agent_submit_drafts(text, jsonb) from public;
grant  execute on function public.agent_submit_drafts(text, jsonb) to anon, authenticated;

/* ═══════════════ ٢) الاعتماد ═══════════════ */
-- آخر تعريفٍ (20261012090000) كما هو، وفرعُ النقل قبل حارس النصّ المكرّر —
-- فالمنقول نصُّه موجودٌ بطبعه. والخلايا التي خرج منها شيءٌ تمرّ بعدها على
-- `assert_cell_floor` كما في الرفع بالجملة.

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
  moved_n integer := 0;
  skipped integer := 0;
  left_   jsonb := '{}'::jsonb;
  cell    text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  for d in select * from public.question_drafts x
            where x.batch = p_batch and x.status = 'pending' order by x.id
  loop
    if d.move_of is not null then
      update public.question_overrides o
         set level = d.level, updated_by = (select auth.uid())
       where o.question_id = d.move_of and o.level = d.from_level;

      if not found then
        /* حُذف السؤال أو تغيّر مستواه بعد الإرسال — لا يُنقل على حالٍ قديمة. */
        skipped := skipped + 1;
        update public.question_drafts set status = 'rejected', decided_at = now(),
               decided_by = (select auth.uid())
         where id = d.id;
        continue;
      end if;

      cell := d.category || '|' || d.from_level;
      left_ := jsonb_set(left_, array[cell], to_jsonb(coalesce((left_ ->> cell)::int, 0) + 1));

      update public.question_drafts
         set status = 'approved', decided_at = now(),
             decided_by = (select auth.uid()), question_id = d.move_of
       where id = d.id;
      moved_n := moved_n + 1;
      continue;
    end if;

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

  for cell in select jsonb_object_keys(left_)
  loop
    perform public.assert_cell_floor(split_part(cell, '|', 1), split_part(cell, '|', 2),
                                     (left_ ->> cell)::int);
  end loop;

  return jsonb_build_object('added', added, 'moved', moved_n, 'skipped', skipped);
end;
$$;

/* ═══════════════ ٣) قائمة الدفعات ═══════════════ */
-- آخر تعريفٍ (20260915100000) وعمودٌ واحد: كم في الدفعة من نقل مستوى. وتغيُّرُ
-- شكل الإرجاع يلزمه `drop` قبل الإنشاء.

drop function if exists public.admin_draft_batches();
create function public.admin_draft_batches()
returns table (
  batch uuid, source text, status text, n bigint,
  categories text, created_at timestamptz,
  easy bigint, medium bigint, hard bigint, taajizi bigint,
  pending bigint, rejected bigint,
  missing_category boolean,
  moves bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with known as (
    select distinct o.category as name from public.question_overrides o
    union
    select c.name from public.categories c
  )
  select d.batch,
         min(d.source),
         case when count(*) filter (where d.status = 'pending') > 0 then 'pending'
              when count(*) filter (where d.status = 'approved') > 0 then 'approved'
              else 'rejected' end,
         count(*),
         string_agg(distinct d.category, ' · '),
         min(d.created_at),
         count(*) filter (where d.level = 'سهل'),
         count(*) filter (where d.level = 'متوسط'),
         count(*) filter (where d.level = 'صعب'),
         count(*) filter (where d.level = 'تعجيزي'),
         count(*) filter (where d.status = 'pending'),
         count(*) filter (where d.status = 'rejected'),
         bool_or(k.name is null),
         count(*) filter (where d.move_of is not null)
    from public.question_drafts d
    left join known k on k.name = d.category
   where public.is_admin()
   group by d.batch
   order by min(d.created_at) desc;
$$;
revoke execute on function public.admin_draft_batches() from public, anon;
grant  execute on function public.admin_draft_batches() to authenticated;
