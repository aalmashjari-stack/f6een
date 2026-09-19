-- **استبعادُ فئةٍ من اللوح مؤقّتاً** — طلب علي ١٩ سبتمبر ٢٠٢٦: «استبعاد
-- خليّة من اللوح، استبعاد مؤقّت وليس حذف».
--
-- الخليّة على اللوح فئةٌ (SPEC §٧)، والحذفُ يشترط أن تكون فارغة ويُضيّع
-- أسئلتها. أمّا هذا فعلمٌ على الفئة: ما دام مرفوعاً لا تدخل قائمةَ اختيار
-- الإعداد ولا فاصلَ التعادل (`playableCategories`)، وأسئلتُها في مكانها
-- والفئةُ في اللوحة كما هي، ورفعُ العلم يعيدها بضغطة.
--
-- والديربي لا يمسّه: الطلب «من اللوح» بحرفه، والديربي مخزونٌ بلا اختيار
-- فئة (`categories.derby` عمودٌ آخر). ومن أراد إخراجها منه أيضاً فذاك
-- قرارٌ ثانٍ.
--
-- صفُّ الفئة المشحونة قد لا يكون في الجدول، فالدالّة تُدرجه كما تفعل
-- `admin_set_category_art` — بـ`is_extra=false` كي لا تظهر الفئة مرّتين.

alter table public.categories
  add column if not exists hidden boolean not null default false;

comment on column public.categories.hidden is
  'مستبعَدة من اللوح مؤقّتاً — لا تدخل اختيار الإعداد. أسئلتها باقية، والعلم يُرفع من اللوحة.';

create or replace function public.admin_set_category_hidden(p_name text, p_hidden boolean)
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

  if clean = '' then
    raise exception 'no_such_category';
  end if;

  insert into public.categories (name, hidden, is_extra, created_by)
  values (clean, coalesce(p_hidden, false), false, (select auth.uid()))
  on conflict (name) do update
    set hidden = excluded.hidden;

  return clean;
end;
$$;

revoke execute on function public.admin_set_category_hidden(text, boolean) from public, anon;
grant  execute on function public.admin_set_category_hidden(text, boolean) to authenticated;

/* القارئ للاعب واللوحة — يحمل العمود الجديد. شكل الإرجاع تغيّر فتُسقط وتُعاد. */
drop function if exists public.extra_categories();

create function public.extra_categories()
returns table (name text, art_url text, is_extra boolean, group_name text, group_sort integer, derby boolean, hidden boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, c.art_url, c.is_extra, c.group_name, g.sort, c.derby, c.hidden
  from public.categories c
  left join public.category_groups g on g.name = c.group_name
  order by c.created_at;
$$;

comment on function public.extra_categories() is
  'الفئات المضافة وصفوفُ الصور البديلة، ومعها تصنيفُ كلٍّ وترتيبُه وعضويّتُه في الديربي واستبعادُه المؤقّت من اللوح. يقرؤها اللاعب واللوحة معاً.';

revoke execute on function public.extra_categories() from public, anon;
grant  execute on function public.extra_categories() to authenticated;
