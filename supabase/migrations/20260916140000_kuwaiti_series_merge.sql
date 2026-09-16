-- دمج فئات المسلسلات الخليجية الأربع في فئة واحدة «مسلسلات كويتية»
-- (قرار علي ١٦ سبتمبر ٢٠٢٦).
--
-- الأربع (الحيالة، خالتي قماشة، درب الزلق، رقية وسبيكة) أُنشئت في ١٥ سبتمبر
-- من مقالات ويكيبيديا وحدها فنفد المصدر دون حدّ العشرين في كلّ خليّة:
-- 30 و31 و41 و41 سؤالاً، وأقلّ خليّة 6. والناقص 177 سؤالاً لا مصدرَ له إلّا
-- التأليف — وهو ممنوع في فئةٍ يعرف المجلس حلقاتها حرفاً حرفاً. فالدمج
-- يكمل الخلايا بلا سؤالٍ مخترَع: سهل 31 · متوسط 36 · صعب 30 · تعجيزي 46.
--
-- **ونصّ كلّ سؤالٍ يُعاد** ليذكر اسمَ مسلسله: «من كتب المسلسل؟» بلا معنى
-- في فئةٍ تجمع أربعة. واسمُ المسلسل لا يُوضع في أوّل السؤال — المحرّك
-- يستنتج عائلة القالب من أوّل أربع كلمات (bank.ts)، و«في «درب الزلق»،
-- ما…» كان سيجمع ثمانية أسئلة في عائلةٍ واحدة فلا يظهر منها في الجلسة
-- إلّا واحد. والإجاباتُ التي تتكرّر عبر مسلسلين (علي المفيدي، خالد
-- النفيسي) أو داخل المسلسل (محبوبة، لطيفة) تُصرَّح عائلتها فلا تجتمعان.
--
-- updated_at تُرفع لأنّ bank_signature تقرأ أقصاها. والفئة الجديدة في
-- مظلّة «مسلسلات خليجية» نفسها، إضافيّةً وخارج الديربي كسابقاتها، وبلا
-- صورة غلاف كما كانت. والمسوّدات (المعتمدة والمرفوضة) تُنقل معها لأنّ
-- المرفوضة مرجعُ فحص التكرار في check-drafts.

insert into public.categories (name, group_name, is_extra, derby) values
  ('مسلسلات كويتية', 'مسلسلات خليجية', true, false)
on conflict (name) do update set group_name = excluded.group_name;

