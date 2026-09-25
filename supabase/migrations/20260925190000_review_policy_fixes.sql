-- قرارات علي ٢٥ سبتمبر ٢٠٢٦ على ما بقي من المراجعة الشاملة:
--
-- ١) أكواد الهدايا: خمس محاولات في اليوم للحساب. كانت بلا حدّ والخادم يقول
--    «غير موجود» صراحةً، فالكود القصير يُخمَّن. المحاولة الفاشلة كانت تُرجَع
--    بـ`raise` فتُرَدّ معها أيّ كتابة — لذا صارت الدالّة تعيد jsonb
--    ({games} أو {error}) وتسجّل كلّ محاولة. **شكل الإرجاع تغيّر**: العميل
--    القديم (بناء آيفون سابق) يفشل في «إضافة كود» حتى يُبنى.
-- ٢) روابط الصور: المحرّر كان يدخل أيّ رابط خارجيّ من اللوحة (النموذج
--    والرفع والفئات)، والمسوّدات وحدها محروسة. حارسٌ واحد على الجدولين
--    يقبل مفتاح صورةٍ مشحونة أو رابط دلو `art`. القائم لا يُمسّ (قيس:
--    لا رابط خارجيّ في القاعدة اليوم).
-- ٣) الرابط المكتوب صراحةً في `agent_submit_drafts` صار الحارس نفسه.
-- ٤) دلو `art`: 5 م.ب وصور jpeg/png/webp فقط (الأكبر اليوم 2.4 م.ب)،
--    والحذف للمدير الأعلى وحده — الملفّ المحذوف يكسر سؤاله عند الجميع.

/* ═══════════════ ١) أكواد الهدايا ═══════════════ */

create table if not exists public.gift_redeem_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists gift_redeem_attempts_user_at_idx
  on public.gift_redeem_attempts (user_id, at desc);
alter table public.gift_redeem_attempts enable row level security;
-- لا سياسات: الجدول لا يُقرأ ولا يُكتب إلّا من الدالّة.

drop function if exists public.redeem_gift_code(text);

create function public.redeem_gift_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid   uuid := (select auth.uid());
  c     public.gift_codes;
  used  integer;
  tries integer;
begin
  if uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select count(*) into tries from public.gift_redeem_attempts
   where user_id = uid and at > now() - interval '24 hours';
  if tries >= 5 then
    return jsonb_build_object('error', 'too_many_attempts');
  end if;
  insert into public.gift_redeem_attempts (user_id) values (uid);

  select * into c from public.gift_codes where code = p_code for update;
  if not found then
    return jsonb_build_object('error', 'code_not_found');
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return jsonb_build_object('error', 'code_expired');
  end if;
  if c.max_redemptions is not null then
    select count(*) into used from public.gift_redemptions where code = p_code;
    if used >= c.max_redemptions then
      return jsonb_build_object('error', 'code_exhausted');
    end if;
  end if;
  if exists (select 1 from public.gift_redemptions where code = p_code and user_id = uid) then
    return jsonb_build_object('error', 'code_already_used');
  end if;

  insert into public.gift_redemptions (code, user_id) values (p_code, uid);
  update public.profiles set games_balance = games_balance + c.games where id = uid;
  /* المحاولة الناجحة لا تُحسب على صاحبها. */
  delete from public.gift_redeem_attempts a
   where a.user_id = uid and a.at = (select max(at) from public.gift_redeem_attempts where user_id = uid);
  return jsonb_build_object('games', c.games);
end;
$$;

revoke execute on function public.redeem_gift_code(text) from public, anon;
grant  execute on function public.redeem_gift_code(text) to authenticated;

/* ═══════════════ ٢) حارس روابط الصور ═══════════════ */

create or replace function public.is_art_ref(p text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p ~ '^(celeb|landmark|zaman|pic)-[A-Za-z0-9._-]+$'
      or p ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/art/'
$$;

create or replace function public.question_overrides_image_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.image is not null and (tg_op = 'INSERT' or new.image is distinct from old.image)
     and not public.is_art_ref(new.image) then
    raise exception 'bad_image_url' using hint = 'الصورة من دلو art أو مفتاح مشحون فقط';
  end if;
  if new.answer_image is not null and (tg_op = 'INSERT' or new.answer_image is distinct from old.answer_image)
     and not public.is_art_ref(new.answer_image) then
    raise exception 'bad_image_url' using hint = 'صورة الجواب من دلو art أو مفتاح مشحون فقط';
  end if;
  return new;
end;
$$;

drop trigger if exists question_overrides_image_guard on public.question_overrides;
create trigger question_overrides_image_guard
  before insert or update on public.question_overrides
  for each row execute function public.question_overrides_image_guard();

create or replace function public.categories_art_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.art_url is not null and (tg_op = 'INSERT' or new.art_url is distinct from old.art_url)
     and not public.is_art_ref(new.art_url) then
    raise exception 'bad_image_url' using hint = 'صورة الفئة من دلو art فقط';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_art_guard on public.categories;
create trigger categories_art_guard
  before insert or update on public.categories
  for each row execute function public.categories_art_guard();

/* ═══════════════ ٣) المسوّدات: الحارس نفسه بلا رابط مكتوب ═══════════════ */

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
    /* الشرط نفسه في `is_art_ref` — لم يعد رابط المشروع مكتوباً هنا (٢٥ سبتمبر). */
    if img is not null and not public.is_art_ref(img) then
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

/* ═══════════════ ٤) دلو art ═══════════════ */

update storage.buckets
   set file_size_limit = 5 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'art';

drop policy if exists "art: admin deletes" on storage.objects;
create policy "art: super deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'art' and public.is_super());
