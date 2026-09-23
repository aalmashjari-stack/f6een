-- فئة «الأسطورة» — المسلسل المصريّ (رمضان 2016، محمد رمضان) — طلب علي ٢٣ سبتمبر ٢٠٢٦.
--
-- تحت مظلّة «مسلسلات اجنبية» بقراره، وهو سيعيد تسمية المظلّة «مسلسلات» من
-- اللوحة. وخارج الديربي كأخواتها في المظلّة. أسئلتها الـ120 (30 لكلّ خليّة)
-- تصل من طبقة المسوّدات بعد اعتماده، ومصدرها ملخّصات الحلقات في elcinema
-- واليوم السابع لا الذاكرة.

insert into public.categories (name, group_name, is_extra, derby, hidden) values
  ('الأسطورة', 'مسلسلات اجنبية', true, false, false)
on conflict (name) do update
  set group_name = excluded.group_name,
      derby      = excluded.derby;
