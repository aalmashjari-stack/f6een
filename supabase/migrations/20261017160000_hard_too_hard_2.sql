-- مراجعة «صعب» ١٧ أكتوبر ٢٠٢٦ — الدفعة الثانية: الأسئلة المؤجّلة بحدّ الثلاثين.
-- تُطبَّق **بعد** اعتماد علي دفعة البدائل 0cc5292f (42 سؤالاً «صعب»)، فكلّ فئةٍ تنقل منها بقدر ما وصلها من بدائل ولا تنزل تحت 30.
-- النقل إلى «تعجيزي» كما في 20261017140000_hard_too_hard.sql، وكلّ سطرٍ مشروطٌ بالمستوى والنصّ.
-- 42 سؤالاً؛ وبقي 14 في اللعب لا بديل لها (الأسطورة مشبعة، ومشاهير بلا صور مناسبة).

-- Dexter: مؤلّف الروايات اسمٌ خلف عملٍ مشهور لا يعرفه المشاهد
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5899' and level = 'صعب' and question = 'من مؤلّف روايات ديكستر؟';
-- Dexter: اسم شخصيّة ثانويّة مقتولة تفصيلة حبكة دقيقة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5903' and level = 'صعب' and question = 'ما اسم الأخ المقتول لصديق ديكستر في الموسم الثالث، الذي بدأت به القصّة؟';
-- Dexter: الاسم الحقيقيّ لقاتل الموسم الثامن تفصيلة لا يتذكّرها إلّا المعيد
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5905' and level = 'صعب' and question = 'ما اسم القاتل «جرّاح الدماغ» في الموسم الثامن؟';
-- Dexter: اسم ممثّل دور مساعد أجنبيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5911' and level = 'صعب' and question = 'من الممثّل الذي أدّى الرقيب المرتاب في ديكستر منذ البداية؟';
-- Dexter: اسم ممثّل دور مساعد أجنبيّ غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5912' and level = 'صعب' and question = 'من الممثّل الذي أدّى المحقّق الذي تزوّج رئيسته في قسم جرائم القتل؟';
-- Dexter: قاتل ثانويّ في حلقة واحدة، اسمه لا يتذكّره إلّا من أعاد المشاهدة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7021' and level = 'صعب' and question = 'من القاتل الذي قتله ديكستر في بداية الموسم الخامس فوجد عنده امرأةً محتجزة؟';
-- Dexter: اسم ممثّلة دور مساعد أجنبيّ غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7023' and level = 'صعب' and question = 'من الممثّلة التي أدّت رئيسة قسم جرائم القتل في المسلسل؟';
-- Dexter: اسم ممثّل دور ثانويّ لا يعرفه إلّا المهووس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7024' and level = 'صعب' and question = 'من الممثّل الذي أدّى الطبيب الشرعي المرح زميل ديكستر؟';
-- Dexter: اسم ممثّل دور مساعد أجنبيّ غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7025' and level = 'صعب' and question = 'من الممثّل الذي أدّى المحقّق الشابّ الغزِل زميل ديكستر؟';
-- Dexter: اسم ممثّلة أجنبيّ صعب النطق
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7028' and level = 'صعب' and question = 'من الممثّلة التي أدّت حبيبة ديكستر السامّة في الموسمين السابع والثامن؟';
-- Prison break: اسم ابن ماهون، تفصيلة ثانويّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5977' and level = 'صعب' and question = 'ما اسم ابن ماهون الذي قُتل؟';
-- Prison break: اسم السجن في الموسم الخامس، تفصيلة لا يتذكّرها إلّا المعيد
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5980' and level = 'صعب' and question = 'ما اسم السجن اليمني في الموسم الخامس؟';
-- Prison break: اسم شخصيّة ثانويّة في الموسم الخامس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5981' and level = 'صعب' and question = 'ما اسم ابن تي باغ الذي ظهر في الموسم الخامس؟';
-- Prison break: الاسم الحقيقيّ لتوينر، تفصيلة لا يتذكّرها المشاهد
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5983' and level = 'صعب' and question = 'ما الاسم الحقيقي للهارب الشابّ الذي قتله ماهون في الموسم الثاني؟';
-- Prison break: اسم ممثّل أجنبيّ صعب النطق غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5986' and level = 'صعب' and question = 'من الممثّل الذي أدّى ألكسندر ماهون؟';
-- Prison break: مبتكر المسلسل: الشيء مشهور والاسم خلفه مجهول، واسم أجنبيّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5988' and level = 'صعب' and question = 'من ابتكر المسلسل؟';
-- Prison break: الاسم الكامل لشخصيّة ثانويّة في الموسم الثاني
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5989' and level = 'صعب' and question = 'ما اسم زوجة/شريكة تي باغ التي احتجزها في بيتها مع أطفالها بالموسم الثاني؟';
-- Prison break: اسم عميل ثانويّ قُتل في الموسم الأوّل
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5991' and level = 'صعب' and question = 'ما اسم عميل الخدمة السرّية شريك كيلرمان الذي قتله كيلرمان؟';
-- Prison break: اسم محامٍ ثانويّ في الموسم الأوّل
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM5992' and level = 'صعب' and question = 'ما اسم المحامي الذي ساعد فيرونيكا في قضية لينكولن؟';
-- Prison break: الاسم الكامل الحقيقيّ لهايواير لا يُذكر إلّا عابراً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6092' and level = 'صعب' and question = 'ما الاسم الحقيقي للهارب المضطرب عقلياً الذي حفظ خريطة السجن من ذاكرته؟';
-- Prison break: اسم عميل مساعد ثانويّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM6093' and level = 'صعب' and question = 'ما اسم عميل المباحث شريك ماهون في مطاردة الموسم الثاني؟';
-- Prison break: اسم والدة إل جاي، شخصيّة ثانويّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7100' and level = 'صعب' and question = 'ما اسم والدة إل جاي؟';
-- Prison break: اسم ممثّل أجنبيّ غير متداول لشخصيّة مساندة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7101' and level = 'صعب' and question = 'من الممثّل الذي أدّى بيليك؟';
-- Prison break: اسم ممثّلة أجنبيّة غير متداول
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7102' and level = 'صعب' and question = 'من الممثّلة التي أدّت فيرونيكا؟';
-- Prison break: اسم ممثّل أجنبيّ غير متداول عربيّاً
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7105' and level = 'صعب' and question = 'من الممثّل الذي أدّى سي نوت؟';
-- Prison break: لقب طفولة عابر لا يتذكّره إلّا المهووس
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7106' and level = 'صعب' and question = 'ما اللقب الذي عُرف به لينكولن في شبابه؟';
-- Prison break: اسم زوجة ماهون السابقة، شخصيّة ثانويّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM7107' and level = 'صعب' and question = 'ما اسم زوجة ماهون السابقة؟';
-- Prison break: اسم ممثّل أجنبيّ صعب لدور ثانويّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM9623' and level = 'صعب' and question = 'من الممثّل الذي أدّى زعيم المافيا الذي وفّر طائرة الهروب من فوكس ريفر؟';
-- The Sopranos: معالج ملفي شخصيّة ثانويّة باسم أجنبيّ صعب النطق (كوبفربرغ)
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8389' and level = 'صعب' and question = 'من المعالج النفسيّ الذي تستشيره ملفي نفسها؟';
-- The Sopranos: اسم هنديّ اتّخذته شخصيّة ثانويّة (جانيس) في تفصيلة عابرة، لا يتذكّره إلّا من أعاد المشاهدة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8393' and level = 'صعب' and question = 'ما الاسم الهنديّ الذي اتّخذته شقيقة توني في سياتل؟';
-- The Sopranos: عدد دقيق لجوائز إيمي، معلومة خارج المسلسل لا يحفظها المتابع
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8403' and level = 'صعب' and question = 'كم جائزة إيمي نالها مؤدّي دور توني عن الدور؟';
-- الأسطورة: شخصيّة ثانويّة (عزام) لا يتذكّرها إلّا من أعاد المشاهدة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8263' and level = 'صعب' and question = 'من رئيس بدر في تجارة السلاح الذي أخرجه منها؟';
-- الكويت: سنة دقيقة لصدور أوّل صحيفة يوميّة
update public.question_overrides set level = 'تعجيزي' where question_id = 'H448' and level = 'صعب' and question = 'في أي عام صدرت أول صحيفة يومية كويتية؟';
-- الكويت: اسم تلّة أعلى نقطة معلومة جغرافيّة دقيقة لا يعرفها إلّا القليل
update public.question_overrides set level = 'تعجيزي' where question_id = 'H454' and level = 'صعب' and question = 'ما اسم التلّة التي تُعدّ أعلى نقطة في دولة الكويت؟';
-- تقنية ومنوعات: فكّ اختصار الليزر مصطلح فيزياء أكاديميّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM1600' and level = 'صعب' and question = 'ما معنى اختصار «لايزر»؟';
-- تقنية ومنوعات: تاريخ يوم بعينه لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4043' and level = 'صعب' and question = 'في أيّ يوم من السنة يُحتفل بيوم الأمم المتحدة؟';
-- تقنية ومنوعات: اسم متصفّح 1993 لا يتذكّره إلّا المختصّ
update public.question_overrides set level = 'تعجيزي' where question_id = 'H228' and level = 'صعب' and question = 'ما اسم أول متصفح ويب واسع الانتشار ظهر عام 1993؟';
-- ديزني وبيكسار: سنة استحواذ دقيقة لا تُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM2722' and level = 'صعب' and question = 'في أيّ سنةٍ اشترت ديزني شركة بيكسار؟';
-- رياضة عامة: بطل أوّل بطولة سلّة 1950 معلومة تاريخيّة نادرة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM4029' and level = 'صعب' and question = 'أيّ منتخب فاز بأوّل بطولة عالم لكرة السلة سنة 1950 على أرضه؟';
-- رياضة عامة: تفاصيل أسلحة المبارزة تخصّص لا يُعرف من الحياة
update public.question_overrides set level = 'تعجيزي' where question_id = 'ADM8730' and level = 'صعب' and question = 'في المبارزة، ما السلاح الذي تكون فيه منطقة الهدف الصالحة هي الجذع فقط؟';
-- رياضة عامة: رقم قياس دقيق لا يُستنتج
update public.question_overrides set level = 'تعجيزي' where question_id = 'H208' and level = 'صعب' and question = 'كم يبلغ طول ملعب كرة السلة الرسمي؟';
-- مشاهير: غوغل مشهورة لكنّ وجه لاري بايج مجهول للمجلس
update public.question_overrides set level = 'تعجيزي' where question_id = 'X061' and level = 'صعب' and question = 'من صاحب الصورة؟';
