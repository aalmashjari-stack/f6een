-- فئة «معلومات عامة» من جديد تحت «ثقافة عامة» — علي ٢٤ سبتمبر ٢٠٢٦.
--
-- حُذفت نسختها الأولى في `20260924160000_drop_general_info_category.sql`
-- لأنّ أسئلتها طرائف هامشيّة (ورق اللعب، وحدات القياس…). أمّا المطلوب فثقافةٌ
-- عامّة من كلّ المجالات: تاريخ وأدب وأساطير وشعوب، والفنون قليلة بطلبه.
-- والأسئلة الـ120 (30 لكلّ خليّة) تصل من طبقة المسوّدات بعد اعتماده.
--
-- وتدخل الديربي كسائر «ثقافة عامة» بقانون ١٥ سبتمبر.

insert into public.categories (name, group_name, is_extra, derby, hidden) values
  ('معلومات عامة', 'ثقافة عامة', true, true, false)
on conflict (name) do update
  set group_name = excluded.group_name,
      derby      = excluded.derby;
