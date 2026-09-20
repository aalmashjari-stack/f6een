-- بوستر العمل مع الكشف في «ولا كلمة» — طلب علي ٢٠ سبتمبر ٢٠٢٦ («مع الجواب
-- أظهر بوستر العمل إذا كان مسلسلاً أو مسرحيّةً أو فيلماً أو أغنية»)، وقبل
-- الاعتماد: فالمسوّدات تحمل **صورةَ الإجابة** كما تحمل صورةَ السؤال.
--
-- كانت `question_drafts` بلا `answer_image`، فكانت صورُ الإجابة تُربط بهجرةٍ
-- **بعد** الاعتماد بمطابقة الفئة والنصّ (دفعتا «بنات» ١٩ سبتمبر). وعلي يريد
-- أن يرى البوستر وهو يقرّر — فالعمود يُضاف، والاعتمادُ ينسخه إلى
-- `question_overrides` كما ينسخ `image`، واللوحةُ تعرضه بجانب الإجابة.
--
-- والملصقات مشحونة (`pic-kilma-…` في `assets/pics/`) لا مرفوعة: 71 عملاً؛
-- الأمثالُ التسعة بلا صورة. وللأغنية صورةُ غلافٍ أو المغنّي — لا «بوستر» لها.
-- وهذه الهجرة تربط دفعةَ `c5df91a3` وحدها؛ ولا تمسّ حارسَ `agent_submit_drafts`
-- (الطريقُ لا يرسل صورَ إجابة بعد — تُربط بالهجرة كما هنا).

alter table public.question_drafts add column if not exists answer_image text;

comment on column public.question_drafts.answer_image is
  'صورةٌ تُكشف مع الإجابة (مفتاحٌ مشحون أو رابط في دلو art) — تُنسخ إلى question_overrides.answer_image عند الاعتماد.';

/* ═══════════════ الاعتماد ينسخ صورة الإجابة ═══════════════ */

