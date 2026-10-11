-- حارس روابط الصور (`question_overrides_image_guard`) كان يقبل المفتاح المشحون
-- بحروفٍ لاتينيّة فقط، وفي البنك 49 سؤالاً صورةُ إجابتها مفتاحٌ عربيّ مشحونٌ
-- فعلاً في `assets/pics` (`pic-place-قصر-الحمراء`، `pic-place-كامب-نو`…).
-- والحارس `before insert`، و`admin_save_question` تكتب بـ`insert … on conflict`
-- فيُرى كلُّ حفظٍ إدراجاً ولو لم تتغيّر الصورة: فلا يُحفظ أيُّ سؤالٍ من هذه
-- من اللوحة ولا يُغيَّر مستواه — ظهر ١٢ أكتوبر ٢٠٢٦ في «تطبيق مستويات المعروض»
-- بـ`bad_image_url` على خمسة.
--
-- المفتاحُ الآن أيّ حروفٍ بعد البادئة ما خلا الشرطة المائلة والنقطتين والفراغ،
-- فيبقى الرابطُ الخارجيّ مردوداً كما كان.

create or replace function public.is_art_ref(p text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p ~ '^(celeb|landmark|zaman|pic)-[^/:[:space:]]+$'
      or p ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/art/'
$$;
