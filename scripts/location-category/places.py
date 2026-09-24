"""The 120 places: key, level, geocoder query (coordinates come from
google-geocoded.json), answer as the player should say it, zoom, and the name
forms to blur wherever they appear on the map. Writes spec.json.

Excluded on purpose (Ali's rule): palaces (incl. قصر نايف, قصر العدل, القصر
الأحمر), the Amiri Diwan, police, embassies, military, interior and defence;
also cemeteries, the slaughterhouse and oil/port installations.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))

EASY, MED, HARD, XHARD = 'سهل', 'متوسط', 'صعب', 'تعجيزي'

def coop(area, *more):
    """A co-op is named after its area, so the area's own label gives it away too."""
    bare = [area[2:]] if area.startswith('ال') and len(area) >= 6 else []  # «سلطان جملة | منقف»
    return [f'جمعية {area}', area, *bare, *more]

P = [
  # ── سهل ────────────────────────────────────────────────────────────────
  ('towers', EASY, 'أبراج الكويت', 'أبراج الكويت', 16, ['أبراج الكويت', 'ابراج', 'Kuwait Towers', 'Towers']),
  ('liberation', EASY, 'برج التحرير', 'برج التحرير', 17, ['برج التحرير', 'التحرير', 'Liberation']),
  ('hamra', EASY, 'برج الحمراء', 'برج الحمراء', 17, ['الحمراء', 'Hamra']),
  ('avenues', EASY, 'الأفنيوز', 'مجمّع الأفنيوز', 16, ['الأفنيوز', 'الافنيوز', 'أفنيوز', 'Avenues', 'Avenue']),
  ('marina', EASY, 'مارينا مول', 'مارينا مول', 16, ['مارينا', 'Marina']),
  ('mall360', EASY, '360 مول', 'مجمّع 360', 16, ['360']),
  ('grandmosque', EASY, 'مسجد الدولة الكبير', 'المسجد الكبير (مسجد الدولة الكبير)', 17, ['مسجد الدولة', 'المسجد الكبير', 'الدولة الكبير', 'Grand Mosque', 'Masjid Al Kabeer', 'Al Kabeer', 'Kabeer']),
  ('mubarakiya', EASY, 'سوق المباركية', 'سوق المباركية', 17, ['المباركية', 'مباركية', 'Mubarakiya', 'Mubarakiyah']),
  ('sharq', EASY, 'سوق شرق', 'سوق شرق', 17, ['سوق شرق', 'Souk Sharq', 'Souq Sharq', 'Sharq', 'Sharg']),
  ('scicentre', EASY, 'المركز العلمي', 'المركز العلمي', 16, ['المركز العلمي', 'العلمي', 'Scientific']),
  ('jacc', EASY, 'مركز الشيخ جابر الأحمد الثقافي', 'مركز الشيخ جابر الأحمد الثقافي', 16, ['جابر الأحمد الثقافي', 'الثقافي', 'Cultural', 'JACC', 'الأوبرا', 'Opera']),
  ('assembly', EASY, 'مجلس الأمة', 'مجلس الأمة', 17, ['مجلس الأمة', 'مجلس الامة', 'National Assembly']),
  ('airport', EASY, 'مطار الكويت الدولي', 'مطار الكويت الدولي', 15, ['مطار الكويت', 'مطار', 'Airport']),
  ('jaberstadium', EASY, 'استاد جابر الأحمد الدولي', 'استاد جابر الأحمد الدولي', 16, ['استاد جابر', 'ستاد جابر', 'جابر الأحمد الدولي', 'Jaber Al-Ahmad', 'Stadium']),
  ('greenisland', EASY, None, 'الجزيرة الخضراء', 16, ['الجزيرة الخضراء', 'الخضراء', 'Green Island']),
  ('shaheedpark', EASY, 'حديقة الشهيد', 'حديقة الشهيد', 16, ['حديقة الشهيد', 'الشهيد', 'Shaheed', 'Al Shaheed']),
  ('kuwaitclub', EASY, 'نادي الكويت الرياضي', 'نادي الكويت الرياضي', 16, ['نادي الكويت', 'Kuwait SC', 'Kuwait Sporting', 'Kuwait Club']),
  ('qadsiaclub', EASY, 'نادي القادسية الرياضي', 'نادي القادسية الرياضي', 16, ['القادسية', 'Qadsia', 'Qadsiya', 'محمد الحمد']),
  ('arabiclub', EASY, 'النادي العربي الرياضي', 'النادي العربي الرياضي', 16, ['النادي العربي', 'العربي', 'Al Arabi', 'Arabi', 'صباح السالم']),
  ('kout', EASY, 'الكوت مول', 'الكوت مول', 16, ['الكوت', 'Kout']),
  ('zoo', EASY, 'الحديقة الحيوانية', 'حديقة الحيوان', 16, ['حديقة الحيوان', 'الحيوان', 'الحيوانية', 'Zoo']),
  ('shadadiya', EASY, 'جامعة الكويت الشدادية', 'جامعة الكويت (الشدادية)', 15, ['جامعة الكويت', 'الشدادية', 'Kuwait University', 'Shadadiya', 'صباح السالم الجامعية', 'Sabah Al Salem University', 'University City', 'Al Salem Univ']),
  ('kuwaitmagic', EASY, 'كويت ماجيك', 'كويت ماجيك', 16, ['ماجيك', 'Magic']),
  ('exhibitions', EASY, 'أرض المعارض مشرف', 'أرض المعارض في مشرف', 16, ['أرض المعارض', 'المعارض', 'معرض الكويت الدولي', 'Fairground', 'International Fair']),
  ('amirihospital', EASY, 'مستشفى الأميري', 'المستشفى الأميري', 17, ['الأميري', 'الاميري', 'Amiri']),
  ('sheraton', EASY, 'فندق شيراتون الكويت', 'فندق الشيراتون', 17, ['شيراتون', 'Sheraton']),
  ('salmiyaclub', EASY, 'نادي السالمية الرياضي', 'نادي السالمية الرياضي', 16, ['نادي السالمية', 'Salmiya SC', 'Salmiya Club', 'ثامر']),
  ('kazmaclub', EASY, 'نادي كاظمة الرياضي', 'نادي كاظمة الرياضي', 16, ['كاظمة', 'Kazma', 'Kazmah', 'الصداقة والسلام']),
  ('abdullahsalemcc', EASY, 'مركز الشيخ عبدالله السالم الثقافي', 'مركز الشيخ عبدالله السالم الثقافي', 16, ['عبدالله السالم الثقافي', 'الثقافي', 'Abdullah Al Salem Cultural', 'Cultural']),
  ('mubarakhospital', EASY, 'مستشفى مبارك الكبير', 'مستشفى مبارك الكبير', 16, ['مستشفى مبارك', 'مبارك الكبير', 'Mubarak Al-Kabeer', 'Mubarak Al Kabeer Hospital']),
  # ── متوسط ──────────────────────────────────────────────────────────────
  ('centralbank', MED, 'بنك الكويت المركزي', 'بنك الكويت المركزي', 17, ['البنك المركزي', 'بنك الكويت المركزي', 'المركزي', 'Central Bank']),
  ('boursa', MED, 'بورصة الكويت', 'بورصة الكويت', 17, ['بورصة', 'البورصة', 'Boursa', 'Stock Exchange']),
  ('auk', MED, 'الجامعة الأمريكية في الكويت', 'الجامعة الأمريكية في الكويت', 17, ['الجامعة الأمريكية', 'الأمريكية', 'American University', 'AUK']),
  ('mahalab', MED, 'مجمع المهلب', 'مجمّع المهلّب', 17, ['المهلب', 'Muhallab', 'Al Muhallab']),
  ('fanar', MED, 'مجمع الفنار', 'مجمّع الفنار', 17, ['الفنار', 'Fanar', 'Al Fanar']),
  ('salhiya', MED, 'مجمع الصالحية', 'مجمّع الصالحية', 17, ['الصالحية', 'Salhiya']),
  ('promenade', MED, 'بروميناد مول', 'مجمّع البروميناد', 17, ['بروميناد', 'البروميناد', 'Promenade']),
  ('jaberhospital', MED, 'مستشفى جابر الأحمد', 'مستشفى الشيخ جابر الأحمد', 16, ['مستشفى الشيخ جابر', 'مستشفى جابر', 'جابر الأحمد', 'Jaber Al-Ahmad Hospital', 'Jaber Hospital']),
  ('fourseasons', MED, 'فندق الفورسيزونز', 'فندق فورسيزونز', 17, ['فور سيزونز', 'فورسيزونز', 'Four Seasons']),
  ('crowneplaza', MED, 'فندق كراون بلازا', 'فندق كراون بلازا', 17, ['كراون بلازا', 'كراون', 'Crowne Plaza']),
  ('regency', MED, 'فندق ريجنسي', 'فندق الريجنسي', 17, ['الريجنسي', 'ريجنسي', 'Regency']),
  ('hawallypark', MED, 'حديقة حولي', 'حولي بارك', 17, ['حولي بارك', 'Hawally Park', 'Hawalli Park']),
  ('tijaria', MED, 'برج التجارية', 'برج التجارية', 17, ['التجارية', 'Al Tijaria', 'Tijaria']),
  ('arrayatower', MED, 'برج الراية', 'برج الراية', 17, ['الراية', 'Arraya', 'Al Raya']),
  ('kaifancoop', MED, 'جمعية كيفان التعاونية', 'جمعية كيفان التعاونية', 16, coop('كيفان', 'Kaifan', 'Kifan')),
  ('shamiyacoop', MED, 'جمعية الشامية التعاونية', 'جمعية الشامية والشويخ التعاونية', 16, coop('الشامية', 'الشويخ', 'Shamiya', 'Shuwaikh')),
  ('salmiyacoop', MED, 'جمعية السالمية التعاونية', 'جمعية السالمية التعاونية', 16, coop('السالمية', 'Salmiya')),
  ('rumaithiyacoop', MED, 'جمعية الرميثية التعاونية', 'جمعية الرميثية التعاونية', 16, coop('الرميثية', 'Rumaithiya')),
  ('jabriyacoop', MED, 'جمعية الجابرية التعاونية', 'جمعية الجابرية التعاونية', 16, coop('الجابرية', 'Jabriya')),
  ('rawdacoop', MED, 'جمعية الروضة التعاونية', 'جمعية الروضة وحولي التعاونية', 16, coop('الروضة', 'الروضه', 'Rawda')),
  ('yarmoukclub', MED, 'نادي اليرموك الرياضي', 'نادي اليرموك الرياضي', 16, ['نادي اليرموك', 'Yarmouk', 'عبدالله الخليفة']),
  ('tadamonclub', MED, 'نادي التضامن الرياضي', 'نادي التضامن الرياضي', 16, ['التضامن', 'Tadamon', 'العصيمي']),
  ('jahraclub', MED, 'نادي الجهراء الرياضي', 'نادي الجهراء الرياضي', 16, ['نادي الجهراء', 'Jahra SC', 'Jahra Club', 'مبارك العيار']),
  ('fridaymarket', MED, 'سوق الجمعة', 'سوق الجمعة', 16, ['سوق الجمعة', 'الحراج', 'Friday Market']),
  ('nationalmuseum', MED, 'المتحف الوطني', 'متحف الكويت الوطني', 17, ['المتحف الوطني', 'متحف الكويت', 'National Museum']),
  ('khaldiyauni', MED, 'جامعة الكويت الخالدية', 'جامعة الكويت (الخالدية)', 16, ['جامعة عبدالله السالم', 'جامعة الكويت', 'Kuwait University', 'Abdullah Al Salem University']),
  ('sabahhospital', MED, 'مستشفى الصباح', 'مستشفى الصباح', 16, ['مستشفى الصباح', 'Sabah Hospital']),
  ('movenpick', MED, 'فندق موفنبيك البدع', 'فندق موفنبيك البدع', 17, ['موفنبيك', 'موڤنبيك', 'Movenpick', 'Mövenpick']),
  ('radisson', MED, 'فندق راديسون بلو', 'فندق راديسون بلو', 17, ['راديسون', 'Radisson']),
  ('heritagevillage', MED, 'قرية يوم البحار', 'قرية يوم البحّار التراثية', 16, ['يوم البحار', 'Heritage village', 'Historical Heritage', 'Heritage']),
  # ── صعب ────────────────────────────────────────────────────────────────
  ('kipco', HARD, 'برج كيبكو', 'برج كيبكو', 17, ['كيبكو', 'KIPCO']),
  ('kfhtower', HARD, 'برج بيتك', 'برج بيتك', 17, ['بيتك', 'KFH', 'Baitak']),
  ('modernart', HARD, 'متحف الفن الحديث', 'متحف الفن الحديث', 17, ['الفن الحديث', 'Modern Art']),
  ('library', HARD, 'مكتبة الكويت الوطنية', 'مكتبة الكويت الوطنية', 17, ['مكتبة الكويت', 'المكتبة الوطنية', 'National Library']),
  ('amricani', HARD, 'دار الآثار الإسلامية', 'المركز الأمريكاني الثقافي', 17, ['الأمريكاني', 'الامريكي', 'دار الآثار', 'Amricani', 'Dar al-Athar']),
  ('fatimamosque', HARD, 'مسجد فاطمة', 'مسجد فاطمة', 17, ['مسجد فاطمة', 'فاطمة', 'Fatima']),
  ('farwaniyahospital', HARD, 'مستشفى الفروانية', 'مستشفى الفروانية', 16, ['مستشفى الفروانية', 'Farwaniya Hospital']),
  ('adanhospital', HARD, 'مستشفى العدان', 'مستشفى العدان', 16, ['مستشفى العدان', 'Adan Hospital', 'Adan']),
  ('jahrahospital', HARD, 'مستشفى الجهراء', 'مستشفى الجهراء', 16, ['مستشفى الجهراء', 'Jahra Hospital']),
  ('razihospital', HARD, 'مستشفى الرازي', 'مستشفى الرازي', 17, ['الرازي', 'Razi']),
  ('gust', HARD, 'جامعة الخليج للعلوم والتكنولوجيا', 'جامعة الخليج للعلوم والتكنولوجيا', 17, ['جامعة الخليج', 'الخليج للعلوم', 'GUST', 'Gulf University']),
  ('paaet', HARD, 'الهيئة العامة للتعليم التطبيقي', 'الهيئة العامة للتعليم التطبيقي', 16, ['التعليم التطبيقي', 'التطبيقي', 'PAAET']),
  ('jumeirah', HARD, 'فندق جميرا شاطئ المسيلة', 'فندق جميرا شاطئ المسيلة', 16, ['جميرا', 'Jumeirah']),
  ('chamber', HARD, 'غرفة تجارة وصناعة الكويت', 'غرفة تجارة وصناعة الكويت', 17, ['غرفة تجارة', 'غرفة التجارة', 'Chamber of Commerce']),
  ('kpc', HARD, 'مؤسسة البترول الكويتية', 'مؤسسة البترول الكويتية', 17, ['مؤسسة البترول', 'البترول الكويتية', 'KPC', 'Kuwait Petroleum']),
  ('yachtclub', HARD, 'نادي اليخوت', 'نادي اليخوت', 17, ['اليخوت', 'Yacht']),
  ('equestrian', HARD, 'نادي الفروسية', 'نادي الصيد والفروسية', 16, ['الفروسية', 'الصيد والفروسية', 'Equestrian', 'Hunting']),
  ('khaitanclub', HARD, 'نادي خيطان الرياضي', 'نادي خيطان الرياضي', 16, ['نادي خيطان', 'Khaitan SC', 'Khaitan Club']),
  ('qadsiyacoop', HARD, 'جمعية القادسية التعاونية', 'جمعية القادسية التعاونية', 16, coop('القادسية', 'Qadsiya', 'Qadisiya')),
  ('faihacoop', HARD, 'جمعية الفيحاء التعاونية', 'جمعية الفيحاء التعاونية', 16, coop('الفيحاء', 'Faiha')),
  ('adailiyacoop', HARD, 'جمعية العديلية التعاونية', 'جمعية العديلية التعاونية', 16, coop('العديلية', 'Adailiya')),
  ('khaldiyacoop', HARD, 'جمعية الخالدية التعاونية', 'جمعية الخالدية التعاونية', 16, coop('الخالدية', 'Khaldiya')),
  ('surracoop', HARD, 'جمعية السرة التعاونية', 'جمعية السرّة التعاونية', 16, coop('السرة', 'Surra')),
  ('bayancoop', HARD, 'جمعية بيان التعاونية', 'جمعية بيان التعاونية', 16, coop('بيان', 'Bayan')),
  ('mishrefcoop', HARD, 'جمعية مشرف التعاونية', 'جمعية مشرف التعاونية', 16, coop('مشرف', 'Mishref')),
  ('salwacoop', HARD, 'جمعية سلوى التعاونية', 'جمعية سلوى التعاونية', 16, coop('سلوى', 'Salwa')),
  ('dasmacoop', HARD, 'جمعية الدسمة التعاونية', 'جمعية الدسمة وبنيد القار التعاونية', 16, coop('الدسمة', 'بنيد القار', 'Dasma', 'Bneid Al Gar', 'Bneid')),
  ('daiyacoop', HARD, 'جمعية الدعية التعاونية', 'جمعية الدعية التعاونية', 16, coop('الدعية', 'Daiya', 'Daiyah')),
  ('maternity', HARD, 'مستشفى الولادة', 'مستشفى الولادة', 16, ['مستشفى الولادة', 'الولادة', 'Maternity']),
  ('shababclub', HARD, 'نادي الشباب الرياضي', 'نادي الشباب الرياضي', 16, ['نادي الشباب', 'Al Shabab']),
  # ── تعجيزي ─────────────────────────────────────────────────────────────
  ('sadu', XHARD, 'بيت السدو', 'بيت السدو', 17, ['السدو', 'Sadu']),
  ('dickson', XHARD, 'بيت ديكسون', 'بيت ديكسون', 17, ['ديكسون', 'Dickson']),
  ('badrhouse', XHARD, 'بيت البدر', 'بيت البدر', 17, ['بيت البدر', 'البدر', 'Bader House', 'Al Bader']),
  ('kfas', XHARD, 'مؤسسة الكويت للتقدم العلمي', 'مؤسسة الكويت للتقدم العلمي', 17, ['التقدم العلمي', 'KFAS']),
  ('redcrescent', XHARD, 'جمعية الهلال الأحمر الكويتي', 'جمعية الهلال الأحمر الكويتي', 17, ['الهلال الأحمر', 'الهلال الاحمر', 'Red Crescent']),
  ('saharagolf', XHARD, 'نادي الجولف صحارى', 'منتجع صحارى للغولف', 16, ['صحارى', 'Sahara', 'Golf', 'جولف', 'غولف']),
  ('motorsport', XHARD, 'حلبة الكويت للسباقات', 'مدينة الكويت لرياضة المحرّكات', 15, ['رياضة المحركات', 'المحركات', 'Motorsport', 'Motor']),
  ('sahelclub', XHARD, 'نادي الساحل الرياضي', 'نادي الساحل الرياضي', 16, ['الساحل', 'Sahel']),
  ('burganclub', XHARD, 'نادي برقان الرياضي', 'نادي برقان الرياضي', 16, ['برقان', 'Burgan']),
  ('nasrclub', XHARD, 'نادي النصر الرياضي', 'نادي النصر الرياضي', 16, ['نادي النصر', 'Al Nasr', 'Nasr SC']),
  ('yarmoukcoop', XHARD, 'جمعية اليرموك التعاونية', 'جمعية اليرموك التعاونية', 16, coop('اليرموك', 'Yarmouk')),
  ('qurtobacoop', XHARD, 'جمعية قرطبة التعاونية', 'جمعية قرطبة التعاونية', 16, coop('قرطبة', 'Qortuba', 'Qurtuba')),
  ('mansouriyacoop', XHARD, 'جمعية المنصورية التعاونية', 'جمعية المنصورية التعاونية', 16, coop('المنصورية', 'Mansouriya')),
  ('fintascoop', XHARD, 'جمعية الفنطاس التعاونية', 'جمعية الفنطاس التعاونية', 16, coop('الفنطاس', 'Fintas')),
  ('fahaheelcoop', XHARD, 'جمعية الفحيحيل التعاونية', 'جمعية الفحيحيل التعاونية', 16, coop('الفحيحيل', 'Fahaheel')),
  ('mangafcoop', XHARD, 'جمعية المنقف التعاونية', 'جمعية المنقف التعاونية', 16, coop('المنقف', 'Mangaf')),
  ('abuhalifacoop', XHARD, 'جمعية أبو حليفة التعاونية', 'جمعية أبو حليفة التعاونية', 16, coop('ابو حليفة', 'أبو حليفة', 'Abu Halifa')),
  ('ahmadicoop', XHARD, 'جمعية الأحمدي التعاونية', 'جمعية الأحمدي التعاونية', 16, coop('الأحمدي', 'الاحمدي', 'Ahmadi')),
  ('jahracoop', XHARD, 'جمعية الجهراء التعاونية', 'جمعية الجهراء التعاونية', 16, coop('الجهراء', 'Jahra')),
  ('firdouscoop', XHARD, 'جمعية الفردوس التعاونية', 'جمعية الفردوس التعاونية', 16, coop('الفردوس', 'Firdous')),
  ('ardiyacoop', XHARD, 'جمعية العارضية التعاونية', 'جمعية العارضية التعاونية', 16, coop('العارضية', 'Ardiya')),
  ('sabahnasercoop', XHARD, 'جمعية صباح الناصر التعاونية', 'جمعية صباح الناصر التعاونية', 16, coop('صباح الناصر', 'Sabah Al Nasser')),
  ('sulaibikhatcoop', XHARD, 'جمعية الصليبخات التعاونية', 'جمعية الصليبخات التعاونية', 16, coop('الصليبخات', 'الصليبيخات', 'Sulaibikhat')),
  ('dohacoop', XHARD, 'جمعية الدوحة التعاونية', 'جمعية الدوحة التعاونية', 16, coop('الدوحة', 'Doha')),
  ('nahdhacoop', XHARD, 'جمعية النهضة التعاونية', 'جمعية النهضة التعاونية', 16, coop('النهضة', 'Nahdha', 'Nahda')),
  ('farwaniyacoop', XHARD, 'جمعية الفروانية التعاونية', 'جمعية الفروانية التعاونية', 16, coop('الفروانية', 'Farwaniya')),
  ('khaitancoop', XHARD, 'جمعية خيطان التعاونية', 'جمعية خيطان التعاونية', 16, coop('خيطان', 'Khaitan')),
  ('omariyacoop', XHARD, 'جمعية العمرية التعاونية', 'جمعية العمرية التعاونية', 16, coop('العمرية', 'Omariya')),
  ('rabiyacoop', XHARD, 'جمعية الرابية التعاونية', 'جمعية الرابية التعاونية', 16, coop('الرابية', 'Rabiya', 'Rabieh', 'Rabiah')),
  ('hattincoop', XHARD, 'جمعية حطين التعاونية', 'جمعية حطّين التعاونية', 16, coop('حطين', 'Hateen', 'Hitteen')),
]

