/*
   **حجبُ أسئلة «ما الرواية؟» من فئة «إيموجي»** — قرار علي ١٥ سبتمبر ٢٠٢٦
   بعد الاعتماد: «أريد استبعاد أسئلة ما الرواية»، وبدائلُها مسلسلاتٌ
   ومسرحيّاتٌ كويتيّة وأمثالٌ خليجيّة وأفلامٌ مشهورة (دفعة في المسوّدات).

   حجبٌ لا حذف — كما في مراجعة البنك (١١–١٢ سبتمبر): `admin_delete_question`
   ترفض أن تنزل الخليّة عن عشرين، وثمانيةٌ من «صعب» وتسعةٌ من «تعجيزي»
   تُنزلها إلى 12 و11. والمحجوب لا يُسحب (`blocked_questions`) من لحظة
   الإقلاع التالي، والبدائل تُعيد الخليّة إلى عشرين فأكثر بعد الاعتماد.

   ومعها ADM5365 («🥬 💪 ⚓ → باباي»): واقعةٌ مكرّرة مع E483 التي جوابها
   «بوباي» — رسمٌ آخر للاسم نفسه أفلت من مطابقة الجواب، وبديله في الدفعة.
*/

insert into public.question_flags (question_id, status, note, reviewed_at)
select o.question_id, 'disabled',
       'إيموجي: استبعاد «ما الرواية؟» بقرار علي ١٥ سبتمبر ٢٠٢٦', now()
  from public.question_overrides o
 where o.category = 'إيموجي'
   and (o.question like '%ما الرواية؟%' or o.question_id = 'ADM5365')
on conflict (question_id) do update
  set status = 'disabled', note = excluded.note, reviewed_at = now();
