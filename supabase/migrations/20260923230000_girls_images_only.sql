-- **فئتا «بنات» بالصور وحدها** (قرار علي ٢٣ سبتمبر ٢٠٢٦):
-- «استبعد أيّ سؤال من فئات البنات ما فيه صور».
--
-- فحُجب من «مكياج وعطور» و«موضة وماركات» كلُّ سؤالٍ حيٍّ بلا صورةٍ في
-- السؤال (`image`) ولا مع الإجابة (`answer_image`) — 109 أسئلة. حجبٌ لا حذف،
-- فيُعاد أيّها من اللوحة إن شاء.
--
-- الخلايا بعده: مكياج — سهل 32 · متوسط 34 · صعب 29 · تعجيزي 46؛
-- موضة — سهل 35 · متوسط 36 · صعب 35 · تعجيزي 44.

insert into public.question_flags (question_id, status, note, reviewed_at)
select question_id, 'disabled',
       'بنات: الصور وحدها — قرار علي ٢٣ سبتمبر ٢٠٢٦', now()
  from public.question_overrides
 where category in ('مكياج وعطور', 'موضة وماركات')
   and image is null and answer_image is null
   and question_id in (
     'ADM6313', 'ADM6314', 'ADM6315', 'ADM6340', 'ADM6357', 'ADM6358', 'ADM6380', 'ADM6381', 'ADM6394', 'ADM6395', 'ADM6396', 'ADM6397', 'ADM6398', 'ADM6414', 'ADM6417', 'ADM6418', 'ADM6430', 'ADM6431', 'ADM6432', 'ADM6433', 'ADM6435', 'ADM6436', 'ADM6438', 'ADM6439', 'ADM6456', 'ADM6460', 'ADM6461', 'ADM6815', 'ADM6816', 'ADM6817', 'ADM6825', 'ADM6826', 'ADM6827', 'ADM6835', 'ADM6836', 'ADM6837', 'ADM6856', 'ADM6857', 'ADM6865', 'ADM6866', 'ADM6867', 'ADM6875', 'ADM6876', 'ADM6877', 'ADM6886', 'ADM6887', 'ADM7907', 'ADM7908', 'ADM7909', 'ADM7910', 'ADM7911', 'ADM7912', 'ADM7913', 'ADM7914', 'ADM7915', 'ADM7916', 'ADM7927', 'ADM7928', 'ADM7929', 'ADM7930', 'ADM7931', 'ADM7932', 'ADM7933', 'ADM7934', 'ADM7935', 'ADM7936', 'ADM7947', 'ADM7948', 'ADM7949', 'ADM7950', 'ADM7951', 'ADM7952', 'ADM7953', 'ADM7954', 'ADM7955', 'ADM7956', 'ADM7975', 'ADM7976', 'ADM7987', 'ADM7988', 'ADM7989', 'ADM7990', 'ADM7991', 'ADM7992', 'ADM7993', 'ADM7994', 'ADM7995', 'ADM7996', 'ADM8007', 'ADM8008', 'ADM8009', 'ADM8010', 'ADM8011', 'ADM8012', 'ADM8013', 'ADM8014', 'ADM8015', 'ADM8016', 'ADM8027', 'ADM8028', 'ADM8029', 'ADM8030', 'ADM8031', 'ADM8032', 'ADM8033', 'ADM8034', 'ADM8035', 'ADM8036', 'ADM8055')
on conflict (question_id) do update
  set status = 'disabled', note = excluded.note, reviewed_at = now();
