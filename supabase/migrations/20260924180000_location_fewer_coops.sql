-- «لوكيشن»: الجمعيّات التعاونيّة من 36 إلى 10 (قرار علي ٢٤ سبتمبر ٢٠٢٦: «كثرت جمعيات تعاونية»).
-- كان «تعجيزي» 20 جمعيّةً من 30. يبقى عشرٌ هي الأشهر (2 متوسط، 3 صعب، 5 تعجيزي)، وتُستبدل
-- 26 في مكانها بمعرّفها ومستواها: أندية ومجمّعات وأبراج ومستشفيات وشواطئ. الصور مشحونة في
-- assets/pics قبل هذه الهجرة؛ والمطابقة بمفتاح الصورة القديم (فريدٌ في الفئة) لا بتسلسل المعرّفات.

update public.question_overrides set answer = 'ونتر وندرلاند (Winter Wonderland)', image = 'pic-loc-winterwonderland', updated_at = now()
 where category = 'لوكيشن' and level = 'متوسط' and image = 'pic-loc-shamiyacoop';
update public.question_overrides set answer = 'شاطئ المسيلة', image = 'pic-loc-messilabeach', updated_at = now()
 where category = 'لوكيشن' and level = 'متوسط' and image = 'pic-loc-rumaithiyacoop';
update public.question_overrides set answer = 'جسر الشيخ جابر الأحمد', image = 'pic-loc-jaberbridge', updated_at = now()
 where category = 'لوكيشن' and level = 'متوسط' and image = 'pic-loc-jabriyacoop';
update public.question_overrides set answer = 'مجمّع الوزارات', image = 'pic-loc-ministries', updated_at = now()
 where category = 'لوكيشن' and level = 'متوسط' and image = 'pic-loc-rawdacoop';
update public.question_overrides set answer = 'برج الشهيد', image = 'pic-loc-shaheedtower', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-faihacoop';
update public.question_overrides set answer = 'مستشفى ابن سينا', image = 'pic-loc-ibnsina', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-adailiyacoop';
update public.question_overrides set answer = 'النادي البحري الرياضي', image = 'pic-loc-marineclub', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-khaldiyacoop';
update public.question_overrides set answer = 'مجمّع الشيخ سعد العبدالله الرياضي', image = 'pic-loc-saadcomplex', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-surracoop';
update public.question_overrides set answer = 'الجامعة الأسترالية', image = 'pic-loc-aust', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-salwacoop';
update public.question_overrides set answer = 'ديسكفري مول', image = 'pic-loc-discovery', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-dasmacoop';
update public.question_overrides set answer = 'أرابيلا', image = 'pic-loc-arabella', updated_at = now()
 where category = 'لوكيشن' and level = 'صعب' and image = 'pic-loc-daiyacoop';
update public.question_overrides set answer = 'ري سنتر', image = 'pic-loc-rai', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-yarmoukcoop';
update public.question_overrides set answer = 'سوق الوطية', image = 'pic-loc-watiya', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-qurtobacoop';
update public.question_overrides set answer = 'برج الجون', image = 'pic-loc-joantower', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-mansouriyacoop';
update public.question_overrides set answer = 'منتجع الجون', image = 'pic-loc-joanresort', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-fintascoop';
update public.question_overrides set answer = 'حديقة الصداقة والسلام', image = 'pic-loc-friendship', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-abuhalifacoop';
update public.question_overrides set answer = 'المتحف البحري', image = 'pic-loc-maritime', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-firdouscoop';
update public.question_overrides set answer = 'مجمّع سيمفوني ستايل', image = 'pic-loc-symphony', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-ardiyacoop';
update public.question_overrides set answer = 'فندق كورت يارد ماريوت', image = 'pic-loc-courtyard', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-sabahnasercoop';
update public.question_overrides set answer = 'كلية الكويت التقنية', image = 'pic-loc-kct', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-sulaibikhatcoop';
update public.question_overrides set answer = 'نادي الصليبيخات الرياضي', image = 'pic-loc-sulaibikhatclub', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-dohacoop';
update public.question_overrides set answer = 'مركز الكويت لمكافحة السرطان', image = 'pic-loc-cancer', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-nahdhacoop';
update public.question_overrides set answer = 'ذا قيت مول', image = 'pic-loc-gatemall', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-khaitancoop';
update public.question_overrides set answer = 'الخيران مول', image = 'pic-loc-khiranmall', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-omariyacoop';
update public.question_overrides set answer = 'النادي العلمي الكويتي', image = 'pic-loc-scienceclub', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-rabiyacoop';
update public.question_overrides set answer = 'السلام مول', image = 'pic-loc-salammall', updated_at = now()
 where category = 'لوكيشن' and level = 'تعجيزي' and image = 'pic-loc-hattincoop';
