-- الفئات المضافة كما يقرؤها اللاعب — الأسماء وحدها.

create function public.extra_categories()
returns table (name text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name from public.categories c order by c.created_at;
$$;

revoke execute on function public.extra_categories() from public, anon;
grant  execute on function public.extra_categories() to authenticated;
