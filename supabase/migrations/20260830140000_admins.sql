-- لوحة الإدارة — من هو المسؤول (١) الجدول.
--
-- **لا صلاحية إدارة في رمز الدخول ولا في `user_metadata`.** كلاهما يكتبه
-- العميل أو يُقرأ منه، ومن يعدّل حمولة رمزه يصير مديراً. الصلاحية صفٌّ في
-- جدولٍ لا سياسة كتابة عليه ولا قراءة — لا يُضاف إلّا من محرّر SQL بمفتاح
-- الخدمة، ولا يراه العميل أصلاً.
--
-- والملفّ مقسَّم على عدّة هجرات صغيرة عمداً: محرّر SQL يبتلع أجساد الدوالّ
-- حين تُلصق مع جداول في تشغيل واحد — وقع مرّتين (`delete_own_account` ثمّ
-- `redeem_gift_code`). فكل دالّة في ملفّها، وتُلصق وحدها.

create table public.admins (
  id       uuid primary key references auth.users (id) on delete cascade,
  note     text,
  added_at timestamptz not null default now()
);

comment on table public.admins is
  'حسابات الإدارة. تُملأ يدوياً من محرّر SQL وحده — لا واجهة تضيف مديراً.';

alter table public.admins enable row level security;

-- **بلا سياسات، عمداً.** لا قراءة ولا كتابة للعميل مهما كان دوره. الوصول
-- الوحيد عبر `is_admin()` وهي `security definer` فتتجاوز RLS بحكم تعريفها.
