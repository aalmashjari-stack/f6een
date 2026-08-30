-- لوحة الإدارة (١٠) — بلاغات الأسئلة.
--
-- زرّ «بلّغ عن سؤال» في شاشة الختام (SPEC ١٠) يكتب المعرّف داخل حالة
-- الجلسة، ولم يكن له وجهة يُقرأ منها — فبقيت البلاغات مكتوبةً لا مقروءة.
-- هذه تفتحها: معرّف السؤال، وكم مرّةً بُلّغ عنه، وآخر مرّة.
--
-- ولا نصّ السؤال هنا: البنك يُشحن مع التطبيق (`data/questions-bank-v5.json`)
-- فالواجهة تحلّ المعرّف بنفسها — ونسخُ النصّ في القاعدة يصنع مصدرَي حقيقة
-- يفترقان أوّل تصحيح.

create function public.admin_reports()
returns table (
  question_id text,
  reports     integer,
  last_at     timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.qid, count(*)::int, max(s.created_at)
  from public.sessions s
  cross join lateral jsonb_array_elements_text(
    coalesce(s.state -> 'reportedQuestionIds', '[]'::jsonb)
  ) as r(qid)
  where public.is_admin()
  group by r.qid
  order by count(*) desc, max(s.created_at) desc;
$$;

revoke execute on function public.admin_reports() from public, anon;
grant  execute on function public.admin_reports() to authenticated;
