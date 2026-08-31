-- صندوق «تواصل معنا» — رسائل اللاعبين (١ سبتمبر ٢٠٢٦).
--
-- جدولٌ لا بريد: الإرسال ببريد `mailto:` يفتح تطبيق بريد الجهاز، وأكثرُ
-- اللاعبين على الجوال بلا حسابٍ مضبوط فيه — فالرسالة لا تُرسل ولا يعلم
-- المرسِل. هنا تُكتب في القاعدة فوراً، ويقرأها المدير في اللوحة.
--
-- والقاعدة الحاكمة نفسها (supabase/README): العميل لا يكتب مباشرةً، بل
-- بدالّة `security definer` واحدة. فلا يستطيع أحدٌ الكتابةَ باسم غيره ولا
-- تعديلَ حالة رسالة ولا قراءةَ رسائل الآخرين.

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  -- بريد التواصل يُلتقط لحظة الإرسال لا يُقرأ لاحقاً من الحساب: قد يحذف
  -- اللاعب حسابه (‎on delete set null‎ أعلاه) والرسالة تبقى ويبقى الردّ ممكناً.
  email      text not null,
  body       text not null,
  status     text not null default 'new' check (status in ('new', 'read', 'done')),
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'رسائل «تواصل معنا». تُكتب بـsend_message وحدها، ولا يقرأها إلا المدير.';

create index messages_new_idx on public.messages (created_at desc) where status = 'new';

alter table public.messages enable row level security;

-- لا سياسة قراءة لغير المدير: اللاعب يرسل ولا يستعرض. والمدير يقرأ الكلّ.
create policy "messages: admin reads"
  on public.messages for select
  using (public.is_admin());

create policy "messages: admin updates"
  on public.messages for update
  using (public.is_admin())
  with check (public.is_admin());

-- الإرسال — الباب الوحيد.
--
-- السقف خمس رسائل في الساعة لكل حساب: بابٌ مفتوح للكتابة في جدولٍ يقرأه
-- المدير هو باب إغراقٍ أيضاً، والحدّ هنا في المعاملة نفسها لا في العميل
-- حيث يُلتفّ عليه.
create function public.send_message(p_body text, p_email text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid    uuid := (select auth.uid());
  body   text := btrim(coalesce(p_body, ''));
  mail   text := btrim(coalesce(p_email, ''));
  recent integer;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if body = '' then
    raise exception 'empty_message';
  end if;

  -- سقفٌ للطول: حقلٌ حرّ بلا حدٍّ يُملأ بميغابايت.
  if length(body) > 4000 then
    raise exception 'message_too_long';
  end if;

  select count(*) into recent
    from public.messages m
   where m.user_id = uid and m.created_at > now() - interval '1 hour';

  if recent >= 5 then
    raise exception 'too_many_messages';
  end if;

  -- البريد من الحساب حين لا يكتبه المرسِل — فلا رسالة بلا عنوانٍ للردّ.
  if mail = '' then
    select u.email into mail from auth.users u where u.id = uid;
  end if;

  insert into public.messages (user_id, email, body)
  values (uid, coalesce(mail, ''), body);
end;
$$;

revoke execute on function public.send_message(text, text) from public, anon;
grant  execute on function public.send_message(text, text) to authenticated;

-- قراءة اللوحة — أحدث أوّلاً.
create function public.admin_messages(p_limit integer default 200)
returns table (
  id         uuid,
  email      text,
  body       text,
  status     text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.email, m.body, m.status, m.created_at
    from public.messages m
   where public.is_admin()
   order by m.created_at desc
   limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

revoke execute on function public.admin_messages(integer) from public, anon;
grant  execute on function public.admin_messages(integer) to authenticated;

create function public.admin_set_message_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_status not in ('new', 'read', 'done') then
    raise exception 'bad_status';
  end if;

  update public.messages set status = p_status where id = p_id;
end;
$$;

revoke execute on function public.admin_set_message_status(uuid, text) from public, anon;
grant  execute on function public.admin_set_message_status(uuid, text) to authenticated;
