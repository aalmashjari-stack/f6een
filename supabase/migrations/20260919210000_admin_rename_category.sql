-- **إعادة تسمية فئةٍ مضافة** — طلب علي ١٩ سبتمبر ٢٠٢٦.
--
-- اسمُ الفئة مكتوبٌ في كلّ سؤالٍ من أسئلتها (`question_overrides.category`
-- نصٌّ لا رقم) وفي مسوّداتها، فالتسمية تمسّ ثلاثة جداول في معاملةٍ واحدة —
-- كما فعلت هجرتا `rename_din_wa_sira` و`rename_sports_numbers` بيدٍ. وتُرفع
-- `updated_at` لتتغيّر `bank_signature` فتصل التسمية إلى أجهزة اللاعبين.
--
-- **الفئة المشحونة لا تُعاد تسميتها من هنا** (`is_extra = false` أو لا صفّ
-- لها): اسمُها في ملفّ البنك المشحون وخريطة الصور وأسماء العرض في الحزمة،
-- فتسميتُها إصدارٌ لا ضغطة. واللوحة تقول ذلك عند الرفض بدل أن تعطّل الزرّ.
--
-- والاسمُ الجديد لا يصادف فئةً قائمة — في الجدول أو في البنك — وإلّا اندمجت
-- فئتان بلا رجعة.

create or replace function public.admin_rename_category(p_old text, p_new text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_name text := btrim(coalesce(p_old, ''));
  new_name text := btrim(coalesce(p_new, ''));
  row_extra boolean;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if length(new_name) < 2 then
    raise exception 'name_too_short';
  end if;

  if new_name = old_name then
    return old_name;
  end if;

  select c.is_extra into row_extra from public.categories c where c.name = old_name;
  if row_extra is null then
    raise exception 'no_such_category';
  end if;
  if not row_extra then
    raise exception 'shipped_category';
  end if;

  if exists (select 1 from public.categories c where c.name = new_name)
     or exists (select 1 from public.question_overrides o where o.category = new_name) then
    raise exception 'category_exists';
  end if;

  update public.categories set name = new_name where name = old_name;

  update public.question_overrides
     set category = new_name, updated_at = now()
   where category = old_name;

  update public.question_drafts
     set category = new_name
   where category = old_name;

  return new_name;
end;
$$;

revoke execute on function public.admin_rename_category(text, text) from public, anon;
grant  execute on function public.admin_rename_category(text, text) to authenticated;
