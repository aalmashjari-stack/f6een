-- لوحة الإدارة — حذف فئة مضافة.
--
-- **يُمنع الحذف ما دامت تحمل أسئلة.** حذفها وهي عامرة يترك أسئلتها بفئة
-- لا تصل إليها العجلة أبداً: لا تُسحب ولا تظهر في اللوحة تحت فئتها، فتضيع
-- صامتةً. تُنقل أسئلتها أو تُحذف أوّلاً.

create function public.admin_delete_category(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(p_name, ''));
  n     integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select count(*) into n
    from public.question_overrides o
   where o.category = clean;

  if n > 0 then
    raise exception 'category_in_use';
  end if;

  delete from public.categories c where c.name = clean;

  if not found then
    raise exception 'no_such_category';
  end if;

  return clean;
end;
$$;

revoke execute on function public.admin_delete_category(text) from public, anon;
grant  execute on function public.admin_delete_category(text) to authenticated;
