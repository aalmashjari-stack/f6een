-- إصلاح تدقيق ٩ أكتوبر ٢٠٢٦ (طلب علي ١١ أكتوبر: «حلّ جميع المشاكل ماعدا أسهل من مستواه»).
-- كلّ سطرٍ مشروطٌ بأنّ السؤال لم يتغيّر منذ نسخة ٦ أكتوبر التي دُقّقت — ما عدّله علي بعدها لا يُمسّ.
-- المستوى والفئة لا يُكتبان إلّا حين يغيّرهما الإصلاح نفسه، فلا يُمحى نزولٌ طبّقه علي من اللسان.

-- ── ١. الحجب ──
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6155', 'disabled', 'تدقيق 9 أكتوبر: زرّ أحمر واحد ظاهر، فالإجابة تُعدّ من الصورة', now()
  from public.question_overrides o where o.question_id = 'ADM6155' and o.question = 'كم زرّاً في يد التحكّم هذه؟' and o.answer = 'زرّ واحد'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5489', 'disabled', 'تدقيق 9 أكتوبر: Checked the image. It is just a red crescent on white, and the answer names exactly what is shown, so anyone in the room gets it at a glance. Block it.', now()
  from public.question_overrides o where o.question_id = 'ADM5489' and o.question = 'شعار مَن هذا؟' and o.answer = 'الهلال الأحمر'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5520', 'disabled', 'تدقيق 9 أكتوبر: Checked the image. It is a plain red cross and the answer is "the Red Cross", which only describes the picture. Trivial, so block it.', now()
  from public.question_overrides o where o.question_id = 'ADM5520' and o.question = 'شعار مَن هذا؟' and o.answer = 'الصليب الأحمر'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5537', 'disabled', 'تدقيق 9 أكتوبر: دفّة سفينة على سباعيّ أزرق، واسم تقنيّ لا يعرفه أحد في المجلس، فيُحجب. لكنّ رياكت وأنغولار وغيت ورست في الخليّة نفسها تحمل العلّة ذاتها، فينبغي الحكم عليها معاً.', now()
  from public.question_overrides o where o.question_id = 'ADM5537' and o.question = 'شعار أيّ نظامٍ لإدارة الحاويات البرمجيّة هذا؟' and o.answer = 'كوبرنيتس'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5535', 'disabled', 'تدقيق 9 أكتوبر: حرف V بالأخضر والكحليّ، وإطار برمجيّ مجهول خارج دائرة المبرمجين، فيُحجب. وتنطبق الملاحظة نفسها على بقيّة أسئلة البرمجة في الخليّة.', now()
  from public.question_overrides o where o.question_id = 'ADM5535' and o.question = 'شعار أيّ إطار عملٍ لواجهات الويب هذا؟' and o.answer = 'فيو'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5544', 'disabled', 'تدقيق 9 أكتوبر: سهم دائريّ حول نقطة حمراء، واسم لا يعرفه حتّى المهووس بالشعارات، فيُحجب.', now()
  from public.question_overrides o where o.question_id = 'ADM5544' and o.question = 'شعار أيّ مستودعٍ للصور الحرّة هذا؟' and o.answer = 'ويكيميديا كومنز'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8520', 'disabled', 'تدقيق 9 أكتوبر: I compared it with pic-loc-kipco.jpg. Both maps show the same corner of Khalid Ibn Al Waleed and Al-Shuhada streets, with the pin on the same building and the same surrounding labels (PISCES, Hilali Fire Station, Al-Asima Mall). The two cannot be told apart, and the answer of one is ', now()
  from public.question_overrides o where o.question_id = 'ADM8520' and o.question = 'ما هذا المكان؟' and o.answer = 'برج الشهيد'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM7230', 'disabled', 'تدقيق 9 أكتوبر: وجه لا يعرفه أحد في المجلس، واسمها نفسه مجهول للأغلب', now()
  from public.question_overrides o where o.question_id = 'ADM7230' and o.question = 'من صاحب الصورة؟' and o.answer = 'آني إرنو'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM7228', 'disabled', 'تدقيق 9 أكتوبر: اسم مجهول في الغرفة ووجه عاديّ بلا أيّ قرينة', now()
  from public.question_overrides o where o.question_id = 'ADM7228' and o.question = 'من صاحب الصورة؟' and o.answer = 'أندي جاسي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1022', 'disabled', 'تدقيق 9 أكتوبر: برج إيفل بنظرة، مثل برج خليفة بالضبط. بعد الحجوبات الثلاثة تبقى خليّة سهل 11 سؤالاً', now()
  from public.question_overrides o where o.question_id = 'ADM1022' and o.question = 'ما هذا المعلم؟' and o.answer = 'برج إيفل، فرنسا'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1020', 'disabled', 'تدقيق 9 أكتوبر: الهرم وأبو الهول معاً في الصورة، فهي تافهة', now()
  from public.question_overrides o where o.question_id = 'ADM1020' and o.question = 'ما هذا المعلم؟' and o.answer = 'أهرامات الجيزة، مصر'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1029', 'disabled', 'تدقيق 9 أكتوبر: برج التحرير في المجلس الكويتيّ يُعرف بنظرة رغم أنّه بعيد في الصورة، والسؤال يقول «الكويتي»', now()
  from public.question_overrides o where o.question_id = 'ADM1029' and o.question = 'ما هذا المعلم الكويتي؟' and o.answer = 'برج التحرير، الكويت'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6303', 'disabled', 'تدقيق 9 أكتوبر: The LV monogram repeats across the whole image and is the brand''s own initials. Everyone in the room knows it at a glance.', now()
  from public.question_overrides o where o.question_id = 'ADM6303' and o.question = 'أيّ دارٍ هذه نقشتها؟' and o.answer = 'لويس فيتون'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6365', 'disabled', 'تدقيق 9 أكتوبر: الحقيبة نفسها في ADM8144 (صعب)، وقفل تريومف شعار سيلين نفسه، والاسم محفور عليه؛ سؤال «أيّ دار» في تعجيزي مكشوف', now()
  from public.question_overrides o where o.question_id = 'ADM6365' and o.question = 'من أيّ دارٍ هذه الحقيبة؟' and o.answer = 'سيلين'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM3278', 'disabled', 'تدقيق 9 أكتوبر: يكرّر صورة ADM3314 وموضوعه، ولا صورة نبيٍّ أخرى حرّة غير مستعملة؛ يبقى ADM3314', now()
  from public.question_overrides o where o.question_id = 'ADM3278' and o.question = 'ما اسم هذا المسجد العراقيّ الذي يُنسب إلى نبيٍّ التقمه الحوت ودُمّر سنة 2014؟' and o.answer = 'مسجد النبيّ يونس'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5320', 'disabled', 'تدقيق 9 أكتوبر: Block: an obscure person''s name that is unanswerable.', now()
  from public.question_overrides o where o.question_id = 'ADM5320' and o.question = 'من ألقى أوّل خطبة جمعة في المسجد الأقصى بعد أن حرّره صلاح الدين؟' and o.answer = 'محيي الدين بن الزكي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1653', 'disabled', 'تدقيق 9 أكتوبر: رقم تقريبيّ بلا سبيل، ومكرّر الموضوع مع ADM1652', now()
  from public.question_overrides o where o.question_id = 'ADM1653' and o.question = 'كم سنةً تقريباً يتدرّب الطاهي في اليابان قبل أن يُرخَّص له بإعداد السمكة السامّة المنتفخة؟' and o.answer = 'ثلاث سنوات تقريباً (2–3)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM9476', 'disabled', 'تدقيق 9 أكتوبر: شعر البنات يعرفه كلّ حاضر بلا تفكير', now()
  from public.question_overrides o where o.question_id = 'ADM9476' and o.question = 'ما اسم الحلوى القطنيّة الورديّة المنفوشة التي نشتريها في مدينة الملاهي؟' and o.answer = 'شعر البنات'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6159', 'disabled', 'تدقيق 9 أكتوبر: «كي دي دي» التي «لا تخلو منها ثلاجة» يعرفها كلّ كويتيّ فوراً', now()
  from public.question_overrides o where o.question_id = 'ADM6159' and o.question = 'ما اسم شركة الألبان والعصائر الكويتيّة التي لا تخلو منها ثلاجة؟' and o.answer = 'كي دي دي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6247', 'disabled', 'تدقيق 9 أكتوبر: رقم دقيق مختلَف عليه', now()
  from public.question_overrides o where o.question_id = 'ADM6247' and o.question = 'كم كوكباً خصّصت «سبيستون» لبرامجها في بداياتها قبل أن تُحذف بعضها؟' and o.answer = '10 (عشرة)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM9521', 'disabled', 'تدقيق 9 أكتوبر: Trivial: everyone present knows it.', now()
  from public.question_overrides o where o.question_id = 'ADM9521' and o.question = 'ما عاصمة الولايات المتحدة الأمريكيّة؟' and o.answer = 'واشنطن العاصمة'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1434', 'disabled', 'تدقيق 9 أكتوبر (تحقّق 11 أكتوبر): حُجب: M312 حيّ يسأل عن أوّل حاسوب إلكترونيّ ضخم بجواب «إينياك» — تكرار الواقعة. وخليّة علوم/تعجيزي تنزل إلى 29 بالحجب أو بالنقل كليهما', now()
  from public.question_overrides o where o.question_id = 'ADM1434' and o.question = 'كم طنّاً كان يزن حاسوب إنياك؟' and o.answer = 'سبعة وعشرون'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1445', 'disabled', 'تدقيق 9 أكتوبر: عدٌّ دقيق لا سبيل إلى معرفته، فهو مستحيل لا تعجيزي.', now()
  from public.question_overrides o where o.question_id = 'ADM1445' and o.question = 'كم عنصراً في الجدول الدوريّ سُمّي على اسم عالمٍ حيٍّ وقت التسمية؟' and o.answer = 'اثنان'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1259', 'disabled', 'تدقيق 9 أكتوبر: عدد حلقات دقيق بلا سبيل — مستحيل لا صعب', now()
  from public.question_overrides o where o.question_id = 'ADM1259' and o.question = 'كم حلقةً بُثّت من «غريندايزر» في نسخته اليابانيّة؟' and o.answer = '74'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6468', 'disabled', 'تدقيق 9 أكتوبر: الواقعة نفسها في ADM0741 (الدفّ/الطار) بالوصف نفسه (دائريّة إيقاعيّة)؛ ووضعها في تعجيزي خطأ أصلاً. الحجب صحيح.', now()
  from public.question_overrides o where o.question_id = 'ADM6468' and o.question = 'ما الآلة الإيقاعيّة الدائريّة التي تصاحب فرق الأعراس النسائيّة (الطقّاقات) في الكويت؟' and o.answer = 'الطار'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM0720', 'disabled', 'تدقيق 9 أكتوبر: «فنان العرب» يعرفه كلّ حاضر في مجلس كويتيّ بلا تفكير', now()
  from public.question_overrides o where o.question_id = 'ADM0720' and o.question = 'بأيّ لقب اشتُهر الفنان السعودي محمد عبده؟' and o.answer = 'فنان العرب'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM7273', 'disabled', 'تدقيق 9 أكتوبر: «نور العين» وعمرو دياب يعرفها الجميع بلا تفكير', now()
  from public.question_overrides o where o.question_id = 'ADM7273' and o.question = 'من غنّى «حبيبي يا نور العين»؟' and o.answer = 'عمرو دياب'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM0794', 'disabled', 'تدقيق 9 أكتوبر: الطبلة بديهيّة يعرفها الجميع', now()
  from public.question_overrides o where o.question_id = 'ADM0794' and o.question = 'ما اسم أشهر آلة إيقاعية فخّارية مخروطية في الطرب العربي؟' and o.answer = 'الطبلة'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'M393', 'disabled', 'تدقيق 9 أكتوبر: النهّام بالوصف نفسه تقريباً في ADM0750؛ والتكرار العابر للتصنيفات هو الأخطر لأنّه يظهر في جلسة واحدة.', now()
  from public.question_overrides o where o.question_id = 'M393' and o.question = 'ماذا يُسمّى المغني الذي يحمّس البحارة على سفن الغوص؟' and o.answer = 'النهّام'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6266', 'disabled', 'تدقيق 9 أكتوبر: تاريخ العيد الوطنيّ يعرفه كلّ كويتيّ بلا تفكير', now()
  from public.question_overrides o where o.question_id = 'ADM6266' and o.question = 'في أيّ يومٍ من السنة يُحتفل بالعيد الوطنيّ للكويت؟' and o.answer = '25 فبراير'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM7371', 'disabled', 'تدقيق 9 أكتوبر: تاريخ عيد التحرير يعرفه كلّ كويتيّ بلا تفكير', now()
  from public.question_overrides o where o.question_id = 'ADM7371' and o.question = 'ما تاريخ عيد التحرير في الكويت؟' and o.answer = '26 فبراير'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM7374', 'disabled', 'تدقيق 9 أكتوبر: البشت مثل الدشداشة التي حذفها علي: يعرفه كلّ حاضر في مجلس كويتيّ بلا تفكير.', now()
  from public.question_overrides o where o.question_id = 'ADM7374' and o.question = 'ما اسم العباءة الرجاليّة التي تُلبس فوق الدشداشة في المناسبات؟' and o.answer = 'البشت'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1383', 'disabled', 'تدقيق 9 أكتوبر (تحقّق 11 أكتوبر): لا لقب واحد ثابت: المصادر تقول «عملاق الكوميديا» (الجريدة) و«عملاق الدراما الخليجيّة» و«كوميديان الخليج» (مصراوي) و«صانع البهجة» (عربي بوست)، ولم أجد «عملاق الفنّ الخليجي» ولا «فنّان الخليج» لقباً. https://www.aljarida.com/article/6984 — الحجب يُنزل الكويت/تعجيزي إل', now()
  from public.question_overrides o where o.question_id = 'ADM1383' and o.question = 'بأيّ لقبٍ عُرف الفنّان الكويتيّ عبدالحسين عبدالرضا؟' and o.answer = 'فنّان الخليج (عملاق الفنّ الخليجي)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'M276', 'disabled', 'تدقيق 9 أكتوبر: قالب خروج المغلوب نفسه في M704 بالخليّة ذاتها؛ يُحجب أحدهما', now()
  from public.question_overrides o where o.question_id = 'M276' and o.question = 'بطولة خروج المغلوب فيها 32 فريقًا، كم دورًا حتى النهائي؟' and o.answer = 'خمسة أدوار'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM3269', 'disabled', 'تدقيق 9 أكتوبر: فرعون يُجاب بلا تفكير', now()
  from public.question_overrides o where o.question_id = 'ADM3269' and o.question = 'من الطاغية الذي ادّعى الربوبيّة وأغرقه الله في اليمّ؟' and o.answer = 'فرعون'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM3324', 'disabled', 'تدقيق 9 أكتوبر: اسمٌ خلافيّ من بعض المفسّرين: مستحيل لا تعجيزي', now()
  from public.question_overrides o where o.question_id = 'ADM3324' and o.question = 'ما اسم النبيّ الذي أُرسل إلى أصحاب الرسّ على قول بعض المفسّرين؟' and o.answer = 'حنظلة بن صفوان'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6474', 'disabled', 'تدقيق 9 أكتوبر: لوس سانتوس مذكورة نصّاً في ADM2526', now()
  from public.question_overrides o where o.question_id = 'ADM6474' and o.question = 'ما اسم المدينة الخياليّة التي تدور فيها أحداث «جي تي إيه 5»؟' and o.answer = 'لوس سانتوس'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2988', 'disabled', 'تدقيق 9 أكتوبر: الإجابة «البحث عن دوري» تنكشف من سؤال ADM2708 بالوصف نفسه؛ الحجب أنظف من النزول', now()
  from public.question_overrides o where o.question_id = 'ADM2988' and o.question = 'ما اسم فيلم بيكسار عن سمكةٍ زرقاء كثيرة النسيان تبحث عن أبويها؟' and o.answer = 'البحث عن دوري'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1141', 'disabled', 'تدقيق 9 أكتوبر: حجب: برج العرب للخليجيّ بمستوى الأفنيوز', now()
  from public.question_overrides o where o.question_id = 'ADM1141' and o.question = 'ما اسم الفندق الذي يشبه الشراع في دبي؟' and o.answer = 'برج العرب'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM1627', 'disabled', 'تدقيق 9 أكتوبر: رقم تقريبيّ لا سبيل إليه — يُحجب', now()
  from public.question_overrides o where o.question_id = 'ADM1627' and o.question = 'كم قطعةً تتكوّن منها السيّارة الحديثة تقريباً؟' and o.answer = 'ثلاثون ألفاً'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8213', 'disabled', 'تدقيق 9 أكتوبر: السؤال بديهيّ، وعبارة «الحيّ القاهريّ» في ADM8205 تكشف جوابه.', now()
  from public.question_overrides o where o.question_id = 'ADM8213' and o.question = 'في أيّ مدينةٍ يقع حيّ السبتية الذي تدور فيه الأحداث؟' and o.answer = 'القاهرة'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8273', 'disabled', 'تدقيق 9 أكتوبر: سؤال ADM8258 يذكر نصّاً «حين خنقها ناصر»', now()
  from public.question_overrides o where o.question_id = 'ADM8273' and o.question = 'بأيّ طريقةٍ قتل ناصر زوجته شهد؟' and o.answer = 'خنقاً'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8309', 'disabled', 'تدقيق 9 أكتوبر: مبلغٌ دقيق لا سبيل إليه', now()
  from public.question_overrides o where o.question_id = 'ADM8309' and o.question = 'كم أعطى ناصر حنان لتفتح حساباً لها ولبناتها؟' and o.answer = '450 ألف جنيه'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8307', 'disabled', 'تدقيق 9 أكتوبر: مبلغٌ دقيق لا سبيل إليه', now()
  from public.question_overrides o where o.question_id = 'ADM8307' and o.question = 'كم ضيّع طارق من مال ناصر بعد أن نصب عليه أحدهم؟' and o.answer = '15 مليون جنيه'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'PA120', 'disabled', 'تدقيق 9 أكتوبر: لغز الكرة الأثقل بالوزنتين نفسه في H381، وجواب PA120 خطوات طويلة يصعب على الحكم تقييمها.', now()
  from public.question_overrides o where o.question_id = 'PA120' and o.question = 'لديك ثماني كرات متشابهة وواحدة منها أثقل. كيف تحددها بوزنتين فقط بميزان كفتين؟' and o.answer = 'زن ثلاثًا مقابل ثلاث؛ إن تساوتا فالثقيلة بين الباقيتين، وإلا ففي الكفة الأثقل. ثم زن كرة مقابل كرة من المجموعة المشتبه بها'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'PA156', 'disabled', 'تدقيق 9 أكتوبر: ليس مجرّد تطابق في الجواب: الوصف نفسه (أخضر من الخارج، وبذور سود، ويُفتح بالحديد)، فمن رأى أحدهما يجيب عن الآخر فوراً. وهو في «صعب» أسهل من مستواه.', now()
  from public.question_overrides o where o.question_id = 'PA156' and o.question = 'قبة خضرا متروسة عبيد، القفل قفل الله والمفتاح حديد؛ ما هي؟' and o.answer = 'الرقي «البطيخ»'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM3986', 'disabled', 'تدقيق 9 أكتوبر: الجواب هو اسم الفئة نفسه، فيُحجب.', now()
  from public.question_overrides o where o.question_id = 'ADM3986' and o.question = 'أيّ فنّ يُلقّب بـ«الفن السابع»؟' and o.answer = 'السينما'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'M704', 'disabled', 'تدقيق 9 أكتوبر: M704 (16 فريقاً) وM276 (32 فريقاً) سؤالٌ واحد هو حساب log2؛ يكفي في الخليّة واحدٌ منهما.', now()
  from public.question_overrides o where o.question_id = 'M704' and o.question = 'كم عدد الأدوار في بطولة تضم ستة عشر فريقاً بنظام خروج المغلوب؟' and o.answer = 'أربعة أدوار'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2058', 'disabled', 'تدقيق 9 أكتوبر: ADM3261 يقول «ابنَ إبراهيم حين همّ بذبحه» فيكشف الجواب كاملاً، والسؤال سهل جداً على مستوى متوسط.', now()
  from public.question_overrides o where o.question_id = 'ADM2058' and o.question = 'من النبيّ الذي أمره الله بذبح ابنه ففداه الله بذبحٍ عظيم؟' and o.answer = 'إبراهيم عليه السلام'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2071', 'disabled', 'تدقيق 9 أكتوبر: الواقعة نفسها في ADM2044 (التمكين في الأرض) والجواب يوسف، وهي كثيرة في الخليّة.', now()
  from public.question_overrides o where o.question_id = 'ADM2071' and o.question = 'من النبيّ الذي جعله ملك مصر على خزائن الأرض؟' and o.answer = 'يوسف عليه السلام'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2073', 'disabled', 'تدقيق 9 أكتوبر: ADM2093 يذكر بصر يعقوب وقميص يوسف معاً؛ والسؤال بديهيّ تقريباً.', now()
  from public.question_overrides o where o.question_id = 'ADM2073' and o.question = 'من والد يوسف عليه السلام؟' and o.answer = 'يعقوب عليه السلام'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2730', 'disabled', 'تدقيق 9 أكتوبر: ADM2739 يذكر اسم الفيلم صراحةً.', now()
  from public.question_overrides o where o.question_id = 'ADM2730' and o.question = 'رالف شريرُ لعبة أركيد يحاول أن يصير بطلاً — ما اسم الفيلم؟' and o.answer = 'رالف المدمّر (Wreck-It Ralph)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2707', 'disabled', 'تدقيق 9 أكتوبر: «الخارقين» مكتوبة في سؤال إدنا مود', now()
  from public.question_overrides o where o.question_id = 'ADM2707' and o.question = 'ما اسم العائلة بطلة فيلم بيكسار 2004 عن أبٍ وأمٍّ وأطفالٍ بقدراتٍ فوق طبيعيّة يعيشون متخفّين؟' and o.answer = 'عائلة الخارقين (The Incredibles)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2693', 'disabled', 'تدقيق 9 أكتوبر: «قلباً وقالباً» مكتوبة في أسئلة رايلي وبينغ بونغ ولون الحزن', now()
  from public.question_overrides o where o.question_id = 'ADM2693' and o.question = 'ما اسم الفيلم الذي تظهر فيه المشاعر — الفرح والحزن والغضب — كشخصيّاتٍ في رأس فتاة؟' and o.answer = 'قلباً وقالباً (Inside Out)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2694', 'disabled', 'تدقيق 9 أكتوبر: «راتاتوي» مكتوبة في أسئلة ريمي وغوستو وإيغو', now()
  from public.question_overrides o where o.question_id = 'ADM2694' and o.question = 'ما اسم فيلم بيكسار الذي يحاول فيه فأرٌ أن يصير طاهياً في باريس؟' and o.answer = 'راتاتوي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2696', 'disabled', 'تدقيق 9 أكتوبر: «فوق» مكتوبة في أسئلة راسل وداغ وكيفن', now()
  from public.question_overrides o where o.question_id = 'ADM2696' and o.question = 'عجوزٌ يرفع بيته بآلاف البالونات ليطير إلى أمريكا الجنوبيّة — ما اسم فيلم بيكسار؟' and o.answer = 'فوق (Up)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2706', 'disabled', 'تدقيق 9 أكتوبر: «كوكو» مكتوبة في سؤالَي دي لا كروز ودانتي', now()
  from public.question_overrides o where o.question_id = 'ADM2706' and o.question = 'فتىً مكسيكيّ يزور عالم الموتى بحثاً عن جدّه الموسيقيّ — ما اسم الفيلم؟' and o.answer = 'كوكو'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2719', 'disabled', 'تدقيق 9 أكتوبر: «إنكانتو» مكتوبة في سؤالَي لويزا وبرونو', now()
  from public.question_overrides o where o.question_id = 'ADM2719' and o.question = 'ميرابيل تحاول إنقاذ سحر عائلتها في كولومبيا — ما اسم الفيلم؟' and o.answer = 'إنكانتو'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2731', 'disabled', 'تدقيق 9 أكتوبر: «لوكا» مكتوبة في سؤال ألبرتو', now()
  from public.question_overrides o where o.question_id = 'ADM2731' and o.question = 'وحشُ بحرٍ صغيرٌ يصادق فتىً على الساحل الإيطاليّ — ما اسم فيلم بيكسار؟' and o.answer = 'لوكا'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2715', 'disabled', 'تدقيق 9 أكتوبر: «سول» مكتوبة في سؤال الروح 22', now()
  from public.question_overrides o where o.question_id = 'ADM2715' and o.question = 'عازف جاز يسقط في «ما قبل الحياة» ويحاول العودة إلى جسده — ما اسم فيلم بيكسار؟' and o.answer = 'سول (Soul)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2692', 'disabled', 'تدقيق 9 أكتوبر: سؤال فيلم «لايتيير» يذكر «لعبة باز» في «حكاية لعبة»', now()
  from public.question_overrides o where o.question_id = 'ADM2692' and o.question = 'رائد الفضاء اللعبة الذي يظنّ نفسه حقيقيّاً في «حكاية لعبة» — ما اسمه؟' and o.answer = 'باز لايتيير (باز يطير)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2697', 'disabled', 'تدقيق 9 أكتوبر: «ماكوين» مكتوب في أسئلة ماتر وسالي وراديتور سبرينغز', now()
  from public.question_overrides o where o.question_id = 'ADM2697' and o.question = 'سيّارة السباق الحمراء بطلة فيلم «سيّارات» — ما اسمها؟' and o.answer = 'لايتنينغ ماكوين'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2699', 'disabled', 'تدقيق 9 أكتوبر: «رابونزل» مكتوبة في أسئلة فلين رايدر وماكسيموس وباسكال', now()
  from public.question_overrides o where o.question_id = 'ADM2699' and o.question = 'ما اسم الفتاة الأميرة ذات الشعر الطويل جدّاً المحبوسة في برج؟' and o.answer = 'رابونزل'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2685', 'disabled', 'تدقيق 9 أكتوبر: «آريل» مكتوبة في سؤال فلاوندر', now()
  from public.question_overrides o where o.question_id = 'ADM2685' and o.question = 'ما اسم حوريّة البحر ذات الشعر الأحمر في فيلم ديزني؟' and o.answer = 'آريل'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2941', 'disabled', 'تدقيق 9 أكتوبر: «الأميرة ياسمين» مكتوبة في سؤال النمر رجا', now()
  from public.question_overrides o where o.question_id = 'ADM2941' and o.question = 'ما اسم الأميرة التي أحبّها علاء الدين؟' and o.answer = 'ياسمين'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2701', 'disabled', 'تدقيق 9 أكتوبر: «مولان» مكتوبة في سؤال التنّين موشو', now()
  from public.question_overrides o where o.question_id = 'ADM2701' and o.question = 'ما اسم الفتاة الصينيّة التي تنكّرت في زيّ رجلٍ لتحلّ محلّ أبيها في الجيش؟' and o.answer = 'مولان'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2700', 'disabled', 'تدقيق 9 أكتوبر: «موانا» مكتوبة في أسئلة ماوي وتاماتوا وهاي هاي وميراندا', now()
  from public.question_overrides o where o.question_id = 'ADM2700' and o.question = 'ما اسم الأميرة الرحّالة البولينيزيّة التي تبحر مع نصف الإله ماوي؟' and o.answer = 'موانا'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM9538', 'disabled', 'تدقيق 9 أكتوبر: تنبيه: حجب ثلاثة عشر سؤالاً «سهلاً» من ديزني (2684 و2685 و2687 و2691 و2692 و2693 و2694 و2696 و2697 و2699 و2941 و9538 و9539) يُنزل الخليّة من 30 إلى 17. هذا تحت حدّ الثلاثين، وتحت حدّ العشرين في bank.test أيضاً، فيلزم بدائل قبل التطبيق.', now()
  from public.question_overrides o where o.question_id = 'ADM9538' and o.question = 'ما اسم الشبل بطل «الأسد الملك» الذي يهرب من مملكته بعد موت أبيه؟' and o.answer = 'سيمبا'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM9539', 'disabled', 'تدقيق 9 أكتوبر: «إلسا» مكتوبة في سؤال آنا', now()
  from public.question_overrides o where o.question_id = 'ADM9539' and o.question = 'في «فروزن»، ما اسم الملكة التي تُطلق الجليد من يديها؟' and o.answer = 'إلسا'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2687', 'disabled', 'تدقيق 9 أكتوبر: «بيل» مكتوبة في سؤال غاستون', now()
  from public.question_overrides o where o.question_id = 'ADM2687' and o.question = 'فتاةٌ حلّت محلّ أبيها أسيرةً عند الوحش ثمّ أحبّته — ما اسمها؟' and o.answer = 'بيل (الجميلة)'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2709', 'disabled', 'تدقيق 9 أكتوبر: «آندي» مكتوب في سؤال سيد', now()
  from public.question_overrides o where o.question_id = 'ADM2709' and o.question = 'الفتى صاحب الألعاب في «حكاية لعبة» — ما اسمه؟' and o.answer = 'آندي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2735', 'disabled', 'تدقيق 9 أكتوبر: «رايلي» مكتوبة في سؤال بينغ بونغ', now()
  from public.question_overrides o where o.question_id = 'ADM2735' and o.question = 'في «قلباً وقالباً»، ما اسم الفتاة التي تدور المشاعر في رأسها؟' and o.answer = 'رايلي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2958', 'disabled', 'تدقيق 9 أكتوبر: «الملك موفاسا» مكتوب في سؤال زازو', now()
  from public.question_overrides o where o.question_id = 'ADM2958' and o.question = 'ما اسم والد سيمبا الذي مات في تدافع الحيوانات؟' and o.answer = 'موفاسا'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2968', 'disabled', 'تدقيق 9 أكتوبر: «فلين رايدر» مكتوب في سؤال الحصان ماكسيموس', now()
  from public.question_overrides o where o.question_id = 'ADM2968' and o.question = 'ما اسم اللصّ الوسيم الذي تسلّق برج رابونزل؟' and o.answer = 'فلين رايدر'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2684', 'disabled', 'تدقيق 9 أكتوبر: «بيتر بان» مكتوب في سؤالَي الكابتن هوك وتينكر بيل', now()
  from public.question_overrides o where o.question_id = 'ADM2684' and o.question = 'ما اسم الفتى الذي يرفض أن يكبر ويعيش في «أرض الأحلام» (نيفرلاند)؟' and o.answer = 'بيتر بان'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM2691', 'disabled', 'تدقيق 9 أكتوبر: «وودي» مكتوب في أسئلة بو بيب وتوم هانكس وبولزآي', now()
  from public.question_overrides o where o.question_id = 'ADM2691' and o.question = 'في «حكاية لعبة»، ما اسم راعي البقر اللعبة الذي يقود بقيّة الألعاب؟' and o.answer = 'وودي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'M095', 'disabled', 'تدقيق 9 أكتوبر: عدد آيات الفاتحة بديهيّ لكلّ حاضر', now()
  from public.question_overrides o where o.question_id = 'M095' and o.question = 'كم عدد آيات سورة الفاتحة؟' and o.answer = 'سبع آيات'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM9440', 'disabled', 'تدقيق 9 أكتوبر: الإنجيل لعيسى بديهيّ', now()
  from public.question_overrides o where o.question_id = 'ADM9440' and o.question = 'ما الكتاب السماويّ الذي أُنزل على عيسى عليه السلام؟' and o.answer = 'الإنجيل'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM9442', 'disabled', 'تدقيق 9 أكتوبر: محرّم أوّل الشهور يعرفه الجميع', now()
  from public.question_overrides o where o.question_id = 'ADM9442' and o.question = 'ما أوّل شهرٍ في السنة الهجريّة؟' and o.answer = 'محرّم'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6016', 'disabled', 'تدقيق 9 أكتوبر: «ابن والتر» يكشف «والتر جونيور»، وADM6967 يذكره بالاسم، والبديل (فلين) مكرّر في ADM6073؛ الخليّة تبقى 30', now()
  from public.question_overrides o where o.question_id = 'ADM6016' and o.question = 'ما اسم ابن والتر الذي يمشي بعكّازين؟' and o.answer = 'والتر جونيور'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6043', 'disabled', 'تدقيق 9 أكتوبر: جيسي هو البطل الثاني ومكشوف في ADM6042 وADM6039؛ الحجب سليم.', now()
  from public.question_overrides o where o.question_id = 'ADM6043' and o.question = 'ما اسم الشابّ الذي قتل غيل وأُجبر على العمل للنازيين؟' and o.answer = 'جيسي بينكمان'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6040', 'disabled', 'تدقيق 9 أكتوبر: الواقعة نفسها في ADM6489 وجوابها مذكور في ADM6058، وجواب ADM6026 مغسلة سيّارات أيضاً؛ الحجب سليم.', now()
  from public.question_overrides o where o.question_id = 'ADM6040' and o.question = 'ما اسم الشركة التي استخدمها والتر لتبييض المال؟' and o.answer = 'مغسلة سيارات'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM0605', 'disabled', 'تدقيق 9 أكتوبر: الجواب اختصار اسم البطولة الإنجليزيّ نفسه؛ الحجب سليم.', now()
  from public.question_overrides o where o.question_id = 'ADM0605' and o.question = 'ما الاختصار الإنجليزيّ الشائع لبطولة العالم للراليات؟' and o.answer = 'WRC'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5935', 'disabled', 'تدقيق 9 أكتوبر: الاسم «لينكولن» في أكثر من عشرة أسئلة من الخليّة (5946، 5948، 7086، 5959...)، فإعادة الصياغة لا تنفع. الحجب هو الحلّ.', now()
  from public.question_overrides o where o.question_id = 'ADM5935' and o.question = 'ما اسم شقيق مايكل سكوفيلد الذي دخل السجن لإنقاذه من الإعدام؟' and o.answer = 'لينكولن بوروز'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM5974', 'disabled', 'تدقيق 9 أكتوبر: جواب ADM5971 نفسه هو «حاكم ولاية إلينوي»، ولا يمكن تعديله دون إفساده. الحجب أنظف.', now()
  from public.question_overrides o where o.question_id = 'ADM5974' and o.question = 'في أيّ ولاية أمريكية يقع سجن فوكس ريفر؟' and o.answer = 'إلينوي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8208', 'disabled', 'تدقيق 9 أكتوبر: أوافق على أنّ الجواب مكشوف، لكنّ الحجب أنسب من إعادة الصياغة.', now()
  from public.question_overrides o where o.question_id = 'ADM8208' and o.question = 'ما اسم أمّ ناصر ورفاعي كما تناديها الحارة؟' and o.answer = 'الحاجة توحة'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8221', 'disabled', 'تدقيق 9 أكتوبر: عبارتا «بدلة الإعدام» في ADM8242 و«قبل الحكم بإعدامه» في ADM8226 تكشفان الإجابة.', now()
  from public.question_overrides o where o.question_id = 'ADM8221' and o.question = 'ما الحكم الذي انتهى إليه ناصر في آخر حلقة؟' and o.answer = 'الإعدام'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM8317', 'disabled', 'تدقيق 9 أكتوبر: الواقعة نفسها في ADM8301، وجوابه يكشف العملة.', now()
  from public.question_overrides o where o.question_id = 'ADM8317' and o.question = 'بأيّ عملةٍ طلب بدر نصف أرباح مصنع ناصر؟' and o.answer = 'الدولار'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();
