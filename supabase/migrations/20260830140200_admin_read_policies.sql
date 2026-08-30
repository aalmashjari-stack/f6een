-- لوحة الإدارة (٣) — قراءة الجداول كلّها للمدير.
--
-- سياسات القراءة تُجمع بـ«أو»: صاحب الصفّ يقرأ صفّه كما كان، والمدير يقرأ
-- الكلّ. ولا سياسة كتابة لأحدٍ هنا — تعديل الرصيد والأكواد يمرّ بدوالّ
-- الإدارة وحدها، فيبقى للقاعدة الحاكمة استثناءٌ واحد مُراجَع لا بابان.

create policy "profiles: admin reads all"
  on public.profiles for select using (public.is_admin());

create policy "sessions: admin reads all"
  on public.sessions for select using (public.is_admin());

create policy "used_questions: admin reads all"
  on public.used_questions for select using (public.is_admin());

-- gift_codes لم يكن عليها سياسة قراءة أصلاً (لا أحد يتصفّح الأكواد الصالحة).
create policy "gift_codes: admin reads all"
  on public.gift_codes for select using (public.is_admin());

create policy "gift_redemptions: admin reads all"
  on public.gift_redemptions for select using (public.is_admin());
