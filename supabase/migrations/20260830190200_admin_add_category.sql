-- لوحة الإدارة — إضافة فئة.
--
-- الفئة تظهر في العجلة **حين تكتمل مستوياتها الثلاثة** (سهل ومتوسط وصعب)،
-- وهذا شرطٌ يفرضه العميل لا القاعدة: البنك في الملفّ فلا تعرف القاعدة كم
-- سؤالاً في الفئة. فالإضافة هنا تسجيل اسمٍ فقط، والعجلة تنتظر الأسئلة.

create function public.admin_add_category(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(p_name, ''));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if length(clean) < 2 then
    raise exception 'name_too_short';
  end if;

  insert into public.categories (name, created_by)
  values (clean, (select auth.uid()));

  return clean;

exception
  when unique_violation then
    raise exception 'category_exists';
end;
$$;

revoke execute on function public.admin_add_category(text) from public, anon;
grant  execute on function public.admin_add_category(text) to authenticated;