update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم أمّ لولوة في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5693';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور «شاهين يوسف علف» في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5694';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور «جراح يوسف علف» في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5695';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الجهة التي نفّذت إنتاج مسلسل «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5696';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور ماجد ابن حكيمة في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5697';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور فوزي في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5698';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور ميسون في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5699';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور نسيمة أمّ لولوة في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5700';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور الطقّاقة أمّ فيصل في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5701';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بماذا يختلف جراح وشاهين عن إخوتهما مانع ودواس وفتون في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5702';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من كتبت مسلسل «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5673';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم العائلة التي تدور حولها أحداث «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5674';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم الشخصية التي أدّاها عبدالحسين عبدالرضا في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5675';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم الأخ الأكبر المتمسّك بالعادات الرافض لكلّ جديد في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5676';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور «لولوة» في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5677';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور مانع في «الحيالة»؟', family = 'خالد النفيسي', updated_at = now() where question_id = 'ADM5678';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كم زوجةً كان دواس متزوّجاً سرّاً في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5679';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور حكيمة أمّ ماجد في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5687';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما عمل حكيمة في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5688';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أيّ شخصيةٍ أدّاها سعيد سالم في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5689';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الشخصية التي أدّاها محمد الصيرفي في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5690';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من الفنانة الجديدة آنذاك التي أدّت شخصية «خطر» في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5691';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم والد الإخوة علف في «الحيالة» كما يرد في أسمائهم؟', family = family, updated_at = now() where question_id = 'ADM5692';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'في أيّ عام عُرض مسلسل «الحيالة» أوّل مرّة؟', family = family, updated_at = now() where question_id = 'ADM5680';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم أخت دواس ومانع الصغرى في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5681';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور فتون في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5682';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم المرأة الثريّة التي تزوّجها دواس طمعاً في مالها في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5683';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لماذا تزوّج دواس حكيمة في «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5684';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'في أيّ شهرٍ هجريّ عُرض مسلسل «الحيالة» أوّل مرّة؟', family = family, updated_at = now() where question_id = 'ADM5685';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما السرّ الذي انكشف عن فتون في الحلقة الأخيرة من «الحيالة»؟', family = family, updated_at = now() where question_id = 'ADM5686';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من كتب كلمات شارة «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5844';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من لحّن شارة «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5845';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم اليتيم الذي ربّاه الحجي مرزوق ويعمل في بيته في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5846';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم أخت محبوبة الصغرى صاحبة الموهبة الغنائية في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5847';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور عادل في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5848';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور مفتاح في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5849';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور ليلى في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5850';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أيّ مطربٍ كان مقترحاً لدور عادل في «خالتي قماشة» قبل أن يستقرّ الدور على خليل إسماعيل؟', family = family, updated_at = now() where question_id = 'ADM5851';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من الفنانة التي كانت مقترحة لدور لطيفة في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5852';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لماذا رفضت حياة الفهد نصّ «خالتي قماشة» أوّل مرّة؟', family = family, updated_at = now() where question_id = 'ADM5853';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'في أيّ شهرٍ من عام 1983 عُرض مسلسل «خالتي قماشة» أوّل مرّة؟', family = family, updated_at = now() where question_id = 'ADM5854';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ماذا وضعت قماشة في غرف أبنائها لتراقبهم في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5824';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور «محبوبة» زوجة سلطان في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5825';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور «سلطان» آخر العنقود في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5826';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم ابن قماشة البخيل الذي يعمل دلّالاً في العقارات في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5827';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور حنضل في «خالتي قماشة»؟', family = 'علي المفيدي', updated_at = now() where question_id = 'ADM5828';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كم ابناً لقماشة في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5829';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم زوجة سلطان المتعلّمة صاحبة الاختراعات في «خالتي قماشة»؟', family = 'محبوبة', updated_at = now() where question_id = 'ADM5830';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم زوجة حنضل في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5838';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور «حنان» زوجة عادل في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5839';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من تزوّج الحجي مرزوق بعد وفاة زوجته في «خالتي قماشة»؟', family = 'لطيفة', updated_at = now() where question_id = 'ADM5840';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور لطيفة في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5841';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور نسمة في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5842';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كم بنتاً لحنضل ونسمة في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5843';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من اكتشفت سرّ الكاميرات في «خالتي قماشة»؟', family = 'محبوبة', updated_at = now() where question_id = 'ADM5831';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم ابنة قماشة الوحيدة في «خالتي قماشة»؟', family = 'لطيفة', updated_at = now() where question_id = 'ADM5832';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور الحجي مرزوق والد محبوبة في «خالتي قماشة»؟', family = 'خالد النفيسي', updated_at = now() where question_id = 'ADM5833';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أيّ أبناء قماشة هو المطرب المدلّل في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5834';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما مهنة سلطان في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5835';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'على ماذا أرغمت حنان زوجها عادل في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5836';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما هواية نسمة زوجة حنضل المفضّلة في «خالتي قماشة»؟', family = family, updated_at = now() where question_id = 'ADM5837';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لمن كُتب دور بو صالح في «درب الزلق» قبل أن يعتذر لظروفٍ صحّية؟', family = family, updated_at = now() where question_id = 'ADM5731';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بماذا لقّب حسين الموظّفَ قصير القامة بو وائل في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5732';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم المطوّع الذي عالج حسين في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5733';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور صالح ابن بو صالح في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5734';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أين حاول حسين الانتحار بعد أن بدّد ثروته في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5735';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور صالحة ابنة بو صالح في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5736';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور غلام في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5737';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم رئيس لجنة التثمين في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5738';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور حجي بودمغى في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5739';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور المدير بو خالد في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5740';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور نبوية شبشب في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5741';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من غنّى في عرس قحطة ونبوية في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5742';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من الفنان الذي كان مقرّراً أن يشارك في «درب الزلق» ولم يشارك لظروفٍ غامضة؟', family = family, updated_at = now() where question_id = 'ADM5743';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما مهنة الجار بو صالح في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5703';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم العامل الهندي الذي يلقّبه حسين بـ«الخبير» في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5704';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما العبارة التي اشتهر بها غلام في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5705';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ماذا اكتشف الأخوان في شحنة الأحذية التي استورداها في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5706';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الذي أقنع المحتالُ حسينَ بشرائه في مصر في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5707';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم الأخ الأكبر لحسين في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5708';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كيف أثرى الأخوان فجأة في بداية «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5709';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما البضاعة التي استوردها حسين في «درب الزلق» ظنّاً أنّ الأجانب سيشترونها؟', family = family, updated_at = now() where question_id = 'ADM5710';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم الخال صاحب محلّ النعال في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5711';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الاسم الحقيقي لبو صالح في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5723';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور المحتال «فؤاد ابن سعيد باشا» في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5724';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم زوجة قحطة في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5725';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم المحامي الذي وكّله حسين للدفاع عنه في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5726';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم المدير الذي عمل حسين في شركته في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5727';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم ابنة المدير بو خالد في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5728';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بأيّ عبارةٍ اشتهر طبيب حسين في المستشفى النفسي في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5729';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لمن زعم المحتال في «درب الزلق» أنّ ملكيّة الأهرامات تعود؟', family = family, updated_at = now() where question_id = 'ADM5730';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من تزوّجت أمّ سعد في «درب الزلق» فأصيب حسين بانهيار عصبي؟', family = family, updated_at = now() where question_id = 'ADM5712';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم ابنة بو صالح التي أحبّها سعد في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5713';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من الفنان الذي أدّى دور «أمّ سعد» في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5714';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما مهنة الخال قحطة في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5715';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'إلى أيّ بلدٍ سافر حسين للنقاهة بعد خروجه من المستشفى في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5716';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما المصنع الذي اشتراه حسين في «درب الزلق» ثمّ أحرقه هرباً من الديون؟', family = family, updated_at = now() where question_id = 'ADM5717';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لماذا رفضت شركة التأمين في «درب الزلق» تعويض حسين عن حريق المصنع؟', family = family, updated_at = now() where question_id = 'ADM5718';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الاسم الحقيقي لأمّ سعد في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5719';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'إلى أيّ مدينةٍ سافر حسين في «درب الزلق» في عملٍ فعاد ليجد أمّه قد تزوّجت؟', family = family, updated_at = now() where question_id = 'ADM5720';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أين اشتغل حسين وسعد في نهاية «درب الزلق» بعد ضياع الثروة؟', family = family, updated_at = now() where question_id = 'ADM5721';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الوظيفة التي شغلها حسين في شركة المدير بو خالد في «درب الزلق»؟', family = family, updated_at = now() where question_id = 'ADM5722';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور الباحثة الاجتماعية في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5661';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الاسم الكامل لذياب في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5662';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما البضاعة التي عرضها بو عثمان على الأختين في «رقية وسبيكة» على أنّها مستوردة وهي موجودة في الكويت؟', family = family, updated_at = now() where question_id = 'ADM5663';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بكم قدّرت سبيكة سعر بسطتهما القديمة في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5664';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور عبدالله الذي استغلّه بو عثمان في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5665';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بماذا برّرت الأختان في «رقية وسبيكة» للباحثة كثرة الأكل في اليوم التالي للعرس؟', family = family, updated_at = now() where question_id = 'ADM5666';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما الاختراع الذي عرضه بو عثمان في «رقية وسبيكة» ويتغيّر لونه بحسب مزاج لابسته؟', family = family, updated_at = now() where question_id = 'ADM5667';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كم شيكاً كان على شركة الأختين في «رقية وسبيكة» سداده في النهاية؟', family = family, updated_at = now() where question_id = 'ADM5668';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما سبب قرار إخلاء البيت الجديد في الحلقة الأخيرة من «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5669';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من غنّى شارة بداية «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5670';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم صديق ذياب صاحب الكراج في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5671';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كم بلغ تثمين البيت الجديد كما سمع بو عثمان في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5672';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّت دور سبيكة في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5632';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما نوع الشركة التي أسّستها الأختان بعد التثمين في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5633';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أيّ وزارة كانت الأختان في «رقية وسبيكة» تتلقّيان الإعانة؟', family = family, updated_at = now() where question_id = 'ADM5634';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بماذا احتفلت الأختان عند محلّ الكباب في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5635';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'إلى أيّ مدينة سافرت الأختان تتسوّقان في الحلقة الأخيرة من «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5636';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما مهنة ذياب حين التقى الأختين في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5637';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'بكم ثُمّن بيت الأختين أخيراً في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5638';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أيّ الأختين تزوّجت ذياب في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5639';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم السكرتير الذي لقّبته سبيكة بـ«حفّار القبور» في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5651';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور جميل جمال في «رقية وسبيكة»؟', family = 'علي المفيدي', updated_at = now() where question_id = 'ADM5652';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم التاجر النصّاب الذي استغلّ الأختين في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5653';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من أدّى دور بو عثمان في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5654';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم عائلة الأختين في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5655';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما المنصب الذي عيّنت رقية نفسها فيه في شركة «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5656';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما المنصب الذي أُسند إلى ذياب في شركة الأختين في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5657';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما المبلغ الذي عرضه صديق ذياب لشراء البيت فرفضته رقية في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5658';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لماذا قطعت الباحثة الإعانة عن سبيكة في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5659';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما نوع المصنع الفرنسي الذي عقدت معه رقية صفقة المليون ونصف في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5660';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من كتب مسلسل «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5640';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'من مخرج مسلسل «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5641';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كم حلقةً في مسلسل «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5642';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'في أيّ عام عُرض مسلسل «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5643';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ماذا ادّعت سبيكة لتتخلّص من رقية في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5644';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما المهر الذي طلبته رقية من ذياب في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5645';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ما اسم المرأة التي ربّت الأختين وتركت لهما البيت في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5646';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'ماذا ادّعت سبيكة أمام الشرطي لتتهرّب من دفع أجرة ذياب في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5647';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'أيّ الأختين الصغرى والأقوى شخصيةً في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5648';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'لماذا تزوّج ذياب في بداية «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5649';
update public.question_overrides set category = 'مسلسلات كويتية', question = 'كيف نقلت الأختان المليون من البنك إلى البيت في «رقية وسبيكة»؟', family = family, updated_at = now() where question_id = 'ADM5650';

update public.question_drafts
   set category = 'مسلسلات كويتية'
 where category in ('الحيالة', 'خالتي قماشة', 'درب الزلق', 'رقية وسبيكة');

delete from public.categories
 where name in ('الحيالة', 'خالتي قماشة', 'درب الزلق', 'رقية وسبيكة');
