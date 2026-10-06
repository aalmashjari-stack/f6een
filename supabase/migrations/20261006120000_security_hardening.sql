/*
  الفحص الأمنيّ الشامل — ٦ أكتوبر ٢٠٢٦.

  ١) بريد «تواصل معنا» يُتحقَّق من صيغته.
     كان `send_message` يقصّ المسافات وحدها، والبريد يُعرض في اللوحة رابطَ
     `mailto:`. فبريدٌ مثل `x@y.com?bcc=attacker@evil.com` يُضيف نسخةً خفيّة
     إلى ردّ المدير حين يضغط «ردّ» — فيصل ردُّه إلى غير صاحب الرسالة. اللوحة
     صارت ترمّز العنوان، وهذا الحارس يمنع دخوله أصلاً.
     ويُفحص البريد الذي يكتبه المرسِل وحده؛ بريدُ الحساب يأتي من auth.users.

  ٢) سقفٌ لحجم لقطة الجلسة.
     `sessions.state` يكتبه اللاعب بسياسة update own وبـstart_session، بلا
     حدّ. جلسةٌ كاملة بعد نهايتها نحو 18 ك.ب (قيس بـsession-flow)، فالسقف
     ميغابايت — خمسون ضعفاً — يمنع حساباً واحداً من ملء قاعدة الخطّة
     المجّانيّة بكتابةٍ متكرّرة. و`not valid` لا يفحص الصفوف القديمة.
*/

/* ═══════════════ ١) send_message: صيغة البريد ═══════════════ */

create or replace function public.send_message(p_body text, p_email text default null)
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

  if length(body) > 4000 then
    raise exception 'message_too_long';
  end if;

  -- لا مسافة ولا ? & , ; < > ولا أقواس — كلّها تكسر رابط mailto أو تحقنه.
  if mail <> '' and (
       length(mail) > 254
       or mail !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'
     ) then
    raise exception 'invalid_email';
  end if;

  select count(*) into recent
    from public.messages m
   where m.user_id = uid and m.created_at > now() - interval '1 hour';

  if recent >= 5 then
    raise exception 'too_many_messages';
  end if;

  if mail = '' then
    select u.email into mail from auth.users u where u.id = uid;
  end if;

  insert into public.messages (user_id, email, body)
  values (uid, coalesce(mail, ''), body);
end;
$$;

revoke execute on function public.send_message(text, text) from public, anon;
grant  execute on function public.send_message(text, text) to authenticated;

/* ═══════════════ ٢) sessions.state: سقف الحجم ═══════════════ */

alter table public.sessions drop constraint if exists sessions_state_size;
alter table public.sessions
  add constraint sessions_state_size
  check (octet_length(state::text) <= 1048576) not valid;
