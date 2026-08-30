-- فئات تُضاف من اللوحة — فوق الفئات المشحونة.
--
-- نفس عقد `question_overrides`: البنك يحمل فئاته، والقاعدة تحمل الزائد
-- وحده. والاسم هو المفتاح لأنّه هو الذي يربط السؤال بفئته في البنك
-- (`question.category` نصٌّ لا رقم) — ومعرّفٌ رقميّ هنا يعني جدول ربطٍ
-- لا يوجد في الملفّ المشحون.
--
-- **وإعادة التسمية ليست عمليّة**: تُغيّر الاسم في مكانين لا يعرف أحدهما
-- الآخر (القاعدة والملفّ)، فتصير أسئلة البنك بفئة لا وجود لها. الفئة
-- تُضاف وتُحذف فقط.

create table public.categories (
  name       text primary key,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

comment on table public.categories is
  'الفئات المضافة من اللوحة. فئات البنك المشحون ليست هنا — تُدمج في العميل.';

alter table public.categories enable row level security;

create policy "categories: admin reads all"
  on public.categories for select using (public.is_admin());
