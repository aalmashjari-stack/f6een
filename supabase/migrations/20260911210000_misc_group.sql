-- مظلّة «منوعات» أخيرةً في الترتيب، وتضمّ الفئات الثلاث التي بقيت بلا مظلّة
-- (قرار علي ١١ سبتمبر ٢٠٢٦): أكلات · أمثال وألغاز · الكويت.
--
-- ولا يُنشأ عنوان «متفرّقات» بالكود لفئةٍ بلا مظلّة — الإعداد يعرضها بلا
-- عنوان (قرار ١٠ سبتمبر). فهذه مظلّة حقيقيّة في الجدول كغيرها.

insert into public.category_groups (name, sort) values ('منوعات', 5)
on conflict (name) do nothing;

update public.categories
   set group_name = 'منوعات'
 where name in ('أكلات', 'أمثال وألغاز', 'الكويت')
   and group_name is null;
