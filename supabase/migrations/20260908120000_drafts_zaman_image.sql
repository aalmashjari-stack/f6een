-- مفتاح «زمن جميل» في حارس صور المسوّدات.
--
-- الحارس في `20260907120000_drafts_image.sql` يقبل مفتاحَي صورةٍ مشحونة
-- (`celeb-` و`landmark-`) ورابطَ دلو `art` — وما عداهما يُردّ. وفئة «زمن
-- جميل» تشحن صورها في `assets/zaman/` بمفاتيح `zaman-…`، فرُدّت دفعتُها
-- كلُّها. والدالّة تُعاد كاملةً بالنمط الموسَّع: تبديلُ سطرٍ في هجرةٍ
-- سابقة يترك القاعدةَ الحيّة على القديم.

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
    if (r ->> 'level') not in ('سهل', 'متوسط', 'صعب') then
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

/* ═══════════════ ٣) الاعتماد ينقل الصورة ═══════════════ */
--
-- وحارسُ التكرار يتخطّى المصوَّر: نصّ أسئلة الصور واحدٌ بطبعه («من صاحب
-- الصورة؟»)، فمقارنتُه بالنصّ تردّ كلَّ صورةٍ بعد الأولى — وهو الخلل الذي
-- أصلحناه في مستورِد اللوحة، ويلزم هنا مثله.

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

    qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');

    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, image, family, origin, updated_by)
    values
      (qid, d.category, d.level, d.topic, d.question, d.answer, d.image, d.family, 'new',
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

revoke execute on function public.admin_approve_drafts(uuid) from public, anon;
grant  execute on function public.admin_approve_drafts(uuid) to authenticated;