insert into public.question_flags (question_id, status, note, reviewed_at)
select 'ADM6911', 'disabled', 'تدقيق 9 أكتوبر: الشعار هو الحرفان L وG نفساهما، فالاسم ظاهر في الصورة، والماركة في كلّ بيت. سهل أقلّ ما يقال، وقد يستحقّ الحجب.', now()
  from public.question_overrides o where o.question_id = 'ADM6911' and o.question = 'شعار مَن هذا؟' and o.answer = 'إل جي'
on conflict (question_id) do update set status = 'disabled', note = excluded.note, reviewed_at = now();

-- ── ٢. رفع المستوى ──
update public.question_overrides set level = 'صعب'
 where question_id = 'X044' and level = 'متوسط' and question = 'من صاحب الصورة؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'X133' and level = 'متوسط' and question = 'من صاحب الصورة؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'X134' and level = 'متوسط' and question = 'من صاحب الصورة؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM9504' and level = 'سهل' and question = 'ما اسم الخطّ الدفاعي الإسرائيلي على الضفّة الشرقية لقناة السويس الذي عبره الجيش المصري في حرب 1973؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM9507' and level = 'سهل' and question = 'من الزعيم الألماني الملقّب «المستشار الحديدي» الذي وحّد ألمانيا في القرن التاسع عشر؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'E344' and level = 'سهل' and question = 'من الملكة الفرعونية التي حكمت مصر وصوّرتها التماثيل بلحية مستعارة؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM0046' and level = 'سهل' and question = 'ما الطبق الليبي المصنوع من كرات عجين تُقدّم مع مرق ولحم؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM0042' and level = 'سهل' and question = 'ما طبق العجين الجزائري المقطّع إلى رقائق ويُسقى بمرق أحمر؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM0060' and level = 'سهل' and question = 'ما الخبز اليمني الكبير الملتصق بجدار التنور؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'E258' and level = 'سهل' and question = 'ما أكبر جزيرة يمنية وتشتهر بشجرة دم الأخوين؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM7243' and level = 'سهل' and question = 'ما اسم صغير الضفدع حين يسبح بذيلٍ قبل أن تنبت أرجله؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM7244' and level = 'سهل' and question = 'ما الحشرة التي تضيء ليلاً بضوءٍ يخرج من بطنها؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM9414' and level = 'سهل' and question = 'ما اسم أوّل رائد فضاء إماراتيّ صعد إلى محطّة الفضاء الدوليّة؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'L011' and level = 'سهل' and question = 'من كتب رواية الأمير الصغير؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'M634' and level = 'متوسط' and question = 'من الأديب الفلسطيني مؤلف رواية «البحث عن وليد مسعود»؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'M727' and level = 'متوسط' and question = 'ما اسم الشاعر العباسي الملقّب بصريع الغواني؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'E087' and level = 'سهل' and question = 'كم يبلغ طول الأمعاء الدقيقة في الإنسان تقريباً؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM3184' and level = 'سهل' and question = 'من الصحابيّ الذي كان أوّل من سلّ سيفه في الإسلام؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM3194' and level = 'سهل' and question = 'أوّل من ركب البحر غازياً وفتح قبرص — أيّ صحابيٍّ هو؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'E251' and level = 'سهل' and question = 'ما اسم الجهاز الذي يقيس سرعة الرياح؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'M683' and level = 'متوسط' and question = 'من المهندس البريطانيّ الذي سجّل براءة اختراع المحرّك النفّاث سنة 1930؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'E246' and level = 'متوسط' and question = 'من الاسكتلنديّ الذي قدّم أوّل عرضٍ علنيّ للتلفاز في لندن سنة 1926؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM3517' and level = 'سهل' and question = 'كم سنةً كانت مدّة الهدنة في صلح الحديبية؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM2790' and level = 'سهل' and question = 'ما اسم الشركة الصينيّة المالكة لتطبيق «تيك توك»؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM2796' and level = 'سهل' and question = 'ما اسم الشركة الأمّ التي تملك جوجل منذ 2015؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'M711' and level = 'سهل' and question = 'ما اسم أشهر منصّة لتخزين الشيفرة البرمجية ومشاركتها؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'M312' and level = 'متوسط' and question = 'ما اسم أول حاسوب إلكتروني ضخم بُني عام 1946؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM3274' and level = 'سهل' and question = 'ما اسم المدينة العراقيّة التي أُرسل إليها يونس عليه السلام على المشهور؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM3291' and level = 'متوسط' and question = 'ما الخضار التي طلبها بنو إسرائيل في التيه بدل المنّ والسلوى؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM3131' and level = 'متوسط' and question = 'في «أوفرواتش»، ما اسم القرد العالم الذي جاء من القمر؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM2137' and level = 'متوسط' and question = 'إلى أيّ بلادٍ أرسلت حتشبسوت بعثتَها التجاريّة الشهيرة؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM2146' and level = 'متوسط' and question = 'ما اسم الإمبراطوريّة الفارسيّة التي أسّسها كورش الكبير؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM2147' and level = 'متوسط' and question = 'في أيّ عامٍ ميلاديّ سقطت الإمبراطوريّة الرومانيّة الغربيّة؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM2192' and level = 'متوسط' and question = 'في أيّ عامٍ عُثر على حجر رشيد أثناء الحملة الفرنسيّة على مصر؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM4050' and level = 'متوسط' and question = 'من الملك الذي يُعدّ أوّل فراعنة مصر وموحّدها؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM9583' and level = 'سهل' and question = 'ما اسم الجدار الذي قسم عاصمة ألمانيا حتى سقوطه سنة 1989؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM1164' and level = 'سهل' and question = 'ماذا يُسمّى الجزء المزخرف في أعلى العمود؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM7519' and level = 'سهل' and question = 'ما اسم الساحة الكبرى في البندقيّة المشهورة بالحمام وكنيستها؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM1755' and level = 'متوسط' and question = 'كم هدفاً سجّل محمد صلاح في موسمه الأوّل مع ليفربول 2017-2018؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM7126' and level = 'سهل' and question = 'أيّ نادٍ لندنيّ يلعب على ضفّة التيمز في ملعب «كرافن كوتيدج»؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM2769' and level = 'سهل' and question = 'ما اسم المباراة الافتتاحيّة للموسم بين بطل الدوري وبطل كأس الاتّحاد؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM0673' and level = 'متوسط' and question = 'من صمم سيارة ميني الأصلية التي ظهرت عام 1959؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM0677' and level = 'متوسط' and question = 'من مهندس فولفو الذي ابتكر حزام الأمان ثلاثي النقاط؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM0666' and level = 'متوسط' and question = 'ما اسم أول سيارة ركاب أنتجتها سوبارو بكميات كبيرة؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM0668' and level = 'متوسط' and question = 'أي طراز سبق بورشه 911 مباشرة في خط سيارات الشركة الرياضية؟';
