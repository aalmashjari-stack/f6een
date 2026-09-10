-- فئة «لغة عربية» تحت مظلّة «ثقافة عامة» (قرار علي ١١ سبتمبر ٢٠٢٦).
--
-- ثالثةُ فئات هذه المظلّة بعد «حضارات قديمة». وتداخلُها في البنك الحيّ
-- خمسةٌ وثلاثون سؤالاً — أقلُّ ما وجدتُ حين قِست المقترحات، ودفعتُها
-- الأولى خرجت بصفر إنذارٍ وصفر مانع.

insert into public.categories (name, group_name, is_extra) values
  ('لغة عربية', 'ثقافة عامة', true)
on conflict (name) do update set group_name = excluded.group_name;
