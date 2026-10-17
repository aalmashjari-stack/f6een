-- مراجعة «صعب» ١٧ أكتوبر ٢٠٢٦ (طلب علي: «مراجعة شاملة للأسئلة الصعبة، وإذا فيه أسئلة صعبة جدّاً استبعدها»).
-- 2361 سؤالاً «صعب» ظاهراً من نسخة 2026-10-17T13-11-33؛ مراجعٌ لكلّ دفعة ثمّ محقّقان مستقلّان، والاستبعاد باتّفاقهما (203).
-- الاستبعاد نقلٌ إلى «تعجيزي»: خرج من اللوح في ١٧ أكتوبر (PR #306) فلا يُلعب، والسؤال باقٍ في البنك واللوحة ويعود بتغيير مستواه.
-- لا تنزل فئةٌ تحت 30 سؤالاً «صعب»: 56 مؤجّلةً حتى تُكتب بدائلها، فلا تظهر هنا.
-- كلّ سطرٍ مشروطٌ بأنّ السؤال ما زال «صعب» بنصّه نفسه — ما عدّله علي بعد النسخة لا يُمسّ.

-- Breaking bad: شخصيّة ثانويّة جدّاً (رئيس هانك) لا يتذكّر اسمها المتابع العاديّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6056' and level = 'صعب' and question = 'ما اسم رئيس هانك في مكافحة المخدّرات؟';
-- Breaking bad: اسم رحلة الطائرة تفصيلة حبكة دقيقة لا يتذكّرها إلّا من أعاد المشاهدة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6064' and level = 'صعب' and question = 'ما اسم طائرة الركّاب التي تحطّمت فوق ألباكركي بسبب والد جين؟';
-- Breaking bad: سكرتيرة سول شخصيّة ثانويّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6981' and level = 'صعب' and question = 'ما اسم سكرتيرة سول غودمان؟';
-- Dexter: اسم الرواية الأصليّة بالإنجليزيّة لا يعرفه إلّا قارئ الروايات
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5898' and level = 'صعب' and question = 'ما اسم الرواية التي اقتُبس منها المسلسل؟';
-- Prison break: مصطلح نفسيّ أكاديميّ (انخفاض التثبيط الكامن) لا يُعرف من الحياة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5957' and level = 'صعب' and question = 'ما الحالة النفسية التي تفسّر ذكاء مايكل وتعاطفه المفرط؟';
-- Prison break: اسم قاتل مأجور ثانويّ في خلفيّة ماهون
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5976' and level = 'صعب' and question = 'ما اسم القاتل المأجور الذي قتل ابن ماهون؟';
-- Prison break: اسم ابنة شخصيّة ثانويّة، تفصيلة لا يتذكّرها إلّا من أعاد المشاهدة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5985' and level = 'صعب' and question = 'ما اسم ابنة سي نوت؟';
-- Prison break: اسم زوجة سي نوت، شخصيّة ثانويّة جدّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7104' and level = 'صعب' and question = 'ما اسم زوجة سي نوت؟';
-- The Sopranos: عدد دقيق للحلقات (86) لا يُستنتج ولا يحفظه حتّى المتابع
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8408' and level = 'صعب' and question = 'كم حلقةً عُرضت من المسلسل كلّه؟';
-- أدب وفنون: الرواية مشهورة (هايدي) لكنّ اسم المؤلّفة الأجنبي مجهول وصعب
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1264' and level = 'صعب' and question = 'من مؤلّفة رواية الفتاة التي عاشت في جبال الألب؟';
-- أدب وفنون: العمل معروف كرتوناً لكنّ اسم المؤلّفة الأجنبي مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1265' and level = 'صعب' and question = 'من مؤلّفة رواية «آن في المرتفعات الخضراء»؟';
-- أدب وفنون: اسم ياباني صعب النطق وغير متداول عربيّاً، والرواية مجهولة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H459' and level = 'صعب' and question = 'ما اسم الأديب الياباني الحائز نوبل عن رواية «البلد الثلجي»؟';
-- أدب وفنون: شاعر سوداني غير معروف خارج المختصّين، والقصيدة لا يعرفها جمهور المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'M733' and level = 'صعب' and question = 'ما اسم الشاعر السوداني الذي كتب «عودة سنّار»؟';
-- أغاني وطرب: اسم مستعار لشاعر قديم؛ لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0825' and level = 'صعب' and question = 'ما الاسم المستعار الذي وقّع به عبد الله الفرج شعره؟';
-- أغاني وطرب: مصطلح التصفيق في فنّ الصوت؛ اختصاصيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0828' and level = 'صعب' and question = 'ما اسم التصفيق المنتظم الذي يصاحب أداء فن الصوت؟';
-- أغاني وطرب: عدد نبضات إيقاع؛ رقم دقيق لا يعرفه إلّا الموسيقيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0829' and level = 'صعب' and question = 'كم نبضة في إيقاع «الصوت العربي»؟';
-- أغاني وطرب: عدد نبضات إيقاع؛ رقم دقيق اختصاصيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0830' and level = 'صعب' and question = 'كم نبضة في إيقاع «الصوت الشامي»؟';
-- أغاني وطرب: اسم معهد زرياب؛ معلومة كتب تاريخ الموسيقى لا يعرفها المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0836' and level = 'صعب' and question = 'ما اسم المعهد الذي أسّسه زرياب لتعليم الموسيقى في الأندلس؟';
-- أغاني وطرب: اسم فيلم قديم 1941؛ لا يتذكّره إلّا المؤرّخ السينمائيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0842' and level = 'صعب' and question = 'ما اسم الفيلم الذي جمع أسمهان بشقيقها فريد الأطرش سنة 1941؟';
-- أغاني وطرب: اسم قطعة دقيقة في العود؛ لا يعرفه إلّا صانع العود أو العازف
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0844' and level = 'صعب' and question = 'ما اسم العظمة الصغيرة التي تُثبَّت في أعلى زند العود لرفع الأوتار؟';
-- أغاني وطرب: تلاميذ عبد الله الفرج؛ أسماء مجهولة خلف شخصيّة قديمة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0848' and level = 'صعب' and question = 'من المطربان الكويتيان الأخوان اللذان تعلّما على يد عبد الله الفرج؟';
-- أغاني وطرب: اسم أوّل أغنية بسنة محدّدة؛ تفصيلة أرشيفيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0849' and level = 'صعب' and question = 'ما اسم أوّل أغنية اشتُهر بها ناظم الغزالي سنة 1948؟';
-- أغاني وطرب: اسم والد فريد وأسمهان؛ الاسم خلف المشهور مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0851' and level = 'صعب' and question = 'ما اسم والد فريد الأطرش وأسمهان وكان أميراً في جبل العرب؟';
-- أغاني وطرب: سنة وفاة دقيقة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0853' and level = 'صعب' and question = 'في أيّ سنة توفّي المطرب عبد اللطيف الكويتي؟';
-- أغاني وطرب: سنة وفاة دقيقة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0857' and level = 'صعب' and question = 'في أيّ سنة رحل الشاعر والموسيقي الكويتي عبد الله الفرج؟';
-- أغاني وطرب: تصنيف أنواع الصوت؛ مصطلح موسيقيّ اختصاصيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0860' and level = 'صعب' and question = 'ما اسم النوع الثالث من الصوت إلى جانب العربي والشامي؟';
-- أغاني وطرب: عدد نبضات إيقاع؛ رقم دقيق اختصاصيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0861' and level = 'صعب' and question = 'كم نبضة في إيقاع «الصوت الخيالي»؟';
-- أغاني وطرب: اسم أوّل أوبريت بسنة محدّدة؛ تفصيلة لا يتذكّرها إلّا المؤرّخ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0862' and level = 'صعب' and question = 'ما اسم أوّل أوبريت وطني كتبه بدر بن عبد المحسن سنة 1990؟';
-- أغاني وطرب: اسم برنامج إذاعيّ سنة 1960؛ تفصيلة أرشيفيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0864' and level = 'صعب' and question = 'ما اسم البرنامج الإذاعي الذي ظهر فيه محمد عبده أوّل مرّة سنة 1960؟';
-- أغاني وطرب: ملحّن أوّل أغنية؛ الاسم خلف الشيء مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0865' and level = 'صعب' and question = 'من صاحب لحن أوّل أغنية سجّلها محمد عبده؟';
-- أغاني وطرب: سنة وفاة دقيقة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0866' and level = 'صعب' and question = 'في أيّ سنة توفّي الملحّن البحريني محمد بن فارس؟';
-- أكلات: اسم القدر الحجريّ اليمنيّ تفصيلة لا يعرفها إلّا أهل المطبخ اليمنيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0219' and level = 'صعب' and question = 'ما اسم القدر الحجري الذي يُطهى ويُقدّم فيه طبق الفحسة؟';
-- أكلات: أكلة أردنيّة محلّية نادرة الذكر خارج الأردن
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0235' and level = 'صعب' and question = 'ما اسم الأكلة الأردنية من القمح واللبن المجفف المطهوة بقوام كثيف؟';
-- أكلات: اسم سودانيّ محلّي لمسحوق الفول السودانيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0241' and level = 'صعب' and question = 'ما اسم مسحوق الفول السوداني المطحون الذي يدخل في سلطات السودان؟';
-- أكلات: طبق سودانيّ محلّي لا يُعرف في المجلس الخليجيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0243' and level = 'صعب' and question = 'ما اسم طبق لحم سوداني يُجفف ثم يُفتت ويُحفظ؟';
-- أكلات: حساء مغربيّ محلّي الاسم لا طريق للتخمين إليه
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0246' and level = 'صعب' and question = 'ما اسم الحساء المغربي الصباحي المصنوع من الذرة أو الشعير؟';
-- أكلات: اسم عجينة جزائريّة محلّية غير متداولة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0251' and level = 'صعب' and question = 'ما اسم العجينة الجزائرية المصنوعة من السميد والمقطعة حبّات صغيرة يدوياً؟';
-- أكلات: اسم مسحوق سمك محلّي في جربة لا يعرفه إلّا المختصّ بالمطبخ التونسيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0253' and level = 'صعب' and question = 'ما اسم مسحوق السمك المجفف المتبل المستخدم في بعض أطباق جربة؟';
-- أكلات: طبق تونسيّ محلّي نادر
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0254' and level = 'صعب' and question = 'ما اسم الطبق التونسيّ من دقيق الشعير المحمّص يُعجن بزيت الزيتون والسكر؟';
-- أكلات: اسم أجنبيّ صعب غير متداول عربيّاً لطبق موريتانيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0257' and level = 'صعب' and question = 'ما اسم طبق موريتاني من الأرز والسمك والخضار متأثر بمطبخ غرب أفريقيا؟';
-- أكلات: مصطلح إسبانيّ لا يعرفه إلّا الطاهي المتخصّص
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0281' and level = 'صعب' and question = 'ما الأرز المقرمش الملتصق بقاع مقلاة الباييّا؟';
-- أكلات: اسم صينيّ لفول صويا مخمّر لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0288' and level = 'صعب' and question = 'ما اسم فول الصويا الأسود المخمّر المملّح المستعمل في الطبخ الصينيّ؟';
-- أكلات: اسم معجون إندونيسيّ أجنبيّ غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0296' and level = 'صعب' and question = 'ما اسم معجون الروبيان المخمّر المستخدم في السامبال؟';
-- أكلات: اسم فلفل بيروفيّ أجنبيّ صعب النطق
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0300' and level = 'صعب' and question = 'ما الفلفل الأصفر الذي يميز كثيراً من الأطباق البيروفية؟';
-- أكلات: اسم زيت برازيليّ محلّي لا يُعرف في المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0301' and level = 'صعب' and question = 'ما اسم زيت النخيل الأحمر المستخدم في مطبخ باهيا؟';
-- أكلات: اسم أمهريّ صعب لزبدة إثيوبيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0302' and level = 'صعب' and question = 'ما اسم الزبدة المتبلة المستخدمة في الطبخ الإثيوبي؟';
-- أكلات: اسم جورجيّ صعب النطق لخليط توابل
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0303' and level = 'صعب' and question = 'ما خليط التوابل الجورجي الذي يدخل في يخنات وأطباق لحم كثيرة؟';
-- ألعاب فيديو: أسماء المؤسّسين خلف شركة مشهورة؛ لا يعرفها إلّا المتابع الدقيق لصناعة الألعاب
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3150' and level = 'صعب' and question = 'ما اسم الأخوين المؤسّسين لروكستار غيمز؟';
-- أمثال وألغاز: مثل محلّيّ مغمور نادر التداول، ولا قرينة في شطره الأوّل تقود إلى تكملته
update public.question_overrides set level = 'تعجيزي' where question_id = 'PA147' and level = 'صعب' and question = 'شاق القاع…';
-- أنمي: مؤلّف مانغا «الكابتن ماجد»: العمل مشهور ومؤلّفه الياباني لا يعرفه إلّا المهووس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1249' and level = 'صعب' and question = 'من مؤلّف المانغا الأصليّة لـ«الكابتن ماجد»؟';
-- أنمي: مبتكر «بوكيمون»: الشيء مشهور والاسم خلفه (ساتوشي تاجيري) مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1268' and level = 'صعب' and question = 'من ابتكر «بوكيمون»؟';
-- الدوري الألماني: لقبٌ ألمانيّ محلّيّ «بطل القلوب» غير متداول عربيّاً ولا طريق لاستنتاجه
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7853' and level = 'صعب' and question = 'بأيّ لقبٍ عُرف شالكه بعد أن ضاع منه لقب 2001 في الدقيقة الأخيرة؟';
-- الدوري الإيطالي: رقم نقاط دقيق لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7739' and level = 'صعب' and question = 'كم نقطةً جمع يوفنتوس في موسم 2013-2014 القياسيّ؟';
-- السيرة النبوية: اسم اليهوديّة صاحبة السمّ اسم مجهول خلف حادثة مشهورة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM2000' and level = 'صعب' and question = 'ما اسم اليهوديّة التي وضعت السمّ للنبيّ صلى الله عليه وسلم في خيبر؟';
-- السيرة النبوية: اسم بئر في تفصيلة جانبيّة، لا يعرفه إلّا المختصّ ولا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4176' and level = 'صعب' and question = 'ما اسم البئر التي سقط فيها خاتم النبي ﷺ من يد عثمان؟';
-- الصحابة والتابعون: المسجد في الصورة لا يُعرف بالنظر، والجواب (إريتريا) يعاكس القرينة الظاهرة (الحبشة)، فالتشاور يقود إلى الخطأ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3233' and level = 'صعب' and question = 'في أيّ بلدٍ إفريقيّ يقع هذا المسجد الذي يُقال إنّه أوّل مسجدٍ بناه مهاجرو الحبشة؟';
-- الصحابة والتابعون: تابعيّ كوفيّ غير مشهور خارج كتب التراجم، والعبارة لا تفتح طريقاً للتخمين
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3250' and level = 'صعب' and question = 'من التابعيّ الكوفيّ الذي قال له ابن مسعود: «لو رآك رسول الله ﷺ لأحبّك»؟';
-- الفقه والعبادات: تحويل القلّتين إلى لترات رقمٌ تقريبيّ لا يعرفه إلّا المختصّ ولا يُستنتج بالتشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3380' and level = 'صعب' and question = 'كم مقدار القُلّتين اللتين لا يحمل الماء فوقهما الخبث بالتقريب؟';
-- الكويت: سنة تأسيس دقيقة (1954) لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'H453' and level = 'صعب' and question = 'في أي عام أُنشئت شركة الخطوط الجوية الكويتية؟';
-- تاريخ وحضارات: اسم مدينة أجنبيّ صعب غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1414' and level = 'صعب' and question = 'أيّ مدينةٍ دُفنت مع بومبي تحت رماد فيزوف؟';
-- تاريخ وحضارات: عدد سفن دقيق لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1415' and level = 'صعب' and question = 'بكم سفينةً بدأ ماجلان رحلته حول العالم؟';
-- تاريخ وحضارات: عدد دقيق (أحد عشر جيشاً) لا يُستنتج بالتشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5160' and level = 'صعب' and question = 'كم جيشاً جهّز أبو بكر لحرب المرتدّين؟';
-- تاريخ وحضارات: اسم أوّل رئيس وزراء بريطانيّ غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5218' and level = 'صعب' and question = 'من يُعدّ أوّل رئيس وزراء في تاريخ بريطانيا؟';
-- تاريخ وحضارات: اسم أجنبيّ صعب النطق وغير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5225' and level = 'صعب' and question = 'من السريلانكية التي كانت أوّل رئيسة وزراء في العالم سنة 1960؟';
-- تاريخ وحضارات: اسم روماني قديم غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5255' and level = 'صعب' and question = 'ما الاسم الروماني القديم لاسكتلندا؟';
-- تاريخ وحضارات: مدّة حكم بالسنين لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5298' and level = 'صعب' and question = 'كم سنة حكم الحجّاج بن يوسف العراق تقريباً؟';
-- تاريخ وحضارات: زواج قطر الندى من المعتضد تفصيلة تاريخيّة للمختصّ وحده
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5318' and level = 'صعب' and question = 'من الخليفة العباسي الذي تزوّج قطر الندى بنت خمارويه؟';
-- تاريخ وحضارات: موضع دفن خليفة تفصيلة لا يعرفها إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5324' and level = 'صعب' and question = 'أين دُفن الخليفة أبو جعفر المنصور؟';
-- تاريخ وحضارات: شخصيّة فايكنغ غير معروفة في المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5347' and level = 'صعب' and question = 'من الفايكنغ الذي استوطن غرينلاند وأعطاها اسمها «الأرض الخضراء»؟';
-- تاريخ وحضارات: اسم بحّار برتغاليّ غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5348' and level = 'صعب' and question = 'من البحّار البرتغالي الذي وصل إلى البرازيل سنة 1500؟';
-- تاريخ وحضارات: مستكشف أجنبيّ غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5350' and level = 'صعب' and question = 'من المستكشف الأمريكي الذي يُنسب إليه أوّل وصول إلى القطب الشمالي سنة 1909؟';
-- تاريخ وحضارات: اسم يونانيّ صعب غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'H001' and level = 'صعب' and question = 'من أول من قاس محيط الأرض؟';
-- تاريخ وحضارات: اسم معاهدة بيزنطيّة فارسيّة لا يعرفها إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'H323' and level = 'صعب' and question = 'ما اسم المعاهدة التي عقدها الإمبراطور جستنيان مع كسرى أنوشروان سنة 532؟';
-- تاريخ وحضارات: أسرة صينيّة باسم غير متداول ولا طريق للتشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'H394' and level = 'صعب' and question = 'ما اسم الأسرة التي حكمت الصين أطول فترة؟';
-- تقنية ومنوعات: صاحب مصطلح الذكاء الاصطناعيّ: اسم أجنبيّ خلف مفهوم مشهور
update public.question_overrides set level = 'تعجيزي' where question_id = 'H141' and level = 'صعب' and question = 'من صاغ مصطلح الذكاء الاصطناعي؟';
-- تقنية ومنوعات: اسم هولنديّ صعب النطق لا يعرفه إلّا المبرمجون
update public.question_overrides set level = 'تعجيزي' where question_id = 'H227' and level = 'صعب' and question = 'من المبرمج الهولنديّ الذي ابتكر لغة البرمجة الأشهر بين المبتدئين؟';
-- تقنية ومنوعات: اسم قمر صناعيّ تاريخيّ لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'H354' and level = 'صعب' and question = 'ما اسم القمر الصناعيّ الذي نقل أوّل بثٍّ تلفزيونيٍّ مباشر عبر الأطلسي سنة 1962؟';
-- تقنية ومنوعات: اسم دودة حاسوبيّة سنة 1988 لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'H439' and level = 'صعب' and question = 'ما اسم الدودة الحاسوبيّة التي شلّت جزءاً كبيراً من الإنترنت سنة 1988؟';
-- تقنية ومنوعات: أصل قاعدة بيانات وخلفها «إنغرس»: تخصّص برمجيّ بحت
update public.question_overrides set level = 'تعجيزي' where question_id = 'H443' and level = 'صعب' and question = 'ما قاعدة البيانات العلائقيّة مفتوحة المصدر التي خرجت من جامعة بيركلي خلفاً لمشروع «إنغرس»؟';
-- تقنية ومنوعات: أوّل محرّك بحث «آرتشي» معلومة مهووسين بتاريخ الحوسبة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H445' and level = 'صعب' and question = 'ما اسم أول محرك بحث ظهر على الإنترنت قبل جوجل بسنوات؟';
-- جغرافيا ومعالم: نهر سيفرن غير متداول، والمجلس سيجيب التايمز
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5086' and level = 'صعب' and question = 'أيّ نهر هو الأطول في بريطانيا؟';
-- جغرافيا ومعالم: اسم إداريّ استعماريّ دقيق لفترة قصيرة لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5136' and level = 'صعب' and question = 'بأيّ اسمٍ عُرفت الدولة العربيّة المطلّة على باب المندب في آخر عشر سنواتٍ من الاستعمار الفرنسيّ (1967–1977)؟';
-- جغرافيا ومعالم: اسم رومانيّ قديم أجنبيّ غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5150' and level = 'صعب' and question = 'ما الاسم الروماني القديم لمدينة باريس؟';
-- جغرافيا ومعالم: اسم بولنديّ صعب النطق وغير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'H192' and level = 'صعب' and question = 'ما أعلى قمة في أستراليا؟';
-- جغرافيا ومعالم: اسم أجنبيّ صعب النطق لكهف لا يعرفه إلّا المختصّ، ولا طريق للتشاور إليه
update public.question_overrides set level = 'تعجيزي' where question_id = 'H384' and level = 'صعب' and question = 'ما اسم أعمق كهف معروف في العالم؟';
-- حروف: مبتكر الإسبرانتو اسم أجنبيّ صعب لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3879' and level = 'صعب' and question = 'من مبتكر لغة الإسبرانتو؟';
-- حروف: ملحّن موسيقى الفيلم: الفيلم مشهور والاسم خلفه مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3882' and level = 'صعب' and question = 'من مؤلّف موسيقى فيلم «تايتانيك»؟';
-- حروف: مؤلّف بيتر بان اسم غير متداول عربيّاً، والقصّة مشهورة والمؤلّف مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3883' and level = 'صعب' and question = 'من مؤلّف قصّة «بيتر بان»؟';
-- حضارات قديمة: سنة دقيقة لا تُستنتج إلّا تقريباً من الحملة الفرنسيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM2192' and level = 'صعب' and question = 'في أيّ عامٍ عُثر على حجر رشيد أثناء الحملة الفرنسيّة على مصر؟';
-- دوري أبطال أوروبا: مكان نهائيّ قديم 1984 تفصيلة لا يعرفها إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1837' and level = 'صعب' and question = 'على ملعب أيّ فريقٍ أُقيم نهائيّ 1984 وخسره صاحب الأرض؟';
-- دوري أبطال أوروبا: عدّ دقيق لمواسم متتالية لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1846' and level = 'صعب' and question = 'كم موسماً توالى فيه صدارة الهدّافين لكريستيانو رونالدو؟';
-- ديزني وبيكسار: اسم المصباح في الشعار معلومة مختصّين
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM2723' and level = 'صعب' and question = 'ما اسم المصباح المكتبيّ القافز في شعار بيكسار؟';
-- ديزني وبيكسار: أسماء شخصيّات ثانويّة وتختلف في الدبلجة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM2991' and level = 'صعب' and question = 'ما اسم الفأرين صديقَي سندريلا؟';
-- ديزني وبيكسار: اسم مدينة المقرّ (بربانك) لا يعرفه إلّا المختصّ، والصورة لا تدلّ على المدينة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM2996' and level = 'صعب' and question = 'في أيّ مدينةٍ كاليفورنيّة يقع هذا المقرّ الرئيسيّ لشركة ديزني؟';
-- رياضة عامة: اسم رياضيّ من 1928 لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4021' and level = 'صعب' and question = 'من أوّل عربي يفوز بميدالية ذهبية أولمبية في رفع الأثقال سنة 1928؟';
-- رياضة عامة: اسم أجنبيّ صعب غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'H111' and level = 'صعب' and question = 'من أول لاعب سجّل هدفًا في تاريخ نهائيات كأس العالم؟';
-- رياضة عامة: اسم مدينة أجنبيّة غير متداول، لا طريق للتشاور إليه
update public.question_overrides set level = 'تعجيزي' where question_id = 'H112' and level = 'صعب' and question = 'ما أول مدينة استضافت الألعاب الأولمبية الشتوية؟';
-- رياضة عامة: سنة دقيقة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'H119' and level = 'صعب' and question = 'في أي عام أُقيمت أول بطولة ويمبلدون؟';
-- رياضة عامة: سنة دقيقة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'H438' and level = 'صعب' and question = 'في أي عام أقيمت أول بطولة لكأس الأمم الأفريقية؟';
-- سيارات: فائز أوّل لومان 1923 علامة فرنسيّة منقرضة لا يعرفها إلّا مؤرّخ السباقات
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0603' and level = 'صعب' and question = 'أي سيارة فازت بأول سباق لومان عام 1923؟';
-- سيارات: طراز سوبارو قديم من الخمسينيّات لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0666' and level = 'صعب' and question = 'ما اسم أول سيارة ركاب أنتجتها سوبارو بكميات كبيرة؟';
-- سيارات: معرض تقديم لاند روفر سنة 1948 تفصيلة تاريخيّة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0669' and level = 'صعب' and question = 'في أيّ معرضٍ أوروبيّ قُدّمت أوّل لاند روفر إنتاجيّة سنة 1948؟';
-- سيارات: مصمّم الميني اسم أجنبيّ صعب خلف سيّارة مشهورة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0673' and level = 'صعب' and question = 'من صمم سيارة ميني الأصلية التي ظهرت عام 1959؟';
-- سيارات: اسم المصمّم خلف سيّارة مشهورة، والاسم الإيطاليّ غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0699' and level = 'صعب' and question = 'أيّ مصمّمٍ إيطاليّ وقّع تصميم لامبورغيني ميورا وديابلو؟';
-- سيارات: اسم سائقة إيطاليّة مغمورة من السبعينيّات، ولا يوصل إليه التشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM0715' and level = 'صعب' and question = 'من أوّل امرأة تحرز نقاطاً في بطولة العالم للفورمولا 1؟';
-- سينما ودراما: سنة دقيقة لإطلاق قناة الجزيرة للأطفال لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1203' and level = 'صعب' and question = 'في أيّ سنةٍ أطلقت شبكة الجزيرة قناتها المخصّصة للأطفال؟';
-- سينما ودراما: سنة الحلقة الأولى بدقّة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1212' and level = 'صعب' and question = 'في أيّ سنةٍ عُرضت الحلقة الأولى من «طاش ما طاش»؟';
-- سينما ودراما: اسم أوّل فيلم مصريّ ناطق معلومة أرشيفيّة للمختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'H296' and level = 'صعب' and question = 'ما أول فيلم مصري ناطق عُرض سنة 1932؟';
-- سينما ودراما: اسم فيلم كويتيّ من 1965 مجهول حتّى لمحبّي الدراما الكويتيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H371' and level = 'صعب' and question = 'ما اسم أوّل فيلم روائي كويتي، أنتجته وزارة الإعلام سنة 1965 من بطولة عبدالحسين عبدالرضا؟';
-- سينما ودراما: فيلم فرنسيّ غير متداول عربيّاً، لا يعرفه إلّا متابع المهرجانات
update public.question_overrides set level = 'تعجيزي' where question_id = 'H465' and level = 'صعب' and question = 'ما اسم الفيلم الفرنسي الذي فاز بالسعفة الذهبية وتناول حياة مدرّس في ضاحية باريسية؟';
-- سينما ودراما: اسم أوّل فيلم عربيّ في مهرجان كان معلومة أرشيفيّة لا يعرفها إلّا المهووس
update public.question_overrides set level = 'تعجيزي' where question_id = 'H466' and level = 'صعب' and question = 'ما اسم أول فيلم عربي شارك في مهرجان كان؟';
-- سينما ودراما: مخرجة تونسيّة غير معروفة للجمهور الخليجيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'H467' and level = 'صعب' and question = 'من المخرج التونسي صاحب فيلم «صمت القصور»؟';
-- شعارات أندية: براغا: الشعار مطموس في أسفله، ونادٍ برتغاليّ لا يُعرف شعاره في المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6768' and level = 'صعب' and question = 'شعار أيّ نادٍ هذا؟';
-- شعارات أندية: تفينتي: نادٍ هولنديّ مغمور، والحصان مع طمس الاسم لا يفتح طريقاً للتخمين
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6797' and level = 'صعب' and question = 'شعار أيّ نادٍ هذا؟';
-- شعارات أندية: فيتوريا غيماريش: شعار برتغاليّ مغمور، واسم غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6799' and level = 'صعب' and question = 'شعار أيّ نادٍ هذا؟';
-- شعارات أندية: رابيد فيينا: الاسم مطموس ولم يبقَ إلّا خطوط خضراء وإكليل؛ نادٍ نمساويّ لا يتابعه أحد في المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6800' and level = 'صعب' and question = 'شعار أيّ نادٍ هذا؟';
-- شعارات أندية: فرنتسفاروش: شعار مجريّ مطموس أغلبه، والاسم صعب النطق وغير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6806' and level = 'صعب' and question = 'شعار أيّ نادٍ هذا؟';
-- طب وصحة: «الصِّملاخ» اسمٌ معجميّ نادر لا يعرفه إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4066' and level = 'صعب' and question = 'ما الاسم الطبي للمادة الشمعية التي تفرزها الأذن؟';
-- طب وصحة: «الرغامى» اسم طبّيّ معجميّ نادر الاستعمال
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4076' and level = 'صعب' and question = 'ما الاسم الطبي العربي للقصبة الهوائية؟';
-- طب وصحة: لاندشتاينر اسم أجنبيّ صعب النطق وغير متداول بالعربيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H104' and level = 'صعب' and question = 'من اكتشف فصائل الدم؟';
-- طب وصحة: مصطلح «الكبيبة» تشريحيّ من كتب الأحياء، ولا يُعرف من الحياة اليوميّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H417' and level = 'صعب' and question = 'ما اسم الجزء من النفرون الذي يُرشَّح فيه الدم؟';
-- طب وصحة: «الجسم الثفني» مصطلح تشريحيّ أكاديميّ لا يمكن الوصول إليه بالتشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'H422' and level = 'صعب' and question = 'ما اسم الجزء من الدماغ الذي يربط نصفيه الأيمن والأيسر؟';
-- علوم واختراعات: الاسم العربيّ «المَرْو» للكوارتز لفظ معجميّ نادر لا طريق للتشاور إليه
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4124' and level = 'صعب' and question = 'ما الاسم العربي لمعدن الكوارتز؟';
-- علوم واختراعات: الأكسجين مشهور ومكتشفه (بريستلي) اسم غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4131' and level = 'صعب' and question = 'من العالم الإنجليزي الذي يُنسب إليه اكتشاف غاز الأكسجين سنة 1774؟';
-- علوم واختراعات: الرادار مشهور ومطوّره (واتسون وات) اسم أجنبيّ مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4134' and level = 'صعب' and question = 'من العالم الاسكتلندي الذي طوّر الرادار العملي قبيل الحرب العالمية الثانية؟';
-- علوم واختراعات: المحرّك مشهور والاسم خلفه (نيكولاوس أوتو) مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4142' and level = 'صعب' and question = 'من المهندس الألماني الذي بنى أوّل محرّك احتراق داخلي رباعي الأشواط؟';
-- علوم واختراعات: وحدة الغراي مصطلح تخصّص إشعاعيّ لا يُعرف من الحياة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H409' and level = 'صعب' and question = 'ما الوحدة التي تُقاس بها الجرعة الإشعاعيّة التي يمتصّها الجسم؟';
-- علوم واختراعات: أوّل عنصر صناعيّ (التكنيشيوم) اسم لا يعرفه إلّا المختصّ ولا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'H413' and level = 'صعب' and question = 'ما اسم أول عنصر صناعي أُنتج في المختبر؟';
-- كأس العالم: عدد دقيق للمنتخبات في 1930 لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1927' and level = 'صعب' and question = 'كم بلغ عدد المنتخبات في نسخة 1930؟';
-- كأس العالم: هدّاف 1930 (ستابيلي) اسم مجهول حتّى لمتابع البطولة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3994' and level = 'صعب' and question = 'من هدّاف أوّل كأس عالم سنة 1930؟';
-- لغة عربية: عدد دقيق (اثنا عشر وزناً) من الصرف الأكاديميّ لا يُستنتج بالتشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1551' and level = 'صعب' and question = 'كم عدد أوزان الفعل الثلاثيّ المزيد في العربيّة؟';
-- لغة عربية: «الدغفل» لصغير الفيل كلمة معجميّة نادرة لا تُعرف من الحياة ولا طريق للتشاور إليها
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM3621' and level = 'صعب' and question = 'ما اسم صغير الفيل؟';
-- لغة عربية: أصل «يخت» الهولنديّ معلومة تأثيليّة تخصّصيّة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5040' and level = 'صعب' and question = 'من أيّ لغة جاءت كلمة «يخت»؟';
-- لوكيشن: بيت الكويت للأعمال الوطنية متحف مغمور في الشويخ، والخريطة لا تقدّم ما يدلّ عليه
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8707' and level = 'صعب' and question = 'ما هذا المكان؟';
-- مشاهير: جنسن هوانغ في صورة قديمة بلا سترته المعروفة؛ وجه لا يعرفه إلّا متابع التقنية
update public.question_overrides set level = 'تعجيزي' where question_id = 'X059' and level = 'صعب' and question = 'من صاحب الصورة؟';
-- مشاهير: غوغل مشهورة لكنّ وجه مؤسّسها سيرجي برين مجهول
update public.question_overrides set level = 'تعجيزي' where question_id = 'X062' and level = 'صعب' and question = 'من صاحب الصورة؟';
-- مشاهير: تشارلي مانجر وجهٌ لا يعرفه مجلس خليجيّ؛ لا يعرفه إلّا متابع الاستثمار
update public.question_overrides set level = 'تعجيزي' where question_id = 'X095' and level = 'صعب' and question = 'من صاحب الصورة؟';
-- مشاهير: محمد العريان اقتصاديّ لا يُعرف وجهه إلّا للمختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'X104' and level = 'صعب' and question = 'من صاحب الصورة؟';
-- مشاهير: براين كوكس اسم أجنبيّ ووجه غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'X125' and level = 'صعب' and question = 'من صاحب الصورة؟';
-- معالم: صورة جامع القيروان من نافذة مقوّسة لا يعرفها إلّا المتخصّص أو الزائر
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1064' and level = 'صعب' and question = 'ما هذا الجامع؟';
-- معالم: مصمّم هرم اللوفر: المعلم مشهور والمعماريّ خلفه مجهول، واسمه أجنبيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1080' and level = 'صعب' and question = 'من المهندس الذي صمّم هرم اللوفر الزجاجي؟';
-- معالم: ارتفاع أصليّ بالمتر لا يُستنتج بالتشاور
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1102' and level = 'صعب' and question = 'كم كان الارتفاع الأصليّ لهرم خوفو تقريباً؟';
-- معالم: رقم طول دقيق لا يُستنتج، والشائع بين الناس أرقام أخرى
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1131' and level = 'صعب' and question = 'كم يقارب طول سور الصين العظيم؟';
-- مكياج وعطور: ماركة عناية فاخرة متخصّصة باسم شخص أجنبيّ صعب، وقارورة زرقاء بلا قرينة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8097' and level = 'صعب' and question = 'ما هذا المنتج؟';
-- مكياج وعطور: قارورة ورديّة بلا شيء يدلّ على البطّيخ أو الماركة؛ ماركة كوريّة-أمريكيّة قليلة الحضور في المجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8099' and level = 'صعب' and question = 'ما هذا المنتج؟';
-- مكياج وعطور: غلوسييه ماركة غير متداولة في الخليج وعطرها لا يعرفه إلّا متابع ماركات الإنترنت الأمريكيّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8164' and level = 'صعب' and question = 'ما هذا العطر؟';
-- من أنا؟: فيزيائيّة نمساويّة مجهولة خارج المختصّين، واسم أجنبيّ صعب غير متداول عربيّاً، والسؤال نفسه يقول إنّ الجائزة ذه
update public.question_overrides set level = 'تعجيزي' where question_id = 'H374' and level = 'صعب' and question = 'فيزيائية نمساوية شاركت في تفسير الانشطار النووي، ونال زميلُها وحده جائزة نوبل عنه. من هذه الشخصية؟';