# spares, used if a main entry fails review
SPARE = [
  ('zahracoop', XHARD, 'جمعية الزهراء التعاونية', 'جمعية الزهراء التعاونية', 16, coop('الزهراء', 'Zahra')),
  ('siddiqcoop', XHARD, 'جمعية الصديق التعاونية', 'جمعية الصديق التعاونية', 16, coop('الصديق', 'Siddiq')),
  ('salamcoop', XHARD, 'جمعية السلام التعاونية', 'جمعية السلام التعاونية', 16, coop('السلام', 'Salam')),
]

COORD = {'greenisland': (29.3650, 48.0267)}  # the island's body, not the water or lagoon

# Labels OCR missed, found by eye: [left, top, right, bottom] in the 1600×1120 frame.
MANUAL = {
  'mubarakiya': [[715, 755, 1040, 805]],        # مطعم شباب المباركية
  'amirihospital': [[295, 348, 610, 392]],      # مواقف مستشفى الأميري
  'salmiyaclub': [[870, 405, 1180, 448]],       # مسرح نادي السالمية
  'shadadiya': [[95, 295, 318, 372]],           # الحرم الطبي - جامعة الكويت
  'sharq': [[735, 800, 1012, 852]],             # مارينا سوق شرق
  'jaberhospital': [[1075, 475, 1405, 525]],    # مستشفى جابر بوابة 2
  'kaifancoop': [[1000, 1068, 1240, 1112], [685, 0, 735, 66]],  # جمعية كيفان فرع ٤ · «كيفان» عموديّ
  'salmiyacoop': [[435, 475, 632, 518]],        # حديقة السالمية
  'sulaibikhatcoop': [[0, 170, 75, 275]],       # حديقة الصليبخات العامة (على الحافة)
  'sabahhospital': [[0, 195, 200, 250]],       # مستشفى منطقة الصباح (على الحافة)
  'mangafcoop': [[1495, 488, 1600, 540], [495, 720, 590, 770], [240, 1050, 495, 1095], [0, 828, 195, 885]],  # المنقف ×3 · Mangaf block
  'omariyacoop': [[1090, 190, 1245, 238], [715, 262, 885, 312], [315, 322, 470, 370], [1435, 148, 1590, 198]],  # شارع العمرية ×4
}

if __name__ == '__main__':
    g = {}
    for r in json.load(open(f'{HERE}/google-geocoded.json')):
        if r['lat'] and r['q'] not in g:
            g[r['q']] = (float(r['lat']), float(r['lon']))
    spec = []
    for key, lvl, q, ans, z, terms in P + SPARE:
        la, lo = COORD.get(key) or g[q]
        spec.append({'key': key, 'level': lvl, 'answer': ans, 'lat': la, 'lon': lo, 'z': z,
                     'terms': terms, 'manual': MANUAL.get(key, []), 'spare': (key, lvl, q, ans, z, terms) in SPARE})
    keys = [s['key'] for s in spec]
    assert len(keys) == len(set(keys)), 'duplicate key'
    main = [s for s in spec if not s['spare']]
    for l in (EASY, MED, HARD, XHARD):
        print(l, sum(s['level'] == l for s in main))
    json.dump(spec, open(f"{HERE}/spec.json", "w"), ensure_ascii=False, indent=0)
