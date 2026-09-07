-- طبقة المسوّدات: طريقٌ يكتب اقتراحات أسئلة، ولا يمسّ البنك (٧ سبتمبر ٢٠٢٦).
--
-- الباعث أنّ تجهيز فئةٍ جديدة صار يمرّ بعلي في كلّ خطوة: يفتح اللوحة،
-- وينشئ الفئة، ويختار الملفّ، ويقرأ العدّاد. أراد أن يبقى **البوّابة** لا
-- **المنفّذ**.
--
-- والحلّ ليس مفتاح خدمة: `service_role` يتجاوز الحراسة كلّها، فمن يملكه
-- يقرأ الحسابات ويكتب الأرصدة — والقاعدة المكتوبة منذ أغسطس أنّه لا يدخل
-- الشيفرة أبداً. ولا حساب مدير بكلمة سرّ.
--
-- بل مفتاحٌ خاصّ بهذا الطريق وحده، يُنادى بالمفتاح العلنيّ كأيّ نداء،
-- ولا يستطيع إلّا شيئاً واحداً: **الكتابة في المسوّدات**. لا حذف، ولا
-- تعديل سؤالٍ قائم، ولا مسّ رصيد، ولا قراءة حساب. والاعتمادُ وحده — بيد
-- المدير في اللوحة — هو ما ينقل الصفوف إلى `question_overrides`.
--
-- **الفصل هو الحارس:** خطأٌ في المسوّدات يراه المدير قبل أن يراه المجلس.
-- ولو كُتب في البنك مباشرةً لوصل كلّ جهازٍ في المزامنة التالية.
--
-- يُطبَّق في محرّر SQL كتلةً كتلة، كلُّ دالّة وحدها في تشغيل مستقلّ.

/* ═══════════════ ١) الجدولان ═══════════════ */

