-- ذاكرة الأسئلة عبر الجلسات — SPEC القسم ٨، وهو يسمّيها «جوهر النظام».
--
-- كل ما ظهر على الشاشة يُسجَّل، أصابه أحد أم لا. بدون هذا يصير احتمال
-- التكرار في الجلسة الثانية ٥٤٪ وفي الثالثة ٧٩٪.
--
-- الحجم مهمل: ٦٣٨ معرّفاً ≈ ٣ كيلوبايت للحساب.

create table public.used_questions (
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  used_at     timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- المفتاح الأساسي المركّب يجعل تسجيل سؤال ظهر مرّتين بلا أثر — وهذا مقصود:
-- `insert ... on conflict do nothing` يكفي، ولا حاجة لفحص قبل الكتابة.

comment on column public.used_questions.used_at is
  'زمن أوّل ظهور. تعتمد عليه قاعدة «الأقدم استخداماً» في خوارزمية السحب عند نفاد المستوى (SPEC ٨).';

-- لا عمود category ولا level هنا **عمداً**: بنك الأسئلة يُشحن مع التطبيق
-- (data/questions-bank-v5.json)، فالعميل يحلّ تصنيف أي معرّف ومستواه بنفسه.
-- نسخُهما هنا يخلق مصدرَي حقيقة يفترقان أوّل ما يُصحَّح تصنيف سؤال في البنك.

-- ترتيب «الأقدم استخداماً» لكل حساب.
create index used_questions_oldest_idx
  on public.used_questions (user_id, used_at);

alter table public.used_questions enable row level security;

create policy "used_questions: read own"
  on public.used_questions for select
  using ((select auth.uid()) = user_id);

-- الإضافة مسموحة لصاحب الحساب: تسجيل سؤال ظهر ليس فعلاً مربحاً يُساء استغلاله،
-- وأسوأ ما يفعله لاعب بنفسه هو أن يحرم نفسه من أسئلة لم يرها.
create policy "used_questions: insert own"
  on public.used_questions for insert
  with check ((select auth.uid()) = user_id);

-- **لا حذف ولا تعديل.** الذاكرة تراكميّة بالتعريف؛ ومن يستطيع حذفها يستطيع
-- إعادة ضبط اللعبة كلها ليسمع الأسئلة السهلة نفسها كل مرّة.