update public.question_overrides set level = 'متوسط'
 where question_id = 'ADM5947' and level = 'سهل' and question = 'من الممثّل الذي أدّى لينكولن بوروز؟';
update public.question_overrides set level = 'صعب'
 where question_id = 'ADM5957' and level = 'متوسط' and question = 'ما الحالة النفسية التي تفسّر ذكاء مايكل وتعاطفه المفرط؟';

-- ── ٣. تعديل النصّ والإجابة (والمستوى أو الفئة حين يغيّرهما الإصلاح) ──
update public.question_overrides set question = 'علم أيّ دولة هذا؟', answer = 'إندونيسيا (أو موناكو)'
 where question_id = 'ADM5568' and question = 'علم أيّ دولة هذا؟' and answer = 'إندونيسيا';
update public.question_overrides set question = 'علم أيّ دولة هذا؟', answer = 'رومانيا (أو تشاد)'
 where question_id = 'ADM7206' and question = 'علم أيّ دولة هذا؟' and answer = 'رومانيا';
update public.question_overrides set question = 'ما اسم جهاز نينتندو المحمول هذا الذي لعبنا عليه بوكيمون الأصفر؟', answer = 'جيم بوي كولر'
 where question_id = 'ADM6179' and question = 'ما اسم هذا الجهاز الملوّن الذي لعبنا عليه بوكيمون الأصفر؟' and answer = 'جيم بوي كولر';
update public.question_overrides set question = 'من أيّ دار مجوهراتٍ هذا الخاتم؟', answer = 'شوميه (جوزفين)'
 where question_id = 'ADM7973' and question = 'من أيّ دار مجوهراتٍ هذا التاج؟' and answer = 'شوميه (جوزفين)';
update public.question_overrides set question = 'ما اسم حديقة ديزني هذه التي يتوسّطها بركانٌ اصطناعيّ؟', answer = 'طوكيو ديزني سي'
 where question_id = 'ADM2995' and question = 'ما اسم هذه الحديقة اليابانيّة البحريّة التي يتوسّطها بركانٌ اصطناعيّ؟' and answer = 'طوكيو ديزني سي';
update public.question_overrides set question = 'ما اسم هذا الملعب القطريّ الذي احتضن افتتاح مونديال 2022؟', answer = 'ملعب البيت'
 where question_id = 'ADM3698' and question = 'ما اسم هذا الملعب القطريّ المصمَّم على شكل بيت الشَّعر؟' and answer = 'ملعب البيت';
update public.question_overrides set question = 'ما اسم هذا الخطّ ذي الحروف المائلة المنسابة؟', answer = 'الفارسيّ (النستعليق أو التعليق)'
 where question_id = 'ADM3638' and question = 'ما اسم هذا الخطّ الذي يكتب به الفرس والأردو؟' and answer = 'الفارسيّ (التعليق)';
update public.question_overrides set question = 'ما اسم هذا الخطّ الذي كُتبت به هذه الصفحة من المصحف؟', answer = 'المغربيّ'
 where question_id = 'ADM3639' and question = 'ما اسم هذا الخطّ الذي تُكتب به المصاحف في المغرب العربيّ؟' and answer = 'المغربيّ';
update public.question_overrides set question = 'ما اسم الحجر الأخضر الذي يزيّن قاعدة هذه الكأس؟', answer = 'الملكيت (الملاخيت)'
 where question_id = 'ADM3739' and question = 'ما عيار الذهب الذي صُنعت منه هذه الكأس؟' and answer = '18 قيراطاً';
update public.question_overrides set question = 'ما اسم هذا النقش الذي يُعدّ من أقدم النصوص العربيّة ويذكر امرأ القيس بن عمرو «ملك العرب»؟', answer = 'نقش النمارة'
 where question_id = 'ADM3659' and question = 'ما اسم هذا النقش الذي يُعدّ من أقدم النصوص العربيّة ويعود إلى سنة 328 ميلاديّة؟' and answer = 'نقش النمارة';
update public.question_overrides set question = 'ما هذه السيّارة؟', answer = 'تيسلا سايبر تراك'
 where question_id = 'ADM0654' and question = 'أي علامة تشتهر بسيارة موديل السايبر تراك ؟' and answer = 'تيسلا';
update public.question_overrides set question = 'ما اسم الجهاز الذي تدور عليه الأسطوانة السوداء؟', answer = 'البيك أب (ويُقبل: مشغّل الأسطوانات / الغرامافون)'
 where question_id = 'ADM1300' and question = 'ما اسم الجهاز الذي تدور عليه الأسطوانة السوداء؟' and answer = 'الفونوغراف (الغرامافون)';
