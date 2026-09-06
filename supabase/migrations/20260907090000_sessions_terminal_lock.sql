-- الجلسة المنتهية لا تُفتح ثانيةً (٧ سبتمبر ٢٠٢٦).
--
-- سياسة «sessions: update own» تسمح لصاحب الصفّ بتعديل أيّ عمود ما دام
-- الصفّ صفَّه — ومنها `status`. فعميلٌ معدَّل يعيد جلسةً `finished` إلى
-- `open`، ثمّ يردّها له `start_session` استئنافاً بلا خصم: لعبٌ بلا رصيد
-- (تدقيق ٦ سبتمبر ٢٠٢٦، أُعيد إنتاجه على هجرات المستودع).
--
-- الحارس مُطلِقٌ لا سياسة: السياسة ترى الصفّ الجديد وحده، والمُطلِق يرى
-- القديم والجديد معاً. ويبقى تعديلُ `state` على الجلسة المغلقة مسموحاً —
-- لقطةُ البلاغات تُكتب بعد الختام على الجلسة نفسها (انظر App).
--
-- يُطبَّق في محرّر SQL على كتلتين: الدالّة وحدها، ثمّ المُطلِق.

/* ═══════════════ ١) الدالّة ═══════════════ */

create or replace function public.sessions_lock_terminal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'open' and new.status is distinct from old.status then
    raise exception 'session_closed' using
      hint = 'الجلسة المنتهية لا تُفتح ثانيةً';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'session_owner_fixed';
  end if;
  return new;
end;
$$;

/* ═══════════════ ٢) المُطلِق ═══════════════ */

drop trigger if exists sessions_lock_terminal on public.sessions;
create trigger sessions_lock_terminal
  before update on public.sessions
  for each row execute function public.sessions_lock_terminal();
