-- ربط صور الإجابة بدفعتَي ٢١–٢٢ سبتمبر ٢٠٢٦ (زيادة الفئات الجديدة إلى 30/خليّة):
-- • دفعة النصوص b4d8190a (المسلسلات الأربعة والدوري الإنجليزي ودوري الأبطال): ثمانية
--   وجوهٍ مشحونة `pic-face-…` لأجوبةٍ لها صور في البنك أصلاً.
-- • دفعة «ولا كلمة» b5e1a51d: 36 ملصقاً `pic-kilma-…` جُلبت من الويب كسابقتها (PR #145).
-- المسوّدات تحمل `answer_image` منذ 20260920170000 والاعتماد ينسخه — فالربط قبل الاعتماد.
-- والأمثال الأربعة بلا ملصق عمداً.

update public.question_drafts d
   set answer_image = v.key
  from (values
  ('الدوري الإنجليزي', 'من هدّاف الدوري في موسم 2024-2025؟', 'pic-face-mohamed-salah'),
  ('الدوري الإنجليزي', 'من الهدّاف الإنجليزيّ الذي رحل عن توتنهام إلى بايرن ميونخ سنة 2023؟', 'pic-face-harry-kane'),
  ('الدوري الإنجليزي', 'من الهدّاف الأوروغوايانيّ الذي سجّل 31 هدفاً لليفربول في موسم 2013-2014 ثمّ انتقل إلى برشلونة؟', 'pic-face-luis-suarez'),
  ('الدوري الإنجليزي', 'من قاد تشيلسي إلى ثنائيّة الدوري والكأس سنة 2010؟', 'pic-face-carlo-ancelotti'),
  ('دوري أبطال أوروبا', 'من سجّل خمسة أهدافٍ في مباراةٍ واحدة أمام لايبزيغ سنة 2023؟', 'pic-face-erling-haaland'),
  ('دوري أبطال أوروبا', 'من المدرّب الفرنسيّ الذي قاد ريال مدريد إلى ثلاثة ألقابٍ متتالية بين 2016 و2018؟', 'pic-face-zinedine-zidane'),
  ('دوري أبطال أوروبا', 'من افتتح التسجيل لبايرن في نهائيّ 2012 قبل أن يعادل دروغبا؟', 'pic-face-thomas-muller'),
  ('دوري أبطال أوروبا', 'من الهدّاف التاريخيّ لباريس سان جيرمان في المسابقة؟', 'pic-face-kylian-mbappe'),
  ('ولا كلمة', 'همام في أمستردام', 'pic-kilma-hammam-amsterdam'),
  ('ولا كلمة', 'الناظر', 'pic-kilma-alnazir'),
  ('ولا كلمة', 'اللمبي', 'pic-kilma-allimby'),
  ('ولا كلمة', 'عسل أسود', 'pic-kilma-asal-eswed'),
  ('ولا كلمة', 'حامي الديار', 'pic-kilma-hami-aldiyar'),
  ('ولا كلمة', 'بيت الطين', 'pic-kilma-bait-altin'),
  ('ولا كلمة', 'مرايا', 'pic-kilma-maraya'),
  ('ولا كلمة', 'إنت عمري', 'pic-kilma-enta-omri'),
  ('ولا كلمة', 'خرج ولم يعد', 'pic-kilma-kharaj-walam-yaud'),
  ('ولا كلمة', 'الكيف', 'pic-kilma-alkeif'),
  ('ولا كلمة', 'أيام شامية', 'pic-kilma-ayyam-shamiya'),
  ('ولا كلمة', 'بو كريم برقبته سبع حريم', 'pic-kilma-bu-kreem'),
  ('ولا كلمة', 'صعيدي في الجامعة الأمريكية', 'pic-kilma-saidi'),
  ('ولا كلمة', 'طيور الظلام', 'pic-kilma-tuyur-alzalam'),
  ('ولا كلمة', 'الرسالة', 'pic-kilma-alrisala'),
  ('ولا كلمة', 'عمر', 'pic-kilma-omar'),
  ('ولا كلمة', 'سواح', 'pic-kilma-sawah'),
  ('ولا كلمة', 'الحب كله', 'pic-kilma-alhob-kollo'),
  ('ولا كلمة', 'الفصول الأربعة', 'pic-kilma-alfusul-alarbaa'),
  ('ولا كلمة', 'الحرافيش', 'pic-kilma-alharafish'),
  ('ولا كلمة', 'المومياء', 'pic-kilma-almumya'),
  ('ولا كلمة', 'ليالي الصالحية', 'pic-kilma-layali-alsalihiya'),
  ('ولا كلمة', 'إلى أبي وأمي مع التحية', 'pic-kilma-ila-abi-w-ummi'),
  ('ولا كلمة', 'زيزينيا', 'pic-kilma-zizinia'),
  ('ولا كلمة', 'حديث الصباح والمساء', 'pic-kilma-hadith-alsabah'),
  ('ولا كلمة', 'زي الهوا', 'pic-kilma-zay-alhawa'),
  ('ولا كلمة', 'الجوارح', 'pic-kilma-aljawarih'),
  ('ولا كلمة', 'الرجل الذي فقد ظله', 'pic-kilma-alrajul-alladhi'),
  ('ولا كلمة', 'بداية ونهاية', 'pic-kilma-bidaya-w-nihaya'),
  ('ولا كلمة', 'الزوجة الثانية', 'pic-kilma-alzawja-althaniya'),
  ('ولا كلمة', 'أم العروسة', 'pic-kilma-umm-alarusa'),
  ('ولا كلمة', 'الحفيد', 'pic-kilma-alhafid'),
  ('ولا كلمة', 'بين السما والأرض', 'pic-kilma-bain-alsama'),
  ('ولا كلمة', 'أبو كامل', 'pic-kilma-abu-kamil'),
  ('ولا كلمة', 'الأيدي الناعمة', 'pic-kilma-alaydi'),
  ('ولا كلمة', 'فات الميعاد', 'pic-kilma-fat-almiad')
  ) as v(category, question, key)
 where d.batch in ('b4d8190a-8edb-478c-b2b7-d0c1f207a222', 'b5e1a51d-ba2e-4911-8e38-ec8bfc9bf7a7')
   and d.category = v.category
   and d.question = v.question
   and d.answer_image is null;
