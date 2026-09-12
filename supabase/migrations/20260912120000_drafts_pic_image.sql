-- مفتاح `pic-` في حارس صور المسوّدات.
--
-- الحارس في `agent_submit_drafts` يقبل ثلاثة مفاتيح صورٍ مشحونة (`celeb-`
-- و`landmark-` و`zaman-`) ورابطَ دلو `art` — وما عداهما يُردّ بـ`bad_image_url`.
-- وصورُ ١٢ سبتمبر ٢٠٢٦ تعيش في مجلّدٍ رابع `assets/pics/` بمفاتيح `pic-…`:
-- مجلّدٌ واحد لصورٍ موزَّعة على فئاتٍ قائمة (حضارات قديمة، السيرة النبويّة،
-- الفقه والعبادات، لغة عربيّة، كأس العالم…) بدل مجلّدٍ لكلّ فئة — انظر
-- `src/game/pics.ts`.
--
-- والدالّة تُعاد كاملةً كما في هجرة `zaman`: تبديلُ سطرٍ في هجرةٍ سابقة
-- يغيّر الملفّ ولا يمسّ القاعدة الحيّة. والنصّ نسخةٌ من
-- `20260909100000_level_taajizi.sql` لا يتغيّر فيه إلّا النمط وتعليقُه.

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
