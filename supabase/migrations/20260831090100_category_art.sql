-- صورة الفئة — عمودٌ في جدول الفئات، ودالّةٌ تُعيد بناءها.
--
-- **الصفّ قد يوجد لفئةٍ مشحونة**: من أراد تبديل صورة «مشاهير» يحتاج مكاناً
-- يحفظ فيه الرابط، وفئات البنك ليست في هذا الجدول. فأُضيف `is_extra`:
-- الفئة المضافة تدخل قائمة الفئات، والصفّ الذي لا يحمل إلّا صورةً لفئةٍ
-- مشحونة لا يزيد في القائمة شيئاً — يبدّل صورتها فقط.

alter table public.categories add column art_url text;
alter table public.categories add column is_extra boolean not null default true;

comment on column public.categories.is_extra is
  'true = فئة أضافتها اللوحة · false = صفٌّ لا يحمل إلّا صورةً بديلة لفئةٍ مشحونة.';

-- شكل الإرجاع تغيّر، و`create or replace` لا يغيّر أعمدة الإرجاع.
drop function if exists public.extra_categories();

create function public.extra_categories()
returns table (name text, art_url text, is_extra boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, c.art_url, c.is_extra
  from public.categories c
  order by c.created_at;
$$;

revoke execute on function public.extra_categories() from public, anon;
grant  execute on function public.extra_categories() to authenticated;
