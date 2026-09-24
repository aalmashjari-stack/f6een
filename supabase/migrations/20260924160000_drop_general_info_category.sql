-- حذف فئة «معلومات عامة» (رفض علي ٢٤ سبتمبر ٢٠٢٦).
--
-- أُنشئت في `20260924150000_general_info_category.sql` وطُبّقت على القاعدة،
-- ورُفعت مسوّداتها الـ200 ولم يُعتمد منها شيء — فلا أسئلة في
-- `question_overrides` تُحذف. والفئة ظاهرةٌ (`hidden = false`) بلا أسئلة،
-- فتُحذف هي لا تُخفى.
--
-- والمسوّدات تُردّ إلى «مرفوضة» ولا تُحذف، كما في
-- `20260914100000_drop_qaael_category.sql`: المرفوضة مرجعُ فحص التكرار في
-- `check-drafts`.

delete from public.question_overrides o
 where o.category = 'معلومات عامة';

update public.question_drafts d
   set status = 'rejected', decided_at = now()
 where d.category = 'معلومات عامة'
   and d.status = 'pending';

delete from public.categories c
 where c.name = 'معلومات عامة';
