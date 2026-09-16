-- إعادة بناء «الزمن الجميل» (قرار علي ١٦ سبتمبر ٢٠٢٦): «الأسئلة موسوعيّة مو حنين».
--
-- الفئة (137 سؤالاً، 131 حيّاً) كانت سنواتٍ ومؤسّسين ومؤلّفين — «من مؤلّف
-- ناروتو؟» و«محرّك البحث قبل غوغل؟» — لا ذكرياتِ مجلس. والمطلوب فئةٌ على
-- مبدأ «تذكر؟»: أشياءُ البيت والبقالة وأماكن الكويت وتلفزيونها والكرتون
-- المدبلج، بصورةٍ حيثما أمكن. فتُفرَّغ الفئة وتُبنى من المسوّدات من جديد.
--
-- **الموسوعيّ الصالح يُنقل لا يُحذف** — 39 سؤالاً إلى فئته: مؤلّفو
-- المانغا إلى «أنمي»، مصمّمو الألعاب إلى «ألعاب فيديو»، أجهزةٌ لم تدخل
-- بيوتنا (كومودور، ماكنتوش، ميني ديسك) إلى «تقنية ومنوعات»، القنوات
-- وطاش ما طاش إلى «سينما ودراما»، ودرب الزلق إلى «مسلسلات كويتية». وقبل
-- النقل فُحصت كلّ فئةٍ هدفٍ فلم يُوجد فيها السؤال نفسه؛ والإجابات التي
-- تلتقي بأخرى هناك (إم بي سي، ناصر القصبي، حياة الفهد، سعد الفرج) تُصرَّح
-- عائلتها فلا تجتمعان في جلسة. وبقيّة الأسئلة تُحذف مع حجوبها، ومسوّداتها
-- تُردّ إلى «مرفوضة» مرجعاً لفحص التكرار (كما في حذف «من القائل؟»).
--
-- الفئة نفسها تبقى بغلافها ومظلّتها؛ الدفعة الجديدة تصلها من المسوّدات.
-- **وبين هذه الهجرة واعتماد الدفعة تكون الفئة فارغة** فلا تظهر للاعب —
-- دقائق، لا أكثر. `updated_at` تُرفع لأنّ `bank_signature` تقرأ أقصاها.

update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1250';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1250';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1251';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1251';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1252';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1252';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1249';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1249';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1253';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1253';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1255';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1255';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1268';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1268';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1269';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1269';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1264';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1264';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1265';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1265';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1258';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1258';
update public.question_overrides set category = 'أنمي', family = family, updated_at = now() where question_id = 'ADM1259';
update public.question_drafts set category = 'أنمي' where question_id = 'ADM1259';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1344';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1344';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1346';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1346';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1345';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1345';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1342';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1342';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1334';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1334';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1347';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1347';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1236';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1236';
update public.question_overrides set category = 'ألعاب فيديو', family = family, updated_at = now() where question_id = 'ADM1239';
update public.question_drafts set category = 'ألعاب فيديو' where question_id = 'ADM1239';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1240';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1240';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1241';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1241';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1304';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1304';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1305';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1305';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1296';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1296';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1300';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1300';
update public.question_overrides set category = 'تقنية ومنوعات', family = family, updated_at = now() where question_id = 'ADM1319';
update public.question_drafts set category = 'تقنية ومنوعات' where question_id = 'ADM1319';
update public.question_overrides set category = 'سينما ودراما', family = 'إم بي سي', updated_at = now() where question_id = 'ADM1242';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1242';
update public.question_overrides set category = 'سينما ودراما', family = 'إم بي سي', updated_at = now() where question_id = 'ADM1243';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1243';
update public.question_overrides set category = 'سينما ودراما', family = family, updated_at = now() where question_id = 'ADM1212';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1212';
update public.question_overrides set category = 'سينما ودراما', family = family, updated_at = now() where question_id = 'ADM1213';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1213';
update public.question_overrides set category = 'سينما ودراما', family = 'ناصر القصبي', updated_at = now() where question_id = 'ADM1181';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1181';
update public.question_overrides set category = 'سينما ودراما', family = family, updated_at = now() where question_id = 'ADM1203';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1203';
update public.question_overrides set category = 'سينما ودراما', family = family, updated_at = now() where question_id = 'ADM1209';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1209';
update public.question_overrides set category = 'سينما ودراما', family = 'حياة الفهد', updated_at = now() where question_id = 'ADM1214';
update public.question_drafts set category = 'سينما ودراما' where question_id = 'ADM1214';
update public.question_overrides set category = 'مسلسلات كويتية', family = family, updated_at = now() where question_id = 'ADM1246';
update public.question_drafts set category = 'مسلسلات كويتية' where question_id = 'ADM1246';
update public.question_overrides set category = 'مسلسلات كويتية', family = family, updated_at = now() where question_id = 'ADM1210';
update public.question_drafts set category = 'مسلسلات كويتية' where question_id = 'ADM1210';
update public.question_overrides set category = 'مسلسلات كويتية', family = 'سعد الفرج', updated_at = now() where question_id = 'ADM1247';
update public.question_drafts set category = 'مسلسلات كويتية' where question_id = 'ADM1247';
update public.question_overrides set category = 'مسلسلات كويتية', family = family, updated_at = now() where question_id = 'ADM1180';
update public.question_drafts set category = 'مسلسلات كويتية' where question_id = 'ADM1180';

-- الباقي (98) يُحذف مع حجوبه.
delete from public.question_flags where question_id in (select question_id from public.question_overrides where category = 'الزمن الجميل');
delete from public.question_overrides where category = 'الزمن الجميل';

update public.question_drafts d
   set status = 'rejected', decided_at = now()
 where d.category = 'الزمن الجميل' and d.status = 'approved';
