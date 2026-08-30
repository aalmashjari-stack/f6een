-- بلاغ سؤال — يسجّل ويحجز في معاملة واحدة.
--
-- **الحجز فوريّ لا بعد عتبة.** سؤالٌ معطوب يفسد جلسةً كاملة، والبنك ستّمئة
-- سؤال فحجزُ واحدٍ منها لا يُحسّ. وحين يُفتح التطبيق للعامّة يصير هذا باباً
-- لعبثٍ محتمل — عندها تُضاف عتبة «بلاغان من حسابين» هنا، في سطر واحد.
--
-- وسؤالٌ سبق أن روجع وأُعيد (`ok`) لا يعود محجوزاً ببلاغ جديد: العدّاد يرتفع
-- ويراه المدير، ولا يُلغى قراره بضغطة لاعب.

create function public.report_question(p_question_id text, p_session_id uuid default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  qid    text := btrim(coalesce(p_question_id, ''));
  result text;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;

  if qid = '' then
    raise exception 'no_question';
  end if;

  insert into public.question_reports (question_id, user_id, session_id)
  values (qid, (select auth.uid()), p_session_id)
  on conflict (question_id, user_id) do nothing;

  if not found then
    -- بلاغ مكرّر من الحساب نفسه: لا يرفع العدّاد ولا يغيّر الحالة.
    select f.status into result from public.question_flags f where f.question_id = qid;
    return coalesce(result, 'pending');
  end if;

  insert into public.question_flags (question_id, reports, last_at)
  values (qid, 1, now())
  on conflict (question_id) do update
    set reports = public.question_flags.reports + 1,
        last_at = now(),
        status  = case
                    when public.question_flags.status = 'ok' then 'ok'
                    else 'pending'
                  end
  returning status into result;

  return result;
end;
$$;

revoke execute on function public.report_question(text, uuid) from public, anon;
grant  execute on function public.report_question(text, uuid) to authenticated;