update public.question_overrides set question = 'بكم سفينةً بدأ ماجلان رحلته حول العالم؟', answer = 'خمس', level = 'صعب'
 where question_id = 'ADM1415' and question = 'بكم سفينةً بدأ ماجلان رحلته حول العالم؟' and answer = 'خمس' and level = 'تعجيزي';
update public.question_overrides set question = 'من أوّل امرأةٍ مصريّة وعربيّة حصلت على رخصة قيادة الطائرات سنة 1933؟', answer = 'لطفية النادي'
 where question_id = 'ADM5281' and question = 'من أوّل امرأة عربية حصلت على رخصة قيادة الطائرات سنة 1933؟' and answer = 'لطفية النادي';
update public.question_overrides set question = 'ما الحبّ الأخضر الصغير من البقول الذي يُطبخ مع الأرز في طبقٍ كويتيّ تقليديّ مسمّى باسمه؟', answer = 'الماش'
 where question_id = 'ADM0106' and question = 'ما البقول الذي يمنح المموش الكويتي اسمه وقوامه المميز؟' and answer = 'الماش';
update public.question_overrides set question = 'أيّ مدينةٍ فلسطينيّة تشتهر بالكنافة بالجبن وبصناعة صابون زيت الزيتون؟', answer = 'نابلس'
 where question_id = 'ADM0232' and question = 'أيّ مدينةٍ فلسطينيّة تشتهر بالكنافة النابلسيّة بالجبن؟' and answer = 'نابلس';
update public.question_overrides set question = 'ما الحلوى اللبنانيّة من سميدٍ يُحمَّص بالسمن ويُعجن بالقطر ثمّ يُفرد في صينيّة وتعلوه القشطة والفستق؟', answer = 'المفروكة', level = 'متوسط'
 where question_id = 'ADM0054' and question = 'ما الحلوى اللبنانية المصنوعة من عجينة سميد محشوة بالقشطة ومغطاة بالفستق؟' and answer = 'المفروكة' and level = 'سهل';
update public.question_overrides set question = 'حساءٌ صينيّ من أغلى أطباق العالم، مكوّنه لعابٌ متجمّد يُجمع من جدران كهوف جنوب شرق آسيا — ما اسمه؟', answer = 'حساء عشّ الطائر (عشّ السنونو)'
 where question_id = 'ADM7279' and question = 'حساءٌ صينيّ فاخر يُصنع من لعاب طائر السمامة المتجمّد — ما اسمه؟' and answer = 'حساء عشّ الطائر';
update public.question_overrides set question = 'في أيّ بلدٍ عُثر على أقدم نودلز معروفة في التاريخ، عمرها نحو أربعة آلاف سنة؟', answer = 'الصين'
 where question_id = 'ADM1637' and question = 'في أيّ بلدٍ ظهرت المعكرونة قبل أن تشتهر في إيطاليا؟' and answer = 'الصين';
update public.question_overrides set question = 'كم دولةً يضمّها حوض نهر النيل: سبع أم إحدى عشرة أم خمس عشرة؟', answer = 'إحدى عشرة'
 where question_id = 'ADM1451' and question = 'كم دولةً يمرّ بها حوض نهر النيل؟' and answer = 'إحدى عشرة';
update public.question_overrides set question = 'تتقاسم الصين مع روسيا الرقم القياسيّ في عدد الجيران برّاً — كم دولةً تجاور الصين: تسع أم أربع عشرة أم عشرون؟', answer = 'أربع عشرة'
 where question_id = 'ADM1452' and question = 'كم دولةً تشترك في حدودٍ برّيّة مع الصين؟' and answer = 'أربع عشرة';
update public.question_overrides set question = 'كم دولةً يعبرها خطّ الاستواء: سبع أم ثلاث عشرة أم عشرون؟', answer = 'ثلاث عشرة'
 where question_id = 'ADM1453' and question = 'كم دولةً يعبرها خطّ الاستواء؟' and answer = 'ثلاث عشرة';
update public.question_overrides set question = 'أكبر دولةٍ أرخبيليّة في العالم تتكوّن من كم جزيرة تقريباً: سبعة آلاف أم سبعة عشر ألفاً أم سبعون ألفاً؟', answer = 'سبعة عشر ألفاً'
 where question_id = 'ADM1462' and question = 'أكبر دولةٍ أرخبيليّة في العالم تتكوّن من كم جزيرة تقريباً؟' and answer = 'سبعة عشر ألفاً';
update public.question_overrides set question = 'كم عدد أوزان الفعل الثلاثيّ المزيد في العربيّة؟', answer = 'اثنا عشر', level = 'صعب'
 where question_id = 'ADM1551' and question = 'كم عدد أوزان الفعل الثلاثيّ المزيد في العربيّة؟' and answer = 'اثنا عشر' and level = 'تعجيزي';
update public.question_overrides set question = 'كم سنةً ضوئيّة يبلغ قطر مجرّتنا تقريباً؟', answer = 'مئة ألف', level = 'صعب'
 where question_id = 'ADM2802' and question = 'كم سنةً ضوئيّة يبلغ قطر مجرّتنا تقريباً؟' and answer = 'مئة ألف' and level = 'تعجيزي';
update public.question_overrides set question = 'في أيّ حيٍّ قاهريّ قديم وُلد نجيب محفوظ؟', answer = 'الجمالية'
 where question_id = 'M083' and question = 'في أي عام حصل نجيب محفوظ على جائزة نوبل؟' and answer = '1988';
update public.question_overrides set question = 'ما اسم المسرح اللندنيّ الذي عُرضت فيه أشهر مسرحيّات شكسبير، وأُعيد بناؤه قرب موقعه الأصليّ سنة 1997؟', answer = 'مسرح الغلوب (The Globe)'
 where question_id = 'ADM1543' and question = 'كم مسرحيّةً كتب شكسبير تقريباً؟' and answer = '37 (بين 37 و39)';
update public.question_overrides set question = 'ما اسم الطيّة الرقيقة التي تصل باطن اللسان بقاع الفم؟', answer = 'اللجام (لجام اللسان)'
 where question_id = 'ADM1479' and question = 'كم مرّةً يرمش الإنسان في الدقيقة وسطيّاً؟' and answer = 'خمس عشرة';
update public.question_overrides set question = 'ما اسم الكائن العملاق ذي الأرجل الكثيرة الذي يقلّ الشخصيّات في «جاري توتورو»؟', answer = 'قطّ الحافلة (نيكوباس)'
 where question_id = 'ADM7313' and question = 'ما اسم القطّ العملاق الذي يسير كالحافلة في «جاري توتورو»؟' and answer = 'قطّ الحافلة (نيكوباس)';
update public.question_overrides set question = 'في صباها كانت أمّ كلثوم تُنشد مع أبيها في الأفراح والموالد متنكّرةً — في هيئة مَن؟', answer = 'صبيّ (في ملابس ولد)'
 where question_id = 'ADM1691' and question = 'كم أغنيةً غنّت أمّ كلثوم تقريباً في مسيرتها؟' and answer = 'ثلاثمئة';
update public.question_overrides set question = 'ماذا يُسمّى المرفأ الصغير المحاط بجدارٍ من الحجر على ساحل الكويت القديم، تحتمي فيه السفن من الموج؟', answer = 'النقعة'
 where question_id = 'ADM1397' and question = 'كم يبلغ ارتفاع برج التحرير بالأمتار؟' and answer = '372';
update public.question_overrides set question = 'ما اسم سلسلة نظّارات الواقع الافتراضيّ اللاسلكيّة من الشركة المالكة لفيسبوك، وكانت تحمل اسم «أوكولوس» قبلاً؟', answer = 'كويست (ميتا كويست)'
 where question_id = 'ADM2574' and question = 'ما اسم جهاز الواقع الافتراضيّ الذي تصنعه «ميتا» وكان يحمل اسم «أوكولوس»؟' and answer = 'ميتا كويست';
update public.question_overrides set question = 'ما اسم مدينة الملاهي التي افتُتحت عام 1955 في كاليفورنيا، وهي أولى مدن ملاهي ميكي ماوس؟', answer = 'ديزني لاند'
 where question_id = 'ADM2718' and question = 'ما اسم مدينة الملاهي الأولى التي افتتحها والت ديزني عام 1955 في كاليفورنيا؟' and answer = 'ديزني لاند';
update public.question_overrides set question = 'أيّ نادٍ يملك الرقم القياسيّ لأقلّ عددٍ من الأهداف المستقبَلة في موسمٍ واحدٍ بالبريميرليغ (15 هدفاً)؟', answer = 'تشيلسي (موسم 2004-2005)', level = 'صعب'
 where question_id = 'ADM1792' and question = 'كم هدفاً استقبل تشيلسي في موسم 2004-2005 وهو رقمٌ قياسيّ؟' and answer = 'خمسة عشر هدفاً' and level = 'تعجيزي';
update public.question_overrides set question = 'من مؤسّس شركة السيّارات الإيطاليّة الذي كان سائق سباقاتٍ قبل أن يبني شركته، وأطلق اسم ابنه «دينو» على طرازٍ من سيّاراته؟', answer = 'إنزو فيراري'
 where question_id = 'ADM0706' and question = 'من مؤسّس الشركة الإيطاليّة صاحبة شعار الحصان الجامح، وكان سائق سباقٍ قبل أن يبني شركته؟' and answer = 'إنزو فيراري';
update public.question_overrides set question = 'في أيّ معرضٍ أوروبيّ قُدّمت أوّل لاند روفر إنتاجيّة سنة 1948؟', answer = 'معرض أمستردام للسيّارات', level = 'صعب'
 where question_id = 'ADM0669' and question = 'في أي عام قُدمت أول لاند روفر إنتاجية في معرض أمستردام؟' and answer = '1948' and level = 'متوسط';
update public.question_overrides set question = 'أيّ مشهدٍ من «الأسطورة» صار بحسب «اليوم السابع» أوّل مشهدٍ دراميّ يبلغ 100 مليون مشاهدة على يوتيوب؟', answer = 'مشهد خناقة رفاعي وعصام النمر'
 where question_id = 'ADM8319' and question = 'كم مشاهدةً بلغ مشهد الخناقة على يوتيوب ليصير بحسب «اليوم السابع» أوّل مشهدٍ دراميّ يبلغها؟' and answer = '100 مليون';
update public.question_overrides set question = 'في عهد أيّ حاكم لمصر بدأ حفر قناة السويس سنة 1859؟', answer = 'سعيد باشا'
 where question_id = 'ADM5163' and question = 'في عهد أيّ حاكم لمصر بدأ حفر قناة السويس سنة 1859؟' and answer = 'الخديوي سعيد';
update public.question_overrides set question = 'من أوّل رئيس لإندونيسيا بعد الاستقلال؟', answer = 'سوكارنو'
 where question_id = 'ADM5200' and question = 'من أوّل رئيس لإندونيسيا بعد الاستقلال؟' and answer = 'أحمد سوكارنو';
update public.question_overrides set question = 'ما شعار الثورة الفرنسية المكوّن من ثلاث كلمات؟', answer = 'الحرية، المساواة، الإخاء'
 where question_id = 'ADM5168' and question = 'ما شعار الثورة الفرنسية المكوّن من ثلاث كلمات؟' and answer = 'الحرية والإخاء والمساواة';
update public.question_overrides set question = 'ما المعركة التي هزم فيها عمرو بن العاص الروم قرب حصن بابليون سنة 640م فمهّدت لفتح مصر؟', answer = 'معركة عين شمس (هليوبوليس)'
 where question_id = 'M595' and question = 'ما اسم المعركة التي فتح بها المسلمون مصر؟' and answer = 'معركة عين شمس';
update public.question_overrides set question = 'أيّ ابنٍ للخليفة الأمويّ الأوّل خرج في جيش غزو القسطنطينيّة سنة 49هـ؟', answer = 'يزيد بن معاوية'
 where question_id = 'ADM5214' and question = 'من قاد أوّل حملةٍ إسلاميّة على القسطنطينيّة سنة 49هـ، وكان ابن الخليفة الأمويّ الأوّل؟' and answer = 'يزيد بن معاوية';
update public.question_overrides set question = 'ما الاسم الذي عُرفت به الإمارات قبل قيام اتحادها؟', answer = 'الإمارات المتصالحة (أو الساحل المتصالح / ساحل عُمان المتصالح)'
 where question_id = 'ADM5265' and question = 'ما الاسم الذي عُرفت به الإمارات قبل قيام اتحادها؟' and answer = 'الإمارات المتصالحة';
update public.question_overrides set question = 'ماذا يُسمّى اليهود المنحدرون من إسبانيا والبرتغال تمييزاً لهم عن الأشكناز؟', answer = 'السفارديم'
 where question_id = 'ADM5302' and question = 'ماذا يُسمّى يهود إسبانيا والبرتغال والشرق تمييزاً لهم عن يهود أوروبا الشرقية؟' and answer = 'السفارديم';
update public.question_overrides set question = '«أعدى من…» — صعلوكٌ جاهليّ يُضرب به المثل في سرعة العَدْو، نُسب إلى أمّه السوداء؛ من هو؟', answer = 'السُّلَيك بن السُّلَكة'
 where question_id = 'ADM9491' and question = '«أعدى من…» — صعلوكٌ جاهليّ يُضرب به المثل في سرعة العَدْو، أمّه سُلَكة؛ من هو؟' and answer = 'السُّلَيك بن السُّلَكة';
update public.question_overrides set question = 'حرف تجده في السودان والسعودية وسوريا والصومال، ولا تجده في مصر؛ فما هو؟', answer = 'الواو (ويُقبل الألف)'
 where question_id = 'ADM4448' and question = 'حرف تجده في السودان والسعودية وسوريا والصومال، ولا تجده في مصر؛ فما هو؟' and answer = 'الواو';
update public.question_overrides set question = 'من ابن خالِ ابنِ عمّتك؟', answer = 'أنت أو أخوك أو ابن عمّك'
 where question_id = 'ADM4486' and question = 'من ابن خالِ ابنِ عمّتك؟' and answer = 'أنت (أو أخوك)';
update public.question_overrides set question = 'من «البسوس» التي ضُرب بها المثل في الشؤم؟', answer = 'خالة جسّاس بن مرّة (البسوس بنت منقذ التميميّة)'
 where question_id = 'ADM1351' and question = 'من «البسوس» التي ضُرب بها المثل في الشؤم؟' and answer = 'امرأة من تميم';
update public.question_overrides set question = 'ما الشيء الذي يدور في البيت ولا يخرج منه؟', answer = 'الساعة الجداريّة (وتُقبل المروحة)'
 where question_id = 'E502' and question = 'ما الشيء الذي يدور في البيت ولا يخرج منه؟' and answer = 'الساعة الجدارية';
update public.question_overrides set question = 'كم قياس الزاوية الصغرى بين عقربي الساعة عند الثالثة والربع؟', answer = '7.5 درجة'
 where question_id = 'PA119' and question = 'كم قياس الزاوية الصغرى بين عقربي الساعة عند الثالثة والربع؟' and answer = '7٫5 درجات';
update public.question_overrides set question = 'ما اسم صديق النحلة «زينة» الكسول الذي يحبّ النوم والأكل؟', answer = 'نحول'
 where question_id = 'ADM6216' and question = 'ما اسم الجندب الكسول صديق النحلة زينة؟' and answer = 'نحول';
update public.question_overrides set question = 'بأيّ اسمٍ عُرف الأسد الأبيض بطل الكرتون اليابانيّ «جانغل تايتي» في دبلجته الأمريكيّة؟', answer = 'كيمبا'
 where question_id = 'ADM6249' and question = 'بأيّ اسمٍ عُرف الأسد الأبيض بطل الكرتون المدبلج في نسخته اليابانيّة الأصليّة؟' and answer = 'كيمبا';
