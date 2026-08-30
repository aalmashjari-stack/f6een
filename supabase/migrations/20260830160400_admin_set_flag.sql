-- لوحة الإدارة — قرار المراجعة.
--
-- ثلاث حالات لا أكثر: `pending` محجوز، `ok` روجع وعاد إلى السحب،
-- `disabled` ملغى نهائياً. و«تعديل السؤال» ليس حالةً هنا: نصّ السؤال يعيش
-- في الملفّ المشحون مع التطبيق، فالتعديل يقع في البنك ويصل الأجهزة مع
-- التحديث — والقرار المسجَّل هنا هو `ok` بعده.

create function public.admin_set_flag(p_question_id text, p_status text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  qid text := btrim(coalesce(p_question_id, ''));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_status not in ('pending', 'ok', 'disabled') then
    raise exception 'bad_status';
  end if;

  insert into public.question_flags (question_id, status, note, reviewed_at)
  values (qid, p_status, nullif(btrim(coalesce(p_note, '')), ''), now())
  on conflict (question_id) do update
    set status      = excluded.status,
        note        = coalesce(excluded.note, public.question_flags.note),
        reviewed_at = now();

  return p_status;
end;
$$;

revoke execute on function public.admin_set_flag(text, text, text) from public, anon;
grant  execute on function public.admin_set_flag(text, text, text) to authenticated;
