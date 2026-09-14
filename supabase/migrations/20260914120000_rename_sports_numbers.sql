-- إعادة تسمية فئة «رياضة وأرقام» إلى «رياضة عامة» (قرار علي ١٤ سبتمبر ٢٠٢٦).
--
-- اللبس نفسه الذي أصلحته `20260914110000_rename_din_wa_sira.sql`: الفئة
-- كانت تُعرض باسم «رياضة» وهو اسم مظلّتها التي تضمّ معها كأس العالم
-- والدوريّين. والاسم الجديد يقول ما هي: عموم الرياضة إزاء الفئات المخصّصة.
--
-- الثلاثة تُعدَّل صراحةً (لا مفتاح أجنبيّ على الاسم)، و`updated_at` تُرفع
-- حتى تتغيّر `bank_signature` في أجهزة اللاعبين. والملفّان المشحونان
-- (`questions-bank-v5.json` و`questions-extra.json`) وخريطة الصور في
-- الـcommit نفسه.

update public.categories
   set name = 'رياضة عامة'
 where name = 'رياضة وأرقام';

update public.question_overrides
   set category = 'رياضة عامة', updated_at = now()
 where category = 'رياضة وأرقام';

update public.question_drafts
   set category = 'رياضة عامة'
 where category = 'رياضة وأرقام';
