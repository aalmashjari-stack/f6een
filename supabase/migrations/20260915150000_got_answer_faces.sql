-- صورةٌ مع الإجابة لأسماء شخصيات «صراع العروش» (طلب علي ١٥ سبتمبر ٢٠٢٦).
--
-- الصورةُ صورةُ الممثّل من كومنز لا لقطةٌ من المسلسل — لقطاتُ المسلسل
-- محفوظة الحقوق ولا تُشحن في لعبةٍ تُباع. 28 وجهاً في `assets/pics/pic-got-…`
-- ورخصُها في `attribution.json`، اختيرت بالعين على قصّ المربّع الأوسط الذي
-- يعرضه `AnswerFace` (أُسقطت أولينا: لا صورة لديانا ريغ تُعرَف بها).
--
-- والأسئلة وصلت مسوّداتٍ لا بنكاً (الدفعة 15a1ca8d)، والمسوّدات بلا عمود
-- صورة إجابة — فالمطابقة هنا بالفئة والجواب **بعد الاعتماد**: التشغيل قبله
-- يمسّ صفراً من الصفوف ويُحسب مطبَّقاً. ولا يُكتب فوق صورةٍ قائمة.

update public.question_overrides o
   set answer_image = v.key, updated_at = now()
  from (values
  ('تيريون',                 'pic-got-tyrion'),
  ('بيتر دينكلاج',           'pic-got-tyrion'),
  ('آريا',                   'pic-got-arya'),
  ('ميزي ويليامز',           'pic-got-arya'),
  ('سانسا',                  'pic-got-sansa'),
  ('صوفي تيرنر',             'pic-got-sansa'),
  ('جوفري',                  'pic-got-joffrey'),
  ('غريغور كليغين',          'pic-got-mountain'),
  ('ساندور كليغين',          'pic-got-hound'),
  ('كاتلين',                 'pic-got-catelyn'),
  ('جورج آر آر مارتن',       'pic-got-grrm'),
  ('بيتر بيليش',             'pic-got-littlefinger'),
  ('فاريس',                  'pic-got-varys'),
  ('خال دروغو',              'pic-got-drogo'),
  ('برين أوف تارث',          'pic-got-brienne'),
  ('سامويل تارلي',           'pic-got-sam'),
  ('تومن',                   'pic-got-tommen'),
  ('فيسيريس',                'pic-got-viserys'),
  ('سيريو فوريل',            'pic-got-syrio'),
  ('إيغون تارغاريان',        'pic-got-jon'),
  ('كيت هارينغتون',          'pic-got-jon'),
  ('غراي وورم',              'pic-got-greyworm'),
  ('ميليساندر',              'pic-got-melisandre'),
  ('ستانيس',                 'pic-got-stannis'),
  ('بران',                   'pic-got-bran'),
  ('هودور',                  'pic-got-hodor'),
  ('لينا هيدي',              'pic-got-cersei'),
  ('إيغريت',                 'pic-got-ygritte'),
  ('ميرسيلا',                'pic-got-myrcella'),
  ('نيكولاي كوستر-فالداو',   'pic-got-jaime'),
  ('رامين جوادي',            'pic-got-djawadi'),
  ('إيميليا كلارك',          'pic-got-daenerys')
  ) as v(answer, key)
 where o.category = 'صراع العروش'
   and o.answer = v.answer
   and o.answer_image is null;