update public.question_overrides set question = 'ما اسم الحلوى العراقيّة المطّاطيّة المحشوّة بالجوز أو الفستق والمغلّفة بالطحين، وتُصنع من إفرازٍ طبيعيّ يُجمع عن أشجار البلّوط في شمال العراق؟', answer = 'منّ السما (المنّ والسلوى)'
 where question_id = 'ADM0223' and question = 'ما اسم الحلوى العراقية من النشا والسكر والهيل التي تُقطّع مكعبات وتُرشّ بالسكر؟' and answer = 'المنّ والسلوى';
update public.question_overrides set question = 'ما اسم الطبق التونسيّ من دقيق الشعير المحمّص يُعجن بزيت الزيتون والسكر؟', answer = 'الزميطة'
 where question_id = 'ADM0254' and question = 'ما اسم طبق تونسي من فتات الخبز والتمر وزيت الزيتون؟' and answer = 'الزميطة';
update public.question_overrides set question = 'ما المادّة التي تجعل مشروب السحلب يثخن عند التسخين؟', answer = 'دقيق درنات الأوركيد (أو النشا في الأنواع التجاريّة)'
 where question_id = 'ADM0267' and question = 'ما المادّة التي تجعل مشروب السحلب يثخن عند التسخين؟' and answer = 'النشا';
update public.question_overrides set question = 'ما الكبة العراقيّة المصنوعة من عجين الأرز، تُطهى كراتٍ في مرقٍ بالليمون والشلغم والخضار؟', answer = 'كبة حامض'
 where question_id = 'ADM0061' and question = 'ما الكبة العراقيّة المصنوعة من عجين الأرز، تُطهى كراتٍ في مرقٍ حامض بالخضار؟' and answer = 'كبة حامض';
update public.question_overrides set question = 'ما اسم السمك المحفوظ من الكنعد أو القباب، يُنقع في الماء قبل أن يُطبخ مع العيش في الإمارات والخليج؟', answer = 'المالح'
 where question_id = 'ADM0207' and question = 'ما اسم السمك المملّح المجفّف الذي يُطبخ مع الأرز في الخليج؟' and answer = 'المالح';
update public.question_overrides set question = 'ما اسم خبز الصعيد الذي يُترك عجينه ليتخمّر في العراء قبل خبزه؟', answer = 'العيش الشمسي'
 where question_id = 'ADM0240' and question = 'ما اسم خبز الصعيد الذي يُترك عجينه ليتخمّر تحت أشعّة الشمس قبل خبزه؟' and answer = 'العيش الشمسي';
update public.question_overrides set question = 'ما اسم الببغاء الثرثارة في «افتح يا سمسم»؟', answer = 'ميسون'
 where question_id = 'ADM6197' and question = 'عن أيّ برنامجٍ أمريكيّ اقتُبس «افتح يا سمسم»؟' and answer = 'شارع السمسم';
update public.question_overrides set question = 'ما الحلوى المصريّة المخبوزة المسقيّة بالقطر وتعلوها حبّة لوز غالباً؟', answer = 'البسبوسة'
 where question_id = 'ADM0062' and question = 'ما الحلوى الشامية المصنوعة من السميد والقطر وتعلوها حبة لوز غالباً؟' and answer = 'البسبوسة';
update public.question_overrides set question = 'ما الجبن الإيطاليّ الذي يُدقّ مع الريحان والصنوبر والثوم في صلصة جنوة الخضراء؟', answer = 'البارميزان (ويُقبل البيكورينو)'
 where question_id = 'ADM0170' and question = 'ما الجبن الإيطاليّ الذي يُدقّ مع الريحان والصنوبر والثوم في صلصة جنوة الخضراء؟' and answer = 'البارميزان';
update public.question_overrides set question = 'ما الاسم الخليجيّ لليمون المجفّف الذي يُنكَّه به المجبوس؟', answer = 'اللومي'
 where question_id = 'ADM0104' and question = 'أي نوع من الليمون المجفف يُستخدم بكثرة لتنكه المجبوس الخليجي؟' and answer = 'اللومي';
update public.question_overrides set question = 'ما الحلوى الحمويّة من عجينة السميد المفرودة الملفوفة على القشطة والمرشوشة بالفستق وماء الزهر؟', answer = 'حلاوة الجبن'
 where question_id = 'ADM0052' and question = 'ما الحلوى الحمويّة الحلبيّة من عجينة السميد الملفوفة بالقشطة والمرشوشة بالفستق وماء الزهر؟' and answer = 'حلاوة الجبن';
update public.question_overrides set question = 'ما مهنة عشيقة توني في الموسم الثالث التي انتحرت لاحقاً؟', answer = 'بائعة سيّارات مرسيدس'
 where question_id = 'ADM8395' and question = 'ما مهنة عشيقة توني التي انتحرت في الموسم الثالث؟' and answer = 'بائعة سيّارات مرسيدس';
update public.question_overrides set question = 'بأيّ اسمٍ تُعرف الرياح المطيرة التي تهبّ على الهند وجنوب آسيا كلّ صيف؟', answer = 'المونسون (الرياح الموسميّة)'
 where question_id = 'ADM1463' and question = 'بأيّ اسمٍ تُعرف الرياح الموسميّة في جنوب آسيا؟' and answer = 'المونسون';
update public.question_overrides set question = 'ما اسم البركان الخامد في هاواي الذي يفوق إيفرست ارتفاعاً إن قيس من قاعه في المحيط؟', answer = 'ماونا كيا'
 where question_id = 'ADM1328' and question = 'جبل كيا الأعلى من إيفرست إن قيس من قاعه — أين يقع؟' and answer = 'هاواي';
update public.question_overrides set question = 'ما الدولة الأوروبيّة المشهورة بالفيوردات وأرض الفايكنج؟', answer = 'النرويج'
 where question_id = 'E256' and question = 'ما الدولة الأوروبية المشهورة بالمضائق البحرية وأرض الفايكنج؟' and answer = 'النرويج';
update public.question_overrides set question = 'ما أكبر خليج في العالم مساحةً؟', answer = 'خليج البنغال'
 where question_id = 'H188' and question = 'ما أكبر خليج في العالم؟' and answer = 'خليج المكسيك';
update public.question_overrides set question = 'ما أكبر دولةٍ أرخبيليّة في العالم؟', answer = 'إندونيسيا', level = 'متوسط'
 where question_id = 'H034' and question = 'ما أكبر أرخبيل جزري في العالم؟' and answer = 'إندونيسيا' and level = 'صعب';
update public.question_overrides set question = 'ما المدينة التي تعمل إندونيسيا على نقل عاصمتها منها إلى مدينة نوسانتارا الجديدة؟', answer = 'جاكرتا'
 where question_id = 'M224' and question = 'ما عاصمة إندونيسيا الحاليّة؟' and answer = 'جاكرتا';
update public.question_overrides set question = 'ما اسم البحر الذي يقع بين السويد وفنلندا؟', answer = 'بحر البلطيق (ويُقبل خليج بوثنيا)'
 where question_id = 'M660' and question = 'ما اسم البحر الذي يقع بين السويد وفنلندا؟' and answer = 'بحر البلطيق';
update public.question_overrides set question = 'أيّ دولتين تقعان على ضفّتي مضيق باب المندب؟', answer = 'اليمن وجيبوتي (وتُقبل إريتريا مع اليمن)'
 where question_id = 'ADM5129' and question = 'أيّ دولتين تقعان على ضفّتي مضيق باب المندب؟' and answer = 'اليمن وجيبوتي';
update public.question_overrides set question = 'ما أعلى قمة في أوروبا؟', answer = 'جبل إلبروس (ويُقبل مون بلان لمن لا يعدّ القوقاز من أوروبا)'
 where question_id = 'M156' and question = 'ما أعلى قمة في أوروبا؟' and answer = 'جبل إلبروس';
update public.question_overrides set question = 'ما اسم أكبر جزيرةٍ رمليّة في العالم؟', answer = 'فريزر (كغاري)'
 where question_id = 'ADM1455' and question = 'ما اسم أكبر جزيرةٍ رمليّة في العالم؟' and answer = 'فريزر';
update public.question_overrides set question = 'ما اسم الصحراء التي تغطّي معظم بوتسوانا؟', answer = 'صحراء كالاهاري', level = 'متوسط'
 where question_id = 'E255' and question = 'ما اسم الصحراء التي تمتد في جنوب أفريقيا؟' and answer = 'صحراء كالاهاري' and level = 'سهل';
update public.question_overrides set question = 'ما الدولة الأفريقيّة التي هزمت الجيش الإيطاليّ في معركة عدوة سنة 1896؟', answer = 'إثيوبيا', category = 'تاريخ وحضارات'
 where question_id = 'H320' and question = 'ما الدولة الأفريقيّة التي هزمت الجيش الإيطاليّ في معركة عدوة سنة 1896؟' and answer = 'إثيوبيا' and category = 'جغرافيا ومعالم';
update public.question_overrides set question = 'ما اسم صيغة «أفعل» في مثل «أكبر» و«أجمل» حين نقارن بين شيئين؟', answer = 'اسم التفضيل'
 where question_id = 'ADM3611' and question = 'ما اسم صيغة «أفعل» الدالّة على المفاضلة، مثل «أكبر»؟' and answer = 'اسم التفضيل';
update public.question_overrides set question = 'ما الكلمة التي تعني شدّة الجوع، وتُطلق أيضاً على داء الكَلَب؟', answer = 'السُّعار'
 where question_id = 'ADM5008' and question = 'ماذا تُسمّى شدّة الجوع؟' and answer = 'السُّعار';
update public.question_overrides set question = 'ما معنى «السِّنة» في قوله تعالى «لا تأخذه سِنةٌ ولا نوم»؟', answer = 'النعاس (أوّل النوم الخفيف)'
 where question_id = 'ADM4992' and question = 'ماذا يُسمّى النوم الخفيف؟' and answer = 'الإغفاء';
update public.question_overrides set question = 'ما اسم أبطأ الثدييّات حركةً، ويقضي معظم وقته معلّقاً بالأشجار؟', answer = 'الكسلان'
 where question_id = 'ADM1522' and question = 'ما اسم أبطأ حيوانٍ في العالم؟' and answer = 'الكسلان';
update public.question_overrides set question = 'ما الحيوان الأليف الذي يقفل مفاصل أرجله فيغفو واقفاً، ولا يستلقي إلّا للنوم العميق؟', answer = 'الحصان'
 where question_id = 'M238' and question = 'ما الحيوان الذي ينام واقفًا؟' and answer = 'الحصان';
update public.question_overrides set question = 'أيّ كائنٍ بحريّ هلاميّ صغير يستطيع العودة إلى طور الشباب بعد البلوغ ليبدأ دورة حياته من جديد؟', answer = 'قنديل البحر الخالد (Turritopsis)'
 where question_id = 'ADM2805' and question = 'أيّ كائنٍ بحريّ هلاميّ يستطيع العودة إلى طور الشباب بعد البلوغ، فوُصف بأنّه لا يموت موتاً طبيعيّاً؟' and answer = 'قنديل البحر الخالد';
update public.question_overrides set question = 'ما اسم العفن الذي لاحظ فليمنغ سنة 1928 أنّه يقتل البكتيريا في طبقه؟', answer = 'البنسيليوم'
 where question_id = 'ADM1469' and question = 'ما اسم الفطر الذي استُخرج منه البنسلين؟' and answer = 'البنسيليوم';
update public.question_overrides set question = 'ما الاسم العلميّ للطبقة الوسطى السميكة من جدار القلب؟', answer = 'الميوكارديوم (عضلة القلب)'
 where question_id = 'H110' and question = 'ما الطبقة العضلية الوسطى من جدار القلب؟' and answer = 'عضلة القلب الميوكارد';
update public.question_overrides set question = 'ما اسم الغدّة التي تفرز هرمون الكورتيزول؟', answer = 'الغدة الكظرية (فوق الكلوية)'
 where question_id = 'M692' and question = 'ما اسم الغدة التي تقع فوق الكلية؟' and answer = 'الغدة الكظرية';
update public.question_overrides set question = 'كم عدد فقرات العمود الفقريّ عند الإنسان إذا عُدّت الفقرات الملتحمة أسفله كلٌّ على حدة؟', answer = '33 فقرة'
 where question_id = 'H015' and question = 'كم عدد فقرات العمود الفقري عند الإنسان البالغ؟' and answer = '33 فقرة';
update public.question_overrides set question = 'ما الهرمون الذي يفرزه الجسم الأصفر فيهيّئ بطانة الرحم ويثبّت الحمل؟', answer = 'البروجسترون'
 where question_id = 'ADM4071' and question = 'ما الهرمون الذي يثبّت الحمل ويُسمّى هرمون الحمل؟' and answer = 'البروجسترون';
update public.question_overrides set question = 'ما الهرمون الذي يرفع نسبة الكالسيوم في الدم بسحبه من العظام؟', answer = 'هرمون الغدة الجاردرقية (الباراثورمون)'
 where question_id = 'H420' and question = 'ما اسم الهرمون الذي ينظّم امتصاص الكالسيوم من العظام؟' and answer = 'هرمون الغدة الجاردرقية';
update public.question_overrides set question = 'أيّ جزءٍ من العين لا تصله أوعيةٌ دمويّة فيأخذ أكسجينه من الهواء مباشرة؟', answer = 'القرنية'
 where question_id = 'ADM1470' and question = 'أيّ جزءٍ من الجسم لا يصله دمٌ مباشرةً فيتغذّى بالانتشار؟' and answer = 'القرنية';
update public.question_overrides set question = 'كم عدد المعلّقات في رواية حمّاد الراوية المشهورة؟', answer = 'سبع معلّقات'
 where question_id = 'M374' and question = 'كم عدد المعلقات المشهورة في الشعر الجاهلي؟' and answer = 'سبع معلقات';
update public.question_overrides set question = 'ما الرواية الفرنسيّة التي صنّفتها موسوعة غينيس أطول روايةٍ في العالم؟', answer = 'البحث عن الزمن المفقود', level = 'صعب'
 where question_id = 'ADM1544' and question = 'ما اسم أطول روايةٍ كُتبت في التاريخ؟' and answer = 'البحث عن الزمن المفقود' and level = 'تعجيزي';
update public.question_overrides set question = 'ما اسم العضو الذي تنضج فيه الخلايا التائيّة في جهاز المناعة؟', answer = 'الغدة الزعترية'
 where question_id = 'H342' and question = 'ما اسم العضو الذي ينضج فيه الخلايا التائية في جهاز المناعة؟' and answer = 'الغدة الزعترية';
update public.question_overrides set question = 'ما اسم الجزء من النفرون الذي يُرشَّح فيه الدم؟', answer = 'الكبيبة'
 where question_id = 'H417' and question = 'ما اسم الجزء من النفرون الذي تُرشَّح فيه الدماء؟' and answer = 'الكبيبة';
update public.question_overrides set question = 'من الصحابيّ الذي كان يتتبّع آثار النبيّ صلى الله عليه وسلم فينزل حيث نزل ويصلّي حيث صلّى؟', answer = 'عبد الله بن عمر رضي الله عنهما'
 where question_id = 'ADM2291' and question = 'من الصحابيّ ابن الخليفة الثاني الذي عُرف بشدّة اتّباعه للسنّة؟' and answer = 'عبد الله بن عمر رضي الله عنهما';
update public.question_overrides set question = 'من الصحابيّ اليمنيّ الذي كان حَكَم عليّ رضي الله عنه في التحكيم بعد صفّين؟', answer = 'أبو موسى الأشعريّ رضي الله عنه'
 where question_id = 'ADM3203' and question = 'من الصحابيّ اليمنيّ الذي كان أحد الحكمين في صفّين وكان حسن الصوت بالقرآن؟' and answer = 'أبو موسى الأشعريّ رضي الله عنه';