create table if not exists public.agent_keys (
  name         text primary key,
  -- تجزئة sha256 ستّ‑عشريّة، لا المفتاح نفسه: من يقرأ الجدول لا ينتحل الطريق.
  key_hash     text not null unique,
  daily_limit  integer not null default 500,
  expires_at   timestamptz,
  revoked      boolean not null default false,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

comment on table public.agent_keys is
  'مفاتيح طرق الكتابة في المسوّدات. لا سياسة قراءة ولا كتابة — تُدار من محرّر SQL وحده، كجدول admins.';

alter table public.agent_keys enable row level security;

create table if not exists public.question_drafts (
  id         bigint generated always as identity primary key,
  -- الدفعة تُعتمد أو تُرفض كتلةً واحدة: مئةٌ وخمسون سؤالاً قرارٌ واحد لا مئة وخمسون.
  batch      uuid not null,
  source     text not null references public.agent_keys (name) on delete cascade,
  category   text not null,
  level      text not null check (level in ('سهل', 'متوسط', 'صعب')),
  topic      text,
  question   text not null,
  answer     text not null,
  family     text,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  question_id text
);

comment on column public.question_drafts.question_id is
  'معرّف السؤال بعد الاعتماد — الأثر الذي يربط المسوّدة بما صار في البنك.';

create index if not exists question_drafts_pending_idx
  on public.question_drafts (status, batch);

alter table public.question_drafts enable row level security;

-- القراءة للمدير وحده؛ ولا سياسة كتابة — الكتابة عبر الدالّة أدناه فقط.
drop policy if exists "drafts: admin reads" on public.question_drafts;
create policy "drafts: admin reads" on public.question_drafts
  for select using (public.is_admin());

/* ═══════════════ ٢) الكتابة بالمفتاح ═══════════════ */
--
-- تُنادى بالمفتاح العلنيّ (`anon`) — لا جلسة ولا حساب. والحراسة في الدالّة:
-- تجزئةُ المفتاح، وصلاحيّتُه، وسقفُ اليوم. والمفتاح لا يُسجَّل في أيّ عمود.

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
  ins     integer := 0;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'no_key';
  end if;

  select * into k from public.agent_keys a
   where a.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex');

  if not found or k.revoked or (k.expires_at is not null and k.expires_at < now()) then
    -- رسالةٌ واحدة للحالات كلّها: لا يُعرَف من الخطأ أنّ المفتاح موجودٌ ومنتهٍ.
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

  -- سقفُ اليوم يحدّ أثر أيّ خطأ أو تسرّب: طريقٌ مفتوح لا يغرق الجدول.
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

    insert into public.question_drafts
      (batch, source, category, level, topic, question, answer, family)
    values
      (b, k.name, btrim(r ->> 'category'), r ->> 'level',
       nullif(btrim(coalesce(r ->> 'topic', '')), ''),
       btrim(r ->> 'question'), btrim(r ->> 'answer'),
       nullif(btrim(coalesce(r ->> 'family', '')), ''));
    ins := ins + 1;
  end loop;

  update public.agent_keys set last_used_at = now() where name = k.name;

  return jsonb_build_object('batch', b, 'rows', ins);
end;
$$;

-- **هنا وحده يُمنح `anon`** في هذا المشروع كلّه، ولسببٍ واضح: لا جلسة
-- للطريق. والحراسة انتقلت من الدور إلى المفتاح داخل الدالّة.
revoke execute on function public.agent_submit_drafts(text, jsonb) from public;
grant  execute on function public.agent_submit_drafts(text, jsonb) to anon, authenticated;

/* ═══════════════ ٣) ما يقرؤه المدير ═══════════════ */

create or replace function public.admin_draft_batches()
returns table (
  batch uuid, source text, status text, n bigint,
  categories text, created_at timestamptz,
  easy bigint, medium bigint, hard bigint,
  missing_category boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.batch,
         min(d.source),
         min(d.status),
         count(*),
         string_agg(distinct d.category, ' · '),
         min(d.created_at),
         count(*) filter (where d.level = 'سهل'),
         count(*) filter (where d.level = 'متوسط'),
         count(*) filter (where d.level = 'صعب'),
         -- فئةٌ لم تُنشأ بعد: الاعتماد يُردّ حتى تُنشأ، واللوحة تقولها قبله.
         bool_or(not exists (
           select 1 from public.question_overrides o where o.category = d.category
           union all
           select 1 from public.categories c where c.name = d.category
         ))
    from public.question_drafts d
   where public.is_admin()
   group by d.batch
   order by min(d.created_at) desc;
$$;

revoke execute on function public.admin_draft_batches() from public, anon;
grant  execute on function public.admin_draft_batches() to authenticated;

create or replace function public.admin_draft_rows(p_batch uuid)
returns setof public.question_drafts
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.question_drafts d
   where public.is_admin() and d.batch = p_batch
   order by d.level, d.id;
$$;

revoke execute on function public.admin_draft_rows(uuid) from public, anon;
grant  execute on function public.admin_draft_rows(uuid) to authenticated;

/* ═══════════════ ٤) الاعتماد والرفض ═══════════════ */
--
-- الاعتماد هو الفعل الوحيد الذي يمسّ البنك، وهو بيد المدير. ويمرّ بالحرّاس
-- نفسها التي يمرّ بها الرفع من الملفّ: الفئة موجودة، والنصّ غير مكرّر.

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
    -- الفئة تُشترط موجودة ولا تُنشأ (قرار علي ٣١ أغسطس ٢٠٢٦).
    if not exists (select 1 from public.question_overrides o where o.category = d.category)
       and not exists (select 1 from public.categories c where c.name = d.category) then
      raise exception 'unknown_category: %', d.category;
    end if;

    -- نصٌّ موجودٌ أصلاً يُتخطّى ولا يُضاف ثانيةً — نفس تطبيع المستورِد.
    if exists (
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
      (question_id, category, level, topic, question, answer, family, origin, updated_by)
    values
      (qid, d.category, d.level, d.topic, d.question, d.answer, d.family, 'new',
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

create or replace function public.admin_reject_drafts(p_batch uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.question_drafts
     set status = 'rejected', decided_at = now(), decided_by = (select auth.uid())
   where batch = p_batch and status = 'pending';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.admin_reject_drafts(uuid) from public, anon;
grant  execute on function public.admin_reject_drafts(uuid) to authenticated;

/* ═══════════════ ٥) توليد مفتاح — يُنفَّذ مرّةً بيدك ═══════════════ */
--
-- يُبدَّل النصّ بمفتاحٍ تولّده أنت (مثلاً بـ`openssl rand -hex 32`)، ويُلصق
-- هذا التشغيلُ **وحده** بعد وضعه. المفتاح لا يُخزَّن — تجزئتُه فقط — فاحفظه
-- عندك لحظةَ توليده، ولا سبيل إلى استرجاعه بعدها.
--
--   insert into public.agent_keys (name, key_hash, daily_limit, expires_at)
--   values ('claude', encode(sha256(convert_to('<المفتاح هنا>', 'UTF8')), 'hex'), 500,
--           now() + interval '90 days');
--
-- والإلغاء سطرٌ واحد في أيّ لحظة:
--   update public.agent_keys set revoked = true where name = 'claude';