create or replace function public.admin_approve_drafts(p_batch uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d       public.question_drafts;
  qid     text;
  added   integer := 0;
  skipped integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  for d in select * from public.question_drafts x
            where x.batch = p_batch and x.status = 'pending' order by x.id
  loop
    if not exists (select 1 from public.question_overrides o where o.category = d.category)
       and not exists (select 1 from public.categories c where c.name = d.category) then
      raise exception 'unknown_category: %', d.category;
    end if;

    /* المصوَّر خارج مقارنة النصّ — الفرق في الصورة لا في السؤال. */
    if d.image is null and exists (
      select 1 from public.question_overrides o
       where o.image is null
         and public.norm_question(o.question) = public.norm_question(d.question)
    ) then
      skipped := skipped + 1;
      update public.question_drafts set status = 'rejected', decided_at = now(),
             decided_by = (select auth.uid())
       where id = d.id;
      continue;
    end if;

    qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');

    insert into public.question_overrides
      (question_id, category, level, topic, question, answer, image, answer_image, family, origin, updated_by)
    values
      (qid, d.category, d.level, d.topic, d.question, d.answer, d.image, d.answer_image, d.family, 'new',
       (select auth.uid()));

    update public.question_drafts
       set status = 'approved', decided_at = now(),
           decided_by = (select auth.uid()), question_id = qid
     where id = d.id;
    added := added + 1;
  end loop;

  return jsonb_build_object('added', added, 'skipped', skipped);
end;
$$;

revoke execute on function public.admin_approve_drafts(uuid) from public, anon;
grant  execute on function public.admin_approve_drafts(uuid) to authenticated;

/* ═══════════════ ربط ملصقات دفعة «ولا كلمة» ═══════════════ */

update public.question_drafts d
   set answer_image = v.key
  from (values
  ('درب الزلق', 'pic-kilma-darb-alzalag'),
  ('باب الحارة', 'pic-kilma-bab-alhara'),
  ('طاش ما طاش', 'pic-kilma-tash'),
  ('خالتي قماشة', 'pic-kilma-khalti-gmasha'),
  ('شباب البومب', 'pic-kilma-shabab-albomb'),
  ('لن أعيش في جلباب أبي', 'pic-kilma-gilbab-abi'),
  ('الفيل الأزرق', 'pic-kilma-blue-elephant'),
  ('غزل البنات', 'pic-kilma-ghazal-albanat'),
  ('أبي فوق الشجرة', 'pic-kilma-abi-fawq-alshajara'),
  ('رصاصة في القلب', 'pic-kilma-rasasa-fi-alqalb'),
  ('مدرسة المشاغبين', 'pic-kilma-madrasat-almushaghibin'),
  ('العيال كبرت', 'pic-kilma-aleyal-kibrit'),
  ('شاهد ما شافش حاجة', 'pic-kilma-shahid-mashafsh'),
  ('باي باي لندن', 'pic-kilma-bye-bye-london'),
  ('ألف ليلة وليلة', 'pic-kilma-alf-leila'),
  ('قارئة الفنجان', 'pic-kilma-qariat-alfingan'),
  ('زلزال', 'pic-kilma-zilzal'),
  ('ساق البامبو', 'pic-kilma-saq-albambu'),
  ('زوارة خميس', 'pic-kilma-zuwarat-khamis'),
  ('الخراز', 'pic-kilma-alkharraz'),
  ('سيلفي', 'pic-kilma-selfie'),
  ('العاصوف', 'pic-kilma-alasouf'),
  ('ضيعة ضايعة', 'pic-kilma-daya-daya'),
  ('بقعة ضوء', 'pic-kilma-buqat-daw'),
  ('الشهد والدموع', 'pic-kilma-alshahd-waldumu'),
  ('ذئاب الجبل', 'pic-kilma-dhiab-aljabal'),
  ('عائلة الحاج متولي', 'pic-kilma-hag-metwally'),
  ('اللص والكلاب', 'pic-kilma-allis-walkilab'),
  ('إسماعيلية رايح جاي', 'pic-kilma-ismailia'),
  ('أسد وأربع قطط', 'pic-kilma-asad-w-arbaa-qitat'),
  ('عمارة يعقوبيان', 'pic-kilma-yacoubian'),
  ('على هامان يا فرعون', 'pic-kilma-ala-haman'),
  ('سك على بناتك', 'pic-kilma-sik-ala-banatak'),
  ('الواد سيد الشغال', 'pic-kilma-alwad-sayed'),
  ('أنشودة المطر', 'pic-kilma-unshudat-almatar'),
  ('يا مسافر وحدك', 'pic-kilma-ya-musafir'),
  ('رقية وسبيكة', 'pic-kilma-ruqaya-w-sabika'),
  ('على الدنيا السلام', 'pic-kilma-ala-aldunya-alsalam'),
  ('الأقدار', 'pic-kilma-alaqdar'),
  ('غشمشم', 'pic-kilma-ghashamsham'),
  ('الخوالي', 'pic-kilma-alkhawali'),
  ('الهيبة', 'pic-kilma-alhayba'),
  ('ليالي الحلمية', 'pic-kilma-layali-alhilmiya'),
  ('رأفت الهجان', 'pic-kilma-raafat-alhaggan'),
  ('المال والبنون', 'pic-kilma-almal-walbanun'),
  ('الكيت كات', 'pic-kilma-kitkat'),
  ('الإرهاب والكباب', 'pic-kilma-irhab-w-kabab'),
  ('واحد صفر', 'pic-kilma-wahid-sifr'),
  ('بني صامت', 'pic-kilma-bani-samit'),
  ('فرسان المناخ', 'pic-kilma-fursan-almanakh'),
  ('عزوبي السالمية', 'pic-kilma-azoubi-alsalmiya'),
  ('الأماكن', 'pic-kilma-alamakin'),
  ('مقادير', 'pic-kilma-maqadir'),
  ('عديل الروح', 'pic-kilma-adil-alruh'),
  ('سوق المقاصيص', 'pic-kilma-souq-almaqasis'),
  ('دموع في عيون وقحة', 'pic-kilma-dumu-fi-uyun'),
  ('أرابيسك', 'pic-kilma-arabesque'),
  ('بكيزة وزغلول', 'pic-kilma-bakiza-w-zaghloul'),
  ('الزير سالم', 'pic-kilma-alzir-salim'),
  ('أهل الغرام', 'pic-kilma-ahl-algharam'),
  ('حمام القيشاني', 'pic-kilma-hammam-alqishani'),
  ('دعاء الكروان', 'pic-kilma-dua-alkarawan'),
  ('شيء من الخوف', 'pic-kilma-shay-min-alkhawf'),
  ('باب الحديد', 'pic-kilma-bab-alhadid'),
  ('سواق الأتوبيس', 'pic-kilma-sawwaq-alotobis'),
  ('ممثل الشعب', 'pic-kilma-mumathil-alshaab'),
  ('سيف العرب', 'pic-kilma-saif-alarab'),
  ('هالو دولي', 'pic-kilma-hello-dolly'),
  ('سيدتي الجميلة', 'pic-kilma-sayidati-aljamila'),
  ('الأطلال', 'pic-kilma-alatlal'),
  ('أراك عصي الدمع', 'pic-kilma-arak-asiy-aldam')
  ) as v(title, key)
 where d.batch = 'c5df91a3-422d-4f9d-a82c-19929e4eb1d7'
   and d.category = 'ولا كلمة'
   and d.question = v.title
   and d.answer_image is null;