update public.question_overrides set question = 'من التابعيّ الذي رفض تزويج ابنته لوليّ عهد الخليفة عبد الملك وزوّجها تلميذه الفقير؟', answer = 'سعيد بن المسيّب'
 where question_id = 'ADM3228' and question = 'من التابعيّ الذي رفض تزويج ابنته للخليفة وزوّجها تلميذه الفقير؟' and answer = 'سعيد بن المسيّب';
update public.question_overrides set question = 'من الصحابيّ الذي كان أوّل من أسرج القناديل في المسجد النبويّ؟', answer = 'تميم الداري'
 where question_id = 'ADM4410' and question = 'من الصحابي الذي أوّل من أسرج القناديل في المسجد النبوي؟' and answer = 'تميم الداري';
update public.question_overrides set question = 'ما سلسلة الأفلام المقتبسة عن روايات تولكين التي يحمل فيها الهوبيت فرودو أمانةً يجب تدميرها في جبل الهلاك؟', answer = 'سيد الخواتم'
 where question_id = 'M577' and question = 'ما سلسلة الأفلام المقتبسة عن روايات تولكين وتدور حول خاتم يجب تدميره؟' and answer = 'سيد الخواتم';
update public.question_overrides set question = 'ما اسم الأسلوب السينمائيّ الذي يُصوَّر فيه المشهد كاملاً دون أيّ قطعٍ في المونتاج؟', answer = 'اللقطة الطويلة (الوان شوت)'
 where question_id = 'H372' and question = 'ما اسم التقنية السينمائية التي تُصوَّر بها اللقطة الواحدة بلا قطع؟' and answer = 'اللقطة الطويلة';
update public.question_overrides set question = 'ماذا تُسمّى السور التي تفتتح بتنزيه الله عن النقائص؟', answer = 'المسبّحات'
 where question_id = 'ADM4216' and question = 'ماذا تُسمّى السور التي تبدأ بـ«سبّح» أو «يسبّح»؟' and answer = 'المسبّحات';
update public.question_overrides set question = 'ما اسم المقياس الأشهر لقياس قوّة الزلازل؟', answer = 'ريختر (مقياس ريختر)'
 where question_id = 'M024' and question = 'ما الوحدة المستخدمة لقياس شدة الزلازل؟' and answer = 'درجة ريختر';
update public.question_overrides set question = 'ما اسم العملية التي تنتقل بها الحرارة عبر ملامسة الأجسام؟', answer = 'التوصيل'
 where question_id = 'M604' and question = 'ما اسم العملية التي ينتقل بها الحرارة عبر ملامسة الأجسام؟' and answer = 'التوصيل';
update public.question_overrides set question = 'ما الجهاز الذي تُقاس به شدّة التيار الكهربائي؟', answer = 'الأميتر'
 where question_id = 'ADM4152' and question = 'ما الجهاز الذي يُقاس به شدّة التيار الكهربائي؟' and answer = 'الأميتر';
update public.question_overrides set question = 'ما اسم المنظمة التي تضم الدول المصدرة للنفط؟', answer = 'أوبك', category = 'معلومات عامة'
 where question_id = 'E084' and question = 'ما اسم المنظمة التي تضم الدول المصدرة للنفط؟' and answer = 'أوبك' and category = 'علوم واختراعات';
update public.question_overrides set question = 'فيلسوف ورياضي يوناني تُنسب إليه النظرية الشهيرة في أضلاع المثلث القائم، رغم أن حضارات أقدم منه عرفت هذه العلاقة الرياضية. من هذه الشخصية؟', answer = 'فيثاغورس'
 where question_id = 'H250' and question = 'فيلسوف ورياضي يوناني تُنسب إليه نظرية زوايا المثلث القائم الشهيرة، رغم أن حضارات أقدم منه عرفت هذه العلاقة الرياضية. من هذه الشخصية؟' and answer = 'فيثاغورس';
update public.question_overrides set question = 'ما اسم البئر التي اشتراها عثمان رضي الله عنه وتصدّق بها على المسلمين؟', answer = 'بئر رومة'
 where question_id = 'ADM1992' and question = 'ما اسم البئر التي حفرها عثمان رضي الله عنه وتصدّق بها؟' and answer = 'بئر رومة';
update public.question_overrides set question = 'أديبٌ بصريّ يُروى أنّ رفوف كتبي انهارت عليّ فمتُّ تحتها — من أنا؟', answer = 'الجاحظ'
 where question_id = 'ADM6538' and question = 'أديبٌ بصريّ يُروى أنّ رفوف كتبي انهارت عليّ فماتت تحتها — من أنا؟' and answer = 'الجاحظ';
update public.question_overrides set question = 'وضع قوانين الحركة الثلاثة وقانون الجذب العام، وتُروى قصة اكتشافه مقرونة بسقوط تفاحة من شجرة. من هذه الشخصية؟', answer = 'إسحاق نيوتن'
 where question_id = 'M455' and question = 'وضع قوانين الحركة والجاذبية الثلاثة، وتُروى قصة اكتشافه مقرونة بسقوط تفاحة من شجرة. من هذه الشخصية؟' and answer = 'إسحاق نيوتن';
update public.question_overrides set question = 'عالم مسلم يُلقّب بأبي الكيمياء، ووضع أسس المنهج التجريبي في هذا العلم. من هذه الشخصية؟', answer = 'جابر بن حيّان'
 where question_id = 'M474' and question = 'عالم مسلم يُعدّ أباً للكيمياء الحديثة، ووضع أسس المنهج التجريبي في هذا العلم. من هذه الشخصية؟' and answer = 'جابر بن حيّان';
update public.question_overrides set question = 'سلطان عثماني دخل القسطنطينية سنة 1453 وهو في الحادية والعشرين من عمره، فأنهى بذلك الإمبراطورية البيزنطية. من هذه الشخصية؟', answer = 'محمد الفاتح', level = 'متوسط'
 where question_id = 'H259' and question = 'سلطان عثماني فتح القسطنطينية سنة 1453 وهو في الحادية والعشرين من عمره، فأنهى بذلك الإمبراطورية البيزنطية. من هذه الشخصية؟' and answer = 'محمد الفاتح' and level = 'صعب';
update public.question_overrides set question = 'سلطان عثماني حكم أطول فترة في تاريخ الدولة العثمانية، وحاصر فيينا، وبلغت الدولة في عهده ذروة اتّساعها. من هذه الشخصية؟', answer = 'سليمان القانوني'
 where question_id = 'H245' and question = 'سلطان عثماني حكم أطول فترة في تاريخ الدولة العثمانية، ودُوّنت في عهده مجموعة قوانين حملت لقبه. من هذه الشخصية؟' and answer = 'سليمان القانوني';
update public.question_overrides set question = 'قائد إغريقيّ بنى إمبراطورية امتدت من اليونان حتى الهند، قبل أن يبلغ الثلاثين من عمره. من هذه الشخصية؟', answer = 'الإسكندر المقدوني (الأكبر)'
 where question_id = 'E277' and question = 'قائد مقدوني بنى إمبراطورية امتدت من اليونان حتى الهند، قبل أن يبلغ الثلاثين من عمره. من هذه الشخصية؟' and answer = 'الإسكندر المقدوني';
update public.question_overrides set question = 'من كاتب الوحي الذي قال: «فتتبّعتُ القرآن أجمعه من العُسُب واللِّخاف وصدور الرجال»؟', answer = 'زيد بن ثابت رضي الله عنه'
 where question_id = 'ADM1995' and question = 'ما اسم الصحابيّ الذي كتب الوحي وجُمع القرآن على مصحفه؟' and answer = 'زيد بن ثابت رضي الله عنه';
update public.question_overrides set question = 'كم عدد شروط صحّة الصلاة عند الحنابلة (منها الإسلام والطهارة واستقبال القبلة)؟', answer = 'تسعة'
 where question_id = 'ADM3373' and question = 'كم عدد الشروط المشهورة لصحّة الصلاة كالطهارة واستقبال القبلة؟' and answer = 'تسعة';
update public.question_overrides set question = 'عند المالكيّة، بعد أيّ عملٍ من أعمال يوم العيد في الحجّ يقع التحلّل الأصغر؟', answer = 'رمي جمرة العقبة'
 where question_id = 'ADM4091' and question = 'بعد أيّ عمل من أعمال الحج يقع التحلّل الأصغر؟' and answer = 'رمي جمرة العقبة';
update public.question_overrides set question = 'ما أقلّ مقدارٍ من المال تُقطع فيه يد السارق عند جمهور الفقهاء؟', answer = 'ربع دينار'
 where question_id = 'ADM4095' and question = 'ما أقلّ مقدار من المال تُقطع فيه يد السارق؟' and answer = 'ربع دينار';
update public.question_overrides set question = 'كم يجب أن يمرّ على المال لتجب فيه الزكاة؟', answer = 'سنة هجريّة (الحول)'
 where question_id = 'ADM3344' and question = 'كم يجب أن يمرّ على المال ليجب فيه الزكاة؟' and answer = 'سنة هجريّة (الحول)';
update public.question_overrides set question = 'أخوان حاولا إحياء أمّهما بطقسٍ محرّم، فخسر الأكبر ذراعه وساقه — ما اسم الأنمي؟', answer = 'الخيميائيّ المعدنيّ الكامل (Fullmetal Alchemist)'
 where question_id = 'ADM2607' and question = 'أخوان خيميائيّان دفعا ثمناً باهظاً لمحاولة إحياء أمّهما — ما اسم الأنمي؟' and answer = 'الخيميائيّ المعدنيّ الكامل (Fullmetal Alchemist)';
update public.question_overrides set question = 'ما اسم مجلّة المانغا المنافسة لشونن جمب التي نشرت «فيري تيل» وتصدر عن كودانشا؟', answer = 'شونن ماغازين'
 where question_id = 'ADM3092' and question = 'ما اسم مجلّة شونن جمب المنافسة التي تنشر «فيري تيل» وتصدر عن كودانشا؟' and answer = 'شونن ماغازين';
update public.question_overrides set question = 'ما اسم اللصّ الساحر الظريف ذي القبّعة والرداء الأبيضين، خصم كونان؟', answer = 'كايتو كيد'
 where question_id = 'ADM3049' and question = 'ما اسم اللصّ الساحر ذي القبّعة والأبيض خصم كونان الظريف؟' and answer = 'كايتو كيد';
update public.question_overrides set question = 'من الملحّن المصريّ الذي لحّن لعبد الحليم حافظ «صافيني مرّة» و«قارئة الفنجان»؟', answer = 'محمد الموجي'
 where question_id = 'ADM0852' and question = 'من الملحّن المصري الذي وضع لعبد الحليم حافظ ألحاناً إلى جانب كمال الطويل وبليغ حمدي؟' and answer = 'محمد الموجي';
update public.question_overrides set question = 'ماذا يُسمّى المقطع الذي يتكرّر بين مقاطع الأغنية؟', answer = 'المذهب (ويُقبل: اللازمة)'
 where question_id = 'ADM0737' and question = 'ماذا يُسمّى المقطع الذي يتكرّر بين مقاطع الأغنية؟' and answer = 'اللازمة';
update public.question_overrides set question = 'ماذا تُسمّى الزخارف الصوتيّة السريعة التي يتنقّل فيها المطرب بين النغمات على مقطع واحد؟', answer = 'العُرَب'
 where question_id = 'ADM0818' and question = 'ماذا تُسمّى الزخرفة الصوتية التي يؤدّيها المطرب على مقطع واحد إظهاراً لمقدرته؟' and answer = 'التطريب';
update public.question_overrides set question = 'ما اسم السفينة الخشبيّة الكبيرة ذات المقدّمة المدبّبة التي اشتُهرت بها الكويت في رحلات السفر التجاريّ إلى الهند وأفريقيا؟', answer = 'البوم'
 where question_id = 'E123' and question = 'ما اسم السفينة الخشبية التقليدية في الخليج؟' and answer = 'البوم';
update public.question_overrides set question = 'كم متراً طول ملعب كرة القدم الذي يعتمده فيفا للمباريات الدوليّة الكبرى؟', answer = '105 أمتار'
 where question_id = 'M623' and question = 'كم متراً طول ملعب كرة القدم الرسمي تقريباً؟' and answer = 'مئة وخمسة أمتار';
update public.question_overrides set question = 'من المهندس الذي صمّم حاسوب آبل الأوّل وأسّس الشركة مع ستيف جوبز؟', answer = 'ستيف وزنياك'
 where question_id = 'H136' and question = 'من أسّس شركة آبل مع ستيف جوبز؟' and answer = 'ستيف وزنياك';
update public.question_overrides set question = 'ما اسم الروبوت الأخضر الصغير شعار نظام أندرويد؟', answer = 'بَغ دْرويد (Bugdroid) أو آندي (Andy)'
 where question_id = 'ADM7395' and question = 'ما اسم الروبوت الأخضر الصغير شعار نظام أندرويد؟' and answer = 'بَغ دْرويد (Bugdroid)';
update public.question_overrides set question = 'ما اسم الحاسوب الذي طرحته شركة «الأزرق الكبير» عام 1981 فصار معيار الحواسيب المكتبيّة بعده؟', answer = 'آي بي إم بي سي (IBM PC)'
 where question_id = 'H357' and question = 'ما اسم أول حاسوب شخصي طرحته آي بي إم عام 1981؟' and answer = 'آي بي إم بي سي';
update public.question_overrides set question = 'ما اسم بوّابة الإنترنت التي في شعارها علامة تعجّب، وكانت أشهر مواقع البحث في التسعينات قبل غوغل؟', answer = 'ياهو'
 where question_id = 'ADM1240' and question = 'ما اسم محرّك البحث الذي ساد قبل انتشار غوغل؟' and answer = 'ياهو';
update public.question_overrides set question = 'نزال «رامبل إن ذا جنغل» الشهير جمع محمد علي بمنافسٍ — من هو؟', answer = 'جورج فورمان'
 where question_id = 'ADM1325' and question = 'نزال «الرعد في الأدغال» جمع محمد علي بمنافسٍ شهير — من هو؟' and answer = 'جورج فورمان';
update public.question_overrides set question = 'ما نصّ أوّل رسالةٍ أُرسلت بين حاسوبين عبر الشبكة التي سبقت الإنترنت؟', answer = 'LO (لو) — أرادوا LOGIN فتعطّل النظام'
 where question_id = 'ADM1595' and question = 'ما اسم أوّل رسالةٍ أُرسلت عبر الإنترنت؟' and answer = 'لو';
update public.question_overrides set question = 'ما الرياضة الأولمبيّة التي يتنافس فيها الفارس وحصانه على تخطّي الحواجز؟', answer = 'الفروسية (قفز الحواجز)'
 where question_id = 'ADM9554' and question = 'ما الرياضة الأولمبيّة التي يتنافس فيها الفارس وحصانه على تخطّي الحواجز؟' and answer = 'الفروسية';
update public.question_overrides set question = 'لعبة بطاقاتٍ من «سوبرسل» تُدمّر فيها أبراج الخصم بجنودٍ وتعاويذ في ساحةٍ صغيرة — ما اسمها؟', answer = 'كلاش رويال'
 where question_id = 'ADM2556' and question = 'بطاقاتٌ تُلعب في ساحاتٍ صغيرة بين لاعبين من عالم «كلاش أوف كلانز» — ما اسم اللعبة؟' and answer = 'كلاش رويال';
