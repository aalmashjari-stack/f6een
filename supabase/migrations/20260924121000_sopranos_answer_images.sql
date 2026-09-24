-- صور الإجابة (وجوه الممثّلين) لسبعة أسئلة من دفعة «The Sopranos» a69c45d3 قبل اعتمادها.
-- المطابقة بالفئة ونصّ السؤال؛ الوجوه مشحونة في assets/pics منذ PR #178.

update public.question_drafts set answer_image = 'pic-face-james-gandolfini'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'من الممثّل الذي أدّى دور توني سوبرانو؟';
update public.question_drafts set answer_image = 'pic-face-david-chase'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'من ابتكر «ذا سوبرانوز»؟';
update public.question_drafts set answer_image = 'pic-face-edie-falco'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'من الممثّلة التي أدّت دور كارميلا سوبرانو؟';
update public.question_drafts set answer_image = 'pic-face-steven-van-zandt'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'أيّ عازف غيتار في فرقة بروس سبرينغستين أدّى دور سيلفيو؟';
update public.question_drafts set answer_image = 'pic-face-lorraine-bracco'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'أيّ ممثّلةٍ من فيلم «الأصدقاء الطيّبون» أدّت دور الدكتورة ملفي؟';
update public.question_drafts set answer_image = 'pic-face-steve-buscemi'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'أيّ نجمٍ من «فارغو» و«ريزرفوار دوغز» انضمّ في الموسم الخامس بدور ابن عمّ توني؟';
update public.question_drafts set answer_image = 'pic-face-michael-gandolfini'
  where batch = 'a69c45d3-2275-44eb-a09b-4b5f1dc038bb' and category = 'The Sopranos' and question = 'أيّ ممثّلٍ أدّى توني شابّاً في الفيلم التمهيديّ، وهو ابن مؤدّي الدور الأصليّ؟';
