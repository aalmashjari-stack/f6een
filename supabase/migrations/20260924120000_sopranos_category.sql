-- فئة «The Sopranos» — المسلسل الأمريكيّ (HBO، 1999–2007) — طلب علي ٢٤ سبتمبر ٢٠٢٦.
--
-- تحت مظلّة «مسلسلات» مع أخواتها (Breaking bad، Dexter…)، وخارج الديربي
-- مثلها. أسئلتها الـ120 (30 لكلّ خليّة) تصل من طبقة المسوّدات بعد اعتماده،
-- منها 28 سؤالاً مصوَّراً («من هذه الشخصية؟» بمفاتيح `pic-sop-…`) وسبعة
-- وجوه ممثّلين صوراً للإجابة (`pic-face-…`).

insert into public.categories (name, group_name, is_extra, derby, hidden) values
  ('The Sopranos', 'مسلسلات', true, false, false)
on conflict (name) do update
  set group_name = excluded.group_name,
      derby      = excluded.derby;
