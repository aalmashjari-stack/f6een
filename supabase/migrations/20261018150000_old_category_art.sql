-- صور الفئات القديمة الملوّنة تعود إلى الموقع (طلب علي ١٨ أكتوبر ٢٠٢٦، «ادمج
-- الشغل الي موجود بالسيرفر المحلي»). كانت على السيرفر المحلّيّ وحده بتجاوزٍ في
-- categoryArt.ts يقرأ dev-old-art.json؛ واللوح الجديد (الرسمة تملأ الوحدة 3:2)
-- مبنيٌّ عليها، والرسوم المائيّة المرفوعة ٢٣ سبتمبر طوليّة 2:3 فيقصّها.
--
-- 28 فئة يعود رابطها إلى ملفّها القديم في الدلو، و14 فئة مشحونة يُمسح رابطها
-- فتعود صورة الحزمة. والفئات التسع التي لا قديمة لها لا تُمسّ.
--
-- **الحارس:** ردُّ 200 من الرابط العامّ لا يثبت وجود الملفّ (الـCDN يُبقي
-- المحذوف)، فالدليل صفُّ storage.objects. وأيُّ ملفٍّ غائب أو فئةٍ لا صفَّ لها
-- يُسقط الهجرة كلّها بدل أن تترك بطاقةً بلا صورة.

do $$
declare
  base constant text := 'https://ajtexbwnrzwidoncbodi.supabase.co/storage/v1/object/public/art/';
  r record;
  n int;
begin
  for r in
    select * from (values
    ('أكلات', 'categories/1788456247219-ig5po5.png'),
    ('سيارات', 'categories/1788642497998-ul6byx.png'),
    ('أغاني وطرب', 'categories/1788895236935-ea18br.png'),
    ('معالم', 'categories/1788895289223-fh3emw.png'),
    ('الزمن الجميل', 'categories/1788949375257-3f1z63.png'),
    ('كأس العالم', 'categories/1789076551758-4taz6t.png'),
    ('دوري أبطال أوروبا', 'categories/1789076615184-4tkbfx.png'),
    ('الدوري الإنجليزي', 'categories/1789076749890-6fpx3d.png'),
    ('السيرة النبوية', 'categories/1789133545075-j077nd.png'),
    ('القرآن الكريم', 'categories/1789133669115-3u86lr.png'),
    ('حضارات قديمة', 'categories/1789133861755-venbuv.png'),
    ('ديزني وبيكسار', 'categories/1789151122167-humjjv.png'),
    ('أنمي', 'categories/1789151187887-ug0p8x.png'),
    ('ألعاب فيديو', 'categories/1789151376979-dhgldw.png'),
    ('الفقه والعبادات', 'categories/1789151535965-pe4wfh.png'),
    ('الصحابة والتابعون', 'categories/1789152672921-ya8spl.png'),
    ('قصص الأنبياء', 'categories/1789152930631-2ahrmj.png'),
    ('لغة عربية', 'categories/1789153698736-aq77un.png'),
    ('حروف', 'categories/1789377875871-rz00hn.png'),
    ('إيموجي', 'categories/1789470469779-xw9rx1.png'),
    ('Game of thrones', 'categories/1789493606516-nuyzgv.png'),
    ('Prison break', 'categories/1789493735678-f8m0zy.png'),
    ('Breaking bad', 'categories/1789493852396-65qs7z.png'),
    ('Dexter', 'categories/1789494117405-v0x39f.png'),
    ('أعلام دول', 'categories/1789494352480-hr1y7v.png'),
    ('شعارات', 'categories/1789494448831-he7ir8.png'),
    ('مكياج وعطور', 'categories/1789849451980-k0u93h.png'),
    ('موضة وماركات', 'categories/1789849461187-7ldtek.png')
    ) as t(name, path)
  loop
    if not exists (select 1 from storage.objects o where o.bucket_id = 'art' and o.name = r.path) then
      raise exception 'صورة «%» غائبة من الدلو: %', r.name, r.path;
    end if;
    update public.categories set art_url = base || r.path where name = r.name;
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'فئة «%» لا صفّ لها (%)', r.name, n;
    end if;
  end loop;

  update public.categories set art_url = null
  where name in ('جغرافيا ومعالم', 'تاريخ وحضارات', 'إسلامي', 'علوم واختراعات', 'طب وصحة', 'أحياء وفلك', 'أدب وفنون', 'تقنية ومنوعات', 'رياضة عامة', 'الكويت', 'سينما ودراما', 'من أنا؟', 'مشاهير', 'أمثال وألغاز');
end
$$;