update public.question_overrides set question = 'ما اسم سلسلة كرة السلّة السنويّة التي تطوّرها «فيجوال كونسبتس»، ومن أطوارها «MyCareer»؟', answer = 'NBA 2K'
 where question_id = 'ADM2576' and question = 'لعبة كرة السلّة السنويّة من «2K» — ما اسمها؟' and answer = 'NBA 2K';
update public.question_overrides set question = 'أيّ نبيٍّ نادى ربَّه «ربّ لا تذرني فرداً وأنت خير الوارثين»؟', answer = 'زكريّا عليه السلام'
 where question_id = 'ADM2102' and question = 'أيّ نبيٍّ ناداه ربُّه «ربّ لا تذرني فرداً وأنت خير الوارثين»؟' and answer = 'زكريّا عليه السلام';
update public.question_overrides set question = 'من النبيّ الذي بشّرته الملائكة بغلامٍ فأقبلت امرأته في صرّةٍ فصكّت وجهها وقالت «عجوزٌ عقيم»؟', answer = 'إبراهيم عليه السلام'
 where question_id = 'ADM2069' and question = 'من النبيّ الذي بشّرته الملائكة بغلامٍ وامرأتُه عجوزٌ عقيم؟' and answer = 'إبراهيم عليه السلام';
update public.question_overrides set question = 'في أيّ موقعٍ إغريقيّ قديم قام تمثال كبير الآلهة المصنوع من العاج والذهب، أحد عجائب الدنيا السبع؟', answer = 'أوليمبيا'
 where question_id = 'ADM3771' and question = 'في أيّ مدينةٍ إغريقيّة كانت تُقام الألعاب الأولمبيّة القديمة؟' and answer = 'أوليمبيا';
update public.question_overrides set question = 'من قائد الإسكندر الذي حكم مصر بعد وفاته وأسّس أسرةً حكمتها نحو ثلاثة قرون حتى دخلها الرومان؟', answer = 'بطليموس الأول'
 where question_id = 'ADM4051' and question = 'من قائد الإسكندر الذي حكم مصر بعد وفاته وأسّس دولة البطالمة؟' and answer = 'بطليموس الأول';
update public.question_overrides set question = 'ماذا كان عمل إيمانويل ماكرون قبل دخوله العمل السياسيّ؟', answer = 'مصرفيّ استثماريّ (في بنك روتشيلد)', level = 'صعب'
 where question_id = 'ADM8667' and question = 'ماذا كان عمل إيمانويل ماكرون قبل الرئاسة؟' and answer = 'مصرفيّ' and level = 'تعجيزي';
update public.question_overrides set question = 'ما الرواية التي يستيقظ بطلها ذات صباح فيجد نفسه حشرةً ضخمة؟', answer = 'المسخ (التحوّل)'
 where question_id = 'ADM8571' and question = 'ما الرواية التي يستيقظ بطلها ذات صباح فيجد نفسه حشرةً ضخمة؟' and answer = 'المسخ';
update public.question_overrides set question = 'ما لقب جورج واشنطن عند الأمريكيّين؟', answer = 'أبو الأمّة (أبو الوطن)'
 where question_id = 'ADM8645' and question = 'ما لقب جورج واشنطن عند الأمريكيّين؟' and answer = 'أبو الأمّة';
update public.question_overrides set question = 'ما اسم مجمّع المعابد الأضخم في الأقصر، صاحب بهو الأعمدة الكبير؟', answer = 'معبد الكرنك'
 where question_id = 'ADM2148' and question = 'ما اسم المعبد الضخم في الأقصر المشهور بأعمدته؟' and answer = 'معبد الكرنك';
update public.question_overrides set question = 'ما اسم المسابقة الغنائيّة السنويّة التي تتنافس فيها دول أوروبا بأغنية واحدة لكلّ دولة؟', answer = 'يوروفيجن'
 where question_id = 'ADM3836' and question = 'ما اسم مسابقة الأغنية الأوروبية الشهيرة؟' and answer = 'يوروفيجن';
update public.question_overrides set question = 'أيّ فيلم رسوم متحرّكة تجاوز «فروزن 2» عام 2024 فصار يومها الأعلى إيراداً في التاريخ؟', answer = 'قلباً وقالباً 2'
 where question_id = 'ADM2990' and question = 'أيّ فيلم رسوم متحرّكة كان الأعلى إيراداً في التاريخ سنة 2024؟' and answer = 'قلباً وقالباً 2';
update public.question_overrides set question = 'صاحب الرقم القياسيّ في عدد جوائز الأوسكار، كم جائزةً تنافسيّة (غير فخريّة) فاز بها شخصيّاً؟', answer = '22'
 where question_id = 'ADM3014' and question = 'كم جائزة أوسكار فاز بها والت ديزني شخصيّاً وهو الرقم القياسيّ؟' and answer = '22';
update public.question_overrides set question = 'ما الرمز الذي يُخفيه رسّامو بيكسار في أفلامهم إشارةً إلى قاعة الدراسة في كال آرتس؟', answer = 'A113'
 where question_id = 'ADM2742' and question = 'ما اسم الرقم الذي يُخفيه رسّامو بيكسار في كلّ فيلمٍ إشارةً إلى قاعة الدراسة في كال آرتس؟' and answer = 'A113';
update public.question_overrides set question = 'على قول جمهور الفقهاء، كم عدد التكبيرات في الركعة الأولى من صلاة العيد؟', answer = 'سبع تكبيرات'
 where question_id = 'M676' and question = 'كم عدد التكبيرات في صلاة العيد في الركعة الأولى؟' and answer = 'سبع تكبيرات';
update public.question_overrides set question = 'ما اسم أوّل معركة بحريّة كبرى خاضها المسلمون ضدّ الروم؟', answer = 'ذات الصواري'
 where question_id = 'M267' and question = 'ما اسم أول معركة بحرية خاضها المسلمون؟' and answer = 'ذات الصواري';
update public.question_overrides set question = 'في عهد أيّ خليفةٍ أمويّ نُقّط المصحف نقط الإعجام على يد نصر بن عاصم ويحيى بن يعمر؟', answer = 'عبدالملك بن مروان'
 where question_id = 'H403' and question = 'من الخليفة الذي نقّط المصحف وشكّله في عهده؟' and answer = 'عبدالملك بن مروان';
update public.question_overrides set question = 'ما الذي قتل رينلي باراثيون في خيمته قبل معركته مع أخيه ستانيس؟', answer = 'ظلٌّ أنجبته الكاهنة ميليساندر'
 where question_id = 'ADM5805' and question = 'ما اسم شيطان الظلّ الذي قتل رينلي باراثيون؟' and answer = 'ظلّ ميليساندر';
update public.question_overrides set question = 'ما اسم التنّين الأخضر من تنانين دينيريس الثلاثة؟', answer = 'ريغال'
 where question_id = 'ADM5786' and question = 'ما اسم التنّين الثالث الذي سُمّي على أخي دينيريس؟' and answer = 'ريغال';
update public.question_overrides set question = 'ما المادّة التي تقتل قادة جيش الموتى إلى جانب الفولاذ الفاليري؟', answer = 'زجاج التنّين (الأوبسيديان)'
 where question_id = 'ADM5809' and question = 'ما المادّة التي تقتل جيش الموتى إلى جانب الفولاذ الفاليري؟' and answer = 'زجاج التنّين (الأوبسيديان)';
update public.question_overrides set question = 'من نال جائزة هدّاف مونديال 2010 بعد أن تساوى مع ثلاثة لاعبين بخمسة أهداف؟', answer = 'توماس مولر'
 where question_id = 'ADM3704' and question = 'من هدّاف مونديال 2010؟' and answer = 'توماس مولر';
update public.question_overrides set question = 'أيّ بلدٍ عربيّ كان أوّل من بلغ نهائيات كأس العالم، وذلك سنة 1934؟', answer = 'مصر', level = 'صعب'
 where question_id = 'ADM1950' and question = 'أيّ بلدٍ عربيّ سبق جيرانه إلى النهائيات بستّة وثلاثين عاماً؟' and answer = 'مصر' and level = 'تعجيزي';
update public.question_overrides set question = 'ما الاسم الإيطاليّ لضربة الجزاء الساقطة التي اشتهر بها قائد روما؟', answer = 'الكوكيايو (Il Cucchiaio)'
 where question_id = 'ADM7763' and question = 'ما اسم ضربة الجزاء الساقطة التي اشتهر بها قائد روما ويعني اسمها بالإيطاليّة «الملعقة»؟' and answer = 'الكوكياو';
update public.question_overrides set question = 'ما اسم القصر العثمانيّ في إسطنبول الذي كان مقرّ السلاطين نحو أربعة قرون ويطلّ على البوسفور والقرن الذهبيّ؟', answer = 'قصر توبكابي'
 where question_id = 'ADM1151' and question = 'ما اسم القصر العثمانيّ الشهير في إسطنبول؟' and answer = 'قصر توبكابي';
update public.question_overrides set question = 'ماذا يُسمّى الزخرف النباتيّ المتشابك من أغصانٍ وأوراق في الفنّ الإسلاميّ؟', answer = 'الأرابيسك'
 where question_id = 'ADM1169' and question = 'ماذا يُسمّى الزخرف الهندسيّ المتشابك في العمارة الإسلامية؟' and answer = 'الأرابيسك';
update public.question_overrides set question = '🎈 🎈 🏠 👴 — ما الفيلم؟', answer = 'فوق (Up)'
 where question_id = 'ADM7334' and question = '🎈 🎈 🏠 👴 — ما الفيلم؟' and answer = 'أب (Up)';
update public.question_overrides set question = 'من صاحب الرقم القياسيّ في عدد مباريات الدوري الإنجليزيّ الممتاز، بعد أن تجاوز رقم غاريث باري (653)؟', answer = 'جيمس ميلنر'
 where question_id = 'ADM1761' and question = 'من صاحب الرقم القياسيّ في عدد المباريات باللعبة برصيد يفوق ستّمئة وخمسين؟' and answer = 'غاريث باري';
update public.question_overrides set question = 'من المدافع الأندلسيّ صاحب الرقم 4 الذي حمل شارة قيادة ريال مدريد حتى 2021 ثمّ رحل إلى باريس سان جيرمان؟', answer = 'سيرخيو راموس'
 where question_id = 'ADM9454' and question = 'من المدافع الأندلسيّ صاحب الرقم 4 الذي حمل شارة قيادة ريال مدريد حتى 2021 ثمّ رحل إلى باريس سان جيرمان؟ (عائلة «سيرخيو راموس» مع ADM1818)' and answer = 'سيرخيو راموس';
update public.question_overrides set question = 'ما اسم السيّارة الزرقاء ذات العجلات الثلاث التي يقلبها «مستر بين» دائماً؟', answer = 'ريلاينت ريغال'
 where question_id = 'ADM7442' and question = 'ما اسم السيّارة الزرقاء ذات العجلات الثلاث التي يقلبها «مستر بين» دائماً؟' and answer = 'ريلاينت روبن';
update public.question_overrides set question = 'من اللاعب اليابانيّ الذي تخرّج من أكاديميّة برشلونة ووقّع لريال مدريد ثمّ تألّق في إقليم الباسك؟', answer = 'تاكيفوسا كوبو'
 where question_id = 'ADM7616' and question = 'من اللاعب اليابانيّ الذي تخرّج من أكاديميّة برشلونة ولعب لريال مدريد ثمّ تألّق في إقليم الباسك؟' and answer = 'تاكيفوسا كوبو';
update public.question_overrides set question = 'في أيّ ولايةٍ أمريكيّة تخفّى والتر في الموسم الأخير؟', answer = 'نيوهامبشر'
 where question_id = 'ADM6061' and question = 'ما اسم المدينة/الولاية التي تخفّى فيها والتر في الموسم الأخير؟' and answer = 'نيوهامبشر';
update public.question_overrides set question = 'بأيّ سلاحٍ قتل والتر النازيّين في الحلقة الأخيرة؟', answer = 'رشّاش إم 60 في صندوق السيارة'
 where question_id = 'ADM6069' and question = 'ما اسم جهاز/السلاح الذي قتل به والتر النازيين في الحلقة الأخيرة؟' and answer = 'رشّاش إم 60 في صندوق السيارة';
update public.question_overrides set question = 'ما طراز فورد الخلفيّ الدفع الذي هيمن على الراليات البريطانيّة في السبعينيّات بنسخة RS1800؟', answer = 'فورد إسكورت RS', level = 'صعب'
 where question_id = 'ADM0631' and question = 'ما طراز فورد الذي حمل شارة RS واشتهر في الراليات الأوروبية؟' and answer = 'فورد إسكورت RS' and level = 'متوسط';
update public.question_overrides set question = 'ما آخر طرازٍ لفيراري أقرّه مؤسّسها بنفسه قبل وفاته سنة 1988؟', answer = 'F40 (فيراري F40)', level = 'صعب'
 where question_id = 'ADM0639' and question = 'ما طراز فيراري الذي سمي احتفالاً بمرور أربعين عاماً على الشركة؟' and answer = 'فيراري F40' and level = 'متوسط';
update public.question_overrides set question = 'أيّ علامةٍ أمريكيّة فاخرة تصنع طراز إسكاليد؟', answer = 'كاديلاك'
 where question_id = 'ADM0651' and question = 'ما الشركة الأم لطراز إسكاليد؟' and answer = 'كاديلاك';
update public.question_overrides set question = 'ماذا يعني العلم المربّع بالأبيض والأسود (الشطرنجيّ) في سباقات السيّارات؟', answer = 'نهاية السباق'
 where question_id = 'ADM0598' and question = 'ماذا يعني العلم المتقلب بالأبيض والأسود؟' and answer = 'نهاية السباق';
update public.question_overrides set question = 'أيّ نادٍ فرنسيّ رفع الكأس سنة 1993 فكان أوّل نادٍ من بلاده يحقّقها؟', answer = 'مارسيليا'
 where question_id = 'ADM1843' and question = 'أيّ ناديٍ فرنسيّ رفع الكأس سنة 1993 وهو الوحيد من بلاده؟' and answer = 'مارسيليا';
update public.question_overrides set question = 'من أوّل لاعبٍ سجّل في المسابقة مع ستّة أنديةٍ مختلفة؟', answer = 'زلاتان إبراهيموفيتش'
 where question_id = 'ADM1865' and question = 'من اللاعب الذي شارك في المسابقة مع سبعة أنديةٍ مختلفة؟' and answer = 'زلاتان إبراهيموفيتش';
update public.question_overrides set question = 'أيّ فريقٍ إنجليزيّ نال سنةً إضافيّة من الحرمان الأوروبيّ فوق بقيّة الأندية الإنجليزيّة بعد كارثة هيسل؟', answer = 'ليفربول'
 where question_id = 'ADM1863' and question = 'أيّ فريقٍ إنجليزيّ عوقب بالحرمان الأوروبيّ بعد كارثة هيسل؟' and answer = 'ليفربول';
update public.question_overrides set question = 'أيّ ناديين يتقاسمان ملعب «سان سيرو»؟', answer = 'ميلان والإنتر'
 where question_id = 'ADM2198' and question = 'أيّ ناديين يتقاسمان ملعب «سان سيرو» في ميلانو؟' and answer = 'ميلان والإنتر';
update public.question_overrides set question = 'ماذا يحتفظ ديكستر به من كلّ ضحية كتذكار؟', answer = 'قطرة من دمها على شريحة زجاجيّة'
 where question_id = 'ADM5863' and question = 'ماذا يحتفظ ديكستر به من كلّ ضحية كتذكار؟' and answer = 'شريحة دم على شريحة زجاجية';
update public.question_overrides set question = 'ما الدواء الذي كان ماهون مدمناً عليه؟', answer = 'فيراتريل (وقيل ميدازولام)'
 where question_id = 'ADM7116' and question = 'ما الدواء الذي كان ماهون مدمناً عليه؟' and answer = 'فيراتريل';
