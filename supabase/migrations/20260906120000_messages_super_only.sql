-- رسائل «تواصل معنا» إلى المدير العامّ وحده — ما فات هجرةَ الأدوار.
--
-- هجرةُ ٤ سبتمبر (`20260904090000_admin_roles.sql`) فصلت الدورين ونقلت
-- سياسات القراءة المباشرة إلى `is_super()`، وكتبت في تعليلها:
--
--   «لو بقيت على `is_admin()` لقرأ المحرّرُ جدولَ الحسابات والأرصدة من
--    واجهة الجداول رغم إقفال الدوالّ في وجهه.»
--
-- ونقلت خمسةً: profiles و sessions و used_questions و gift_codes و
-- gift_redemptions. **وفاتها `messages`** — أُنشئ قبلها بثلاثة أيام
-- (١ سبتمبر) فلم يكن في القائمة التي مشّطتها.
--
-- فبقيت الحالُ متناقضة: الدالّة `admin_messages()` تشترط `is_super()`
-- ولسانُ «الرسائل» مخفيٌّ عن المحرّر في اللوحة — بينما سياستا الجدول
-- تقولان `is_admin()`. والإخفاءُ في الواجهة زينةٌ لا حماية (نفسُ قاعدة
-- المشروع): المفتاح العلنيّ في يد الجميع، فمن نادى `/rest/v1/messages`
-- قرأ بريدَ كلّ من راسل ونصَّ رسالته — بل وكتب في `status`.
--
-- وهذا يخالف حدَّ الدور كما كُتب حرفاً: «ولا يرى حساباً ولا رصيداً ولا
-- كوداً ولا رسالة».
--
-- ولا يمسّ هذا بابَ الإرسال: `send_message` دالّةُ `security definer`
-- تتجاوز RLS بحكم تعريفها، فاللاعب يرسل كما كان.

-- وتُسقَط الأسماءُ الجديدة أيضاً قبل إنشائها: هجرةٌ لا تُعاد بأمان تسقط
-- بـ`42710 already exists` عند أوّل إعادة تشغيل أو `db push`.
drop policy if exists "messages: admin reads"   on public.messages;
drop policy if exists "messages: admin updates" on public.messages;
drop policy if exists "messages: super reads"   on public.messages;
drop policy if exists "messages: super updates" on public.messages;

create policy "messages: super reads"
  on public.messages for select
  using (public.is_super());

create policy "messages: super updates"
  on public.messages for update
  using (public.is_super())
  with check (public.is_super());
