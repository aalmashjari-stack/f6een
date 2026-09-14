-- ثلاث عيّنات لصورة الإجابة على الموقع الحيّ (طلب علي ١٤ سبتمبر ٢٠٢٦: «حط
-- ٣ عيّنات في الموقع وأنا أتأكّد بنفسي»).
--
-- الدفعة الكاملة (411 صورة مشحونة، PR #95) تنتظر الدمج والنشر؛ أمّا هذه
-- الثلاث فروابط مباشرة إلى كومنز يقبلها `celebSrc` كما هي، فتظهر في
-- الإصدار المنشور الآن بلا نشرٍ جديد. مؤقّتة: هجرة الدفعة تستبدل بها
-- المفاتيح المشحونة (شرطها يشمل روابط `upload.wikimedia.org`).

update public.question_overrides o
   set answer_image = v.url, updated_at = now()
  from (values
    ('E034',    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Nelson_Mandela-2008_%28edit%29.jpg/500px-Nelson_Mandela-2008_%28edit%29.jpg'),
    ('E262',    'https://upload.wikimedia.org/wikipedia/commons/8/8b/Painting_of_Napoleon_Bonaparte_by_Jacques-Louis_David%2C_1813.jpg'),
    ('ADM1087', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/500px-Hagia_Sophia_Mars_2013.jpg')
  ) as v(question_id, url)
 where o.question_id = v.question_id
   and o.answer_image is null;
