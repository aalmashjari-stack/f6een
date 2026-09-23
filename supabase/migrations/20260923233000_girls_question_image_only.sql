-- **فئتا «بنات»: الصورة في السؤال لا مع الإجابة** (قرار علي ٢٣ سبتمبر ٢٠٢٦):
-- «ما يهمّ هو أن تكون الصورة في السؤال» — ثمّ «نعم احجبها».
--
-- بعد حجب ما لا صورة فيه أصلاً (`20260923230000`) بقي 34 سؤالاً نصّيّاً
-- صورتُها تُكشف مع الإجابة (`answer_image`) لا في السؤال (`image`). حجبٌ لا حذف؛
-- وبدائلها أسئلةٌ مصوّرة في المسوّدات.

insert into public.question_flags (question_id, status, note, reviewed_at)
select question_id, 'disabled',
       'بنات: الصورة في السؤال — قرار علي ٢٣ سبتمبر ٢٠٢٦', now()
  from public.question_overrides
 where category in ('مكياج وعطور', 'موضة وماركات')
   and image is null
   and question_id in ('ADM6401', 'ADM6400', 'ADM6399', 'ADM6434', 'ADM6440', 'ADM6429', 'ADM6428', 'ADM6441', 'ADM6437', 'ADM6419', 'ADM6413', 'ADM6412', 'ADM6416', 'ADM6420', 'ADM6421', 'ADM6415', 'ADM6321', 'ADM6319', 'ADM6317', 'ADM6320', 'ADM6318', 'ADM6316', 'ADM6354', 'ADM6356', 'ADM6355', 'ADM6361', 'ADM6360', 'ADM6359', 'ADM6338', 'ADM6337', 'ADM6336', 'ADM6339', 'ADM6335', 'ADM6341')
on conflict (question_id) do update
  set status = 'disabled', note = excluded.note, reviewed_at = now();
