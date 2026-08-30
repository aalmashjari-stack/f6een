-- لوحة الإدارة — تعيين صورة فئة (مضافة كانت أو مشحونة).
--
-- الرابط يأتي من دلو `art` بعد الرفع. و`null` يعيد الفئة إلى صورتها
-- المشحونة إن كانت لها واحدة، وإلى بطاقةٍ بلونها واسمها إن لم تكن.

create function public.admin_set_category_art(p_name text, p_url text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(p_name, ''));
  url   text := nullif(btrim(coalesce(p_url, '')), '');
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if clean = '' then
    raise exception 'no_such_category';
  end if;

  insert into public.categories (name, art_url, is_extra, created_by)
  values (clean, url, false, (select auth.uid()))
  on conflict (name) do update
    set art_url = excluded.art_url;

  return clean;
end;
$$;

revoke execute on function public.admin_set_category_art(text, text) from public, anon;
grant  execute on function public.admin_set_category_art(text, text) to authenticated;
