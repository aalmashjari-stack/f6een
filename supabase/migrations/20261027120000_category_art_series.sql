-- صور المسلسلات الأربعة شفّافةً فوق «الأشعّة» (علي ٢٧ أكتوبر ٢٠٢٦: «الصورة موجودة
-- في سطح المكتب قم باضافة الخلفية لها ثم اضفها»): صورٌ فوتوغرافيّة للشخصيّات مقصوصةٌ
-- بـVision بدل رسوم الألوان المائيّة المرفوعة. مشحونةٌ في الحزمة (assets/categories/v2،
-- ART_V2 في categoryArt.ts)، والمرفوع من اللوحة يعلو على المشحون — فيُمسح رابطها
-- لتظهر الجديدة، كما في 20261026200000_category_art_general_sports. والملفّات في الدلو باقية.

update public.categories
   set art_url = null
 where name in ('Game of thrones', 'Prison break', 'Breaking bad', 'Dexter');