update public.question_overrides set question = 'لماذا قُطعت يد تي باغ بعد الهروب؟', answer = 'لأنّه قيّد يده بيد مايكل بالأصفاد'
 where question_id = 'ADM7089' and question = 'لماذا قُطعت يد تي باغ بعد الهروب؟' and answer = 'لأنّه قيّد نفسه بالأصفاد إليهم';
update public.question_overrides set question = 'من لاعب وسط بايرن الذي رفع كأس العالم 2014 ودوري أبطال أوروبا 2013 ثمّ رحل إلى مانشستر يونايتد 2015؟', answer = 'باستيان شفاينشتايغر'
 where question_id = 'ADM7793' and question = 'من لاعب وسط بايرن الملقّب «شفايني»؟' and answer = 'باستيان شفاينشتايغر';
update public.question_overrides set question = 'أيّ ناديٍ من الشمال يلعب بالأخضر والأبيض ويخوض «ديربي الشمال» أمام هامبورغ؟', answer = 'فيردر بريمن'
 where question_id = 'ADM7842' and question = 'أيّ ناديٍ من الشمال يلعب بالأخضر والأبيض وفاز بالثنائيّة سنة 2004؟' and answer = 'فيردر بريمن';

-- ── ٤. بدائل للخلايا التي تنزل تحت 30 — مسوّداتٌ بانتظار اعتماد علي (دفعة 874ceba9) ──
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'حذّرت الجنّيّة العرّابة سندريلا أن تعود من الحفل قبل موعدٍ محدّد وإلّا زال السحر — متى؟', 'منتصف الليل (الساعة 12)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «سندريلا»، إلى ماذا حوّلت الجنّيّة العرّابة ثمرة اليقطين؟', 'عربة (حنطور)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «بياض الثلج»، ماذا كانت الملكة الشرّيرة تسأل كلّ يوم: من الأجمل في البلاد؟', 'المرآة السحريّة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «بينوكيو»، ما الحشرة الصغيرة التي جعلتها الجنّيّة الزرقاء ضميراً للدمية الخشبيّة ترشدها؟', 'صرصار الليل (جيميني كريكت)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «حكاية لعبة»، ما اسم الديناصور الأخضر اللعبة الخوّاف؟', 'ريكس');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «شركة المرعبين المحدودة»، ماذا تولّد الوحوش من صراخ الأطفال لتشغيل مدينتها؟', 'الطاقة (الكهرباء)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «حكاية لعبة»، ما اسم اللعبة البلاستيكيّة التي تُفكّ عيناها وأذناها وشاربها وتُركَّب من جديد؟', 'السيّد رأس البطاطس (مستر بوتيتو هيد)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «علاء الدين»، كم أمنيةً يحقّقها الجنّيّ لمن يفرك المصباح؟', 'ثلاث أمنيات');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'في «الأسد الملك»، ما اسم عمّ سيمبا الشرّير الذي غدر بأخيه الملك واستولى على العرش؟', 'سكار');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'ما اسم النمر المخطّط الذي يقفز على ذيله كالزنبرك في غابة المئة فدّان؟', 'تيغر (تيكر)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'ما اسم فيلم بيكسار عن عائلةٍ لكلّ فردٍ فيها قوّةٌ عجيبة — الأب قويّ والأمّ تتمطّط والابن سريع — يخفون قواهم ليعيشوا حياةً عاديّة؟', 'الخارقون (The Incredibles)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ديزني وبيكسار', 'سهل', 'ما معنى عبارة «هاكونا ماتاتا» التي يغنّيها أصدقاء سيمبا؟', 'لا تقلق (لا هموم)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'قصص الأنبياء', 'سهل', 'من النبيّ الذي أُلقي في النار فقال الله «يا نار كوني برداً وسلاماً»؟', 'إبراهيم عليه السلام');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'قصص الأنبياء', 'سهل', 'من الذي أبى أن يسجد لآدم عليه السلام واستكبر فطُرد من الجنّة؟', 'إبليس');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أكلات', 'تعجيزي', 'ما اسم الصلصة الصفراء من صفار البيض والزبدة والليمون التي تُسكب على «بيض بنديكت»؟', 'الهولنديز');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أحياء وفلك', 'تعجيزي', 'ما اسم الفجوة الكبرى المظلمة التي تفصل حلقتين رئيسيّتين من حلقات زحل؟', 'فجوة كاسيني (قسمة كاسيني)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أغاني وطرب', 'تعجيزي', 'ما اسم القصر في مدينة ممفيس الذي عاش فيه «ملك الروك آند رول» ودُفن في حديقته؟', 'غريسلاند');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الدوري الإنجليزي', 'تعجيزي', 'باسم أيّ منطقةٍ يُعرف مركز تدريب مانشستر يونايتد الذي انتقل إليه الفريق سنة 2000؟', 'كارينغتون');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أدب وفنون', 'تعجيزي', 'ما الاسم الآخر للوحة دافنشي الأشهر في إيطاليا وفرنسا، نسبةً إلى عائلة زوج المرأة المرسومة فيها؟', 'الجوكوندا (La Gioconda)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'ما اسم ناطحة السحاب في دبي التي تُعدّ أطول بناءٍ في العالم؟', 'برج خليفة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'أيّ دولةٍ أهدت تمثال الحرّيّة إلى الولايات المتّحدة؟', 'فرنسا');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'ما اسم القلعة التاريخيّة في قلب موسكو التي صارت مقرّ الرئاسة الروسيّة؟', 'الكرملين');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'ما اسم الساحة الشهيرة في نيويورك المليئة بالشاشات الإعلانيّة المضيئة، وتُقام فيها احتفالات رأس السنة؟', 'تايمز سكوير');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'ما اسم العجلة الدوّارة العملاقة على ضفّة نهرٍ في لندن، يركبها السيّاح ليروا المدينة من فوق؟', 'عين لندن (لندن آي)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'ما اسم الجزيرة الصخريّة في خليج سان فرانسيسكو التي كانت سجناً فدراليّاً شديد الحراسة سُجن فيه آل كابوني؟', 'ألكاتراز');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'معالم', 'سهل', 'ما اسم القصر الفرنسيّ الفخم قرب باريس الذي انتقل إليه البلاط الملكيّ وفيه «قاعة المرايا»؟', 'قصر فرساي');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'إسلامي', 'سهل', 'كم عدد سور القرآن الكريم؟', '114 سورة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'إسلامي', 'سهل', 'ماذا يقول المسلم إذا أصابته مصيبة أو بلغه خبر وفاة؟', 'إنّا لله وإنّا إليه راجعون');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'إسلامي', 'سهل', 'كم تكبيرةً في صلاة الجنازة؟', 'أربع تكبيرات');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'علوم واختراعات', 'سهل', 'ما اسم الأخوين الأمريكيّين اللذين طارا بأوّل طائرةٍ ذات محرّك سنة 1903؟', 'الأخوان رايت');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'علوم واختراعات', 'سهل', 'ما الأداة التي عرفها الصينيّون قديماً وصار البحّارة يهتدون بها في البحر، بإبرةٍ ممغنطة تتّجه إلى الشمال؟', 'البوصلة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الدوري الإنجليزي', 'سهل', 'ما النشيد الشهير الذي تردّده الجماهير في «أنفيلد» قبل كلّ مباراة؟', 'لن تسير وحدك أبداً (You''ll Never Walk Alone)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الدوري الإنجليزي', 'سهل', 'على أيّ ملعبٍ يلعب نيوكاسل يونايتد مبارياته على أرضه؟', 'سانت جيمس بارك');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الزمن الجميل', 'تعجيزي', 'في «ريمي»، ما اسم العجوز صاحب الفرقة الجوّالة الذي أخذ ريمي معه ليغنّي مع الكلاب والقرد؟', 'فيتاليس');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أدب وفنون', 'سهل', 'ما اسم الخطّ العربيّ البسيط السريع الذي يكتب به أكثر الناس في حياتهم اليوميّة؟', 'خطّ الرقعة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الكويت', 'تعجيزي', 'ما اسم السفينة الخشبيّة العملاقة على شاطئ الكويت التي سجّلتها غينيس أكبرَ سفينةٍ عربيّة خشبيّة في العالم، ولم تُبحر قطّ؟', 'الهاشمي 2');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'سيارات', 'تعجيزي', 'ما اسم تمثال القطّ القافز الذي كان يزيّن مقدّمة سيّارات جاكوار؟', 'ذا ليبر (The Leaper)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الزمن الجميل', 'سهل', 'ما اسم الدمية المحجّبة بالعباءة التي صارت «باربي البنات» عندنا وانتشر اسمها على العلك والدراجات والحبوب؟', 'فلّة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الزمن الجميل', 'سهل', 'ما اسم الجرذ المعلّم الذي ربّى أربع سلاحف في مجاري نيويورك ودرّبها على القتال؟', 'سبلنتر');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الزمن الجميل', 'سهل', 'ما اسم الفتى الكسول الضعيف في دراسته الذي جاءه قطٌّ آليٌّ من المستقبل ليساعده؟', 'نوبيتا');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أغاني وطرب', 'سهل', 'من المطرب الإماراتيّ صاحب أغنية «بشرة خير» التي رقصت عليها مصر كلّها؟', 'حسين الجسمي');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أغاني وطرب', 'سهل', 'من المطربة اللبنانيّة صاحبة «آه ونص» و«أخاصمك آه»؟', 'نانسي عجرم');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أغاني وطرب', 'سهل', 'أيّ مطربةٍ إماراتيّة يلقّبها جمهورها «الملكة»؟', 'أحلام');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'سهل', 'ماذا كان ناصر يستعدّ له حين قُتل رفاعي؟', 'خطوبته على شهد');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'سهل', 'بعد مقتل رفاعي، ماذا أعلنت الحاجة توحة أنّها تريد؟', 'الثأر له');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'سهل', 'شبّه الناس ساخرين مشية رفاعي الثقيلة بمشية أيّ شخصيّةٍ عالميّة؟', 'فرانكشتاين');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'تاريخ وحضارات', 'سهل', 'ما اسم القاعدة البحريّة الأمريكيّة في المحيط الهادئ التي هاجمتها اليابان فجأةً سنة 1941 فدخلت أمريكا الحرب العالميّة الثانية؟', 'بيرل هاربر');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'تاريخ وحضارات', 'سهل', 'من الزعيم الإيطاليّ الفاشيّ الذي تحالف مع هتلر في الحرب العالميّة الثانية؟', 'موسوليني');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'علوم واختراعات', 'تعجيزي', 'ما الاسم العلميّ للرائحة الطيّبة التي تفوح من الأرض أوّل ما ينزل المطر؟', 'البتريكور (Petrichor)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'علوم واختراعات', 'تعجيزي', 'ما اسم الغطاء البلاستيكيّ الصغير في طرف رباط الحذاء الذي يمنعه من التنسّل؟', 'الأغليت (Aglet)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'Prison break', 'سهل', 'ما الذي فكّه مايكل في زنزانته ليصل من خلفه إلى الجدار الذي حفره للهروب؟', 'المرحاض (التواليت)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'Prison break', 'سهل', 'أين انتهى المطاف بتي باغ في ختام المسلسل؟', 'عاد سجيناً في فوكس ريفر');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'طب وصحة', 'سهل', 'ما اسم المرض العصبيّ الذي تصيب صاحبه نوباتُ تشنّجٍ متكرّرة وقد يفقد وعيه فيها؟', 'الصرع');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'قصص الأنبياء', 'تعجيزي', 'ما اسم كلب أصحاب الكهف في الرواية المشهورة عن ابن عبّاس؟', 'قطمير');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'Prison break', 'متوسط', 'حين وجدت سارة أباها ميّتاً في بيته، على أيّ هيئةٍ صُوِّرت وفاته؟', 'انتحار (وهي في الحقيقة قتلٌ دبّرته الشركة)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أحياء وفلك', 'سهل', 'ما أسرع حيوانٍ برّيٍّ على وجه الأرض؟', 'الفهد (الفهد الصيّاد)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أحياء وفلك', 'سهل', 'ما الزاحف الذي يغيّر لون جلده ليتخفّى، وتدور كلّ عينٍ من عينيه وحدها؟', 'الحرباء');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'أحياء وفلك', 'سهل', 'ما الحيوان الصغير الذي يتكوّر على نفسه كرةً من الأشواك حين يشعر بالخطر؟', 'القنفذ');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الكويت', 'سهل', 'ما اسم المنطقة الزراعيّة في أقصى جنوب الكويت المشهورة بمزارعها وإسطبلات الخيل العربيّة؟', 'الوفرة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الكويت', 'سهل', 'ما اسم الحافّة الصخريّة الطويلة المطلّة على جون الكويت من شماله، الممتدّة من المطلاع إلى البحرة؟', 'جال الزور');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الكويت', 'سهل', 'ما السمكة الفضّيّة المفلطحة التي يلقّبها الكويتيّون «ملك الأسماك» ويتسابقون عليها في موسمها؟', 'الزبيدي');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'تعجيزي', 'ما اسم شريك رفاعي في تجارة السلاح الذي عاتبه رفاعي لأنّه لم يفِ بوعده بتوصيةٍ لناصر؟', 'نضال (نضال نجم)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'تعجيزي', 'ما المشروع الذي عرض ناصر على طارق أن يموّله له بلا فوائد؟', 'بناء عمارة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'تعجيزي', 'بكم سنةٍ حكمت المحكمة على ناصر وعمّه مختار وخاله زكريا بعد مداهمة ورشة السلاح؟', '15 سنة');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'الأسطورة', 'صعب', 'بعد أن عرفت الحاجة توحة أنّ لجميلة ابنةً من زكريا أخي توحة المسجون، أين قرّرت أن تسكن جميلة؟', 'في بيت الحاجة توحة (معها)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'تاريخ وحضارات', 'تعجيزي', 'ما اسم الحصان العربيّ الرماديّ الذي حمل نابليون في معاركه، وسُمّي باسم أحد انتصاراته في إيطاليا؟', 'مارينغو');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'تاريخ وحضارات', 'تعجيزي', 'ما الاسم الرمزيّ لحملة الحلفاء لتحرير غرب أوروبا في الحرب العالميّة الثانية، التي افتُتحت بإنزال نورماندي؟', 'عمليّة أوفرلورد (Overlord)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'تقنية ومنوعات', 'سهل', 'ما التطبيق الذي شعاره شبحٌ أبيض على خلفيّةٍ صفراء؟', 'سناب شات');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'تقنية ومنوعات', 'سهل', 'ما الشركة الكوريّة الجنوبيّة التي تصنع هواتف «غالاكسي»؟', 'سامسونغ');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'Breaking bad', 'متوسط', 'ما اللون الذي تعشقه زوجة هانك ويطغى على ملابسها وأثاث بيتها؟', 'البنفسجيّ');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'Breaking bad', 'متوسط', 'ما الوظيفة التي عادت إليها سكايلر في الموسم الثاني عند رئيسها القديم لتعين البيت على مصاريف علاج والتر؟', 'محاسبة (مسك الدفاتر)');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'السيرة النبوية', 'سهل', 'ما اسم الدابّة التي ركبها النبيّ صلى الله عليه وسلم في رحلة الإسراء من مكّة إلى بيت المقدس؟', 'البُراق');
insert into public.question_drafts (batch, source, category, level, question, answer)
values ('874ceba9-2ee3-444f-9b74-ddaee5dd0f43', 'claude', 'ألعاب فيديو', 'تعجيزي', 'ما الاسم الذي حمله ماريو في أوّل لعبةٍ ظهر فيها، قبل أن يُسمّى ماريو؟', 'جمب مان (Jumpman)');

