-- فئة «الدوري الألماني» (طلب علي ٢٣ سبتمبر ٢٠٢٦: «سو فئة الدوري الألماني
-- بنفس الطريقة» — أي كفئتي الإسباني والإيطالي في `20260923120000`).
--
-- تحت مظلّة «رياضة»، وخارج الديربي كسائر الرياضة (SPEC §الديربي). أسئلتها
-- تصل من طبقة المسوّدات بعد اعتماد علي، لا من هنا.

insert into public.categories (name, group_name, is_extra, derby, hidden) values
  ('الدوري الألماني', 'رياضة', true, false, false)
on conflict (name) do update
  set group_name = excluded.group_name,
      derby      = excluded.derby;
