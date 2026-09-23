-- فئتا «الدوري الإسباني» و«الدوري الإيطالي» (طلب علي ٢٣ سبتمبر ٢٠٢٦: «فئتين
-- جديدتين في رياضة هما الدوري الإسباني والدوري الإيطالي»).
--
-- تحت مظلّة «رياضة» مع الدوري الإنجليزي وأخواته، وخارج الديربي كسائر الرياضة
-- (SPEC §الديربي). أسئلتها تصل من طبقة المسوّدات بعد اعتماد علي، لا من هنا.

insert into public.categories (name, group_name, is_extra, derby, hidden) values
  ('الدوري الإسباني', 'رياضة', true, false, false),
  ('الدوري الإيطالي', 'رياضة', true, false, false)
on conflict (name) do update
  set group_name = excluded.group_name,
      derby      = excluded.derby;
