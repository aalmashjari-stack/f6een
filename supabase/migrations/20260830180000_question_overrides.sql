-- تعديل الأسئلة وإضافتها من اللوحة — طبقةٌ فوق البنك المشحون.
--
-- **البنك يبقى ملفّاً يُشحن مع التطبيق، والقاعدة تحمل الفرق وحده.**
-- ثلاثة أسباب:
-- ١. اللعبة تعمل بلا إنترنت بعد التحميل (SPEC ٦). لو صار البنك في القاعدة
--    لاحتاج أوّلُ تشغيلٍ شبكةً، وسقطت الجلسة التي تبدأ في مجلسٍ بلا تغطية.
-- ٢. `data/questions-bank-v5.json` للقراءة فقط (CLAUDE.md).
-- ٣. الحمولة: ستّمئة سؤال ≈ ٣٤٠ كيلوبايت تُنقل في كل إقلاع، مقابل صفوفٍ
--    معدودة هي ما عُدّل فعلاً.
--
-- والدمج في العميل: صفٌّ بمعرّف موجود **يحلّ محلّ** سؤال البنك، وصفٌّ
-- بمعرّف جديد يُضاف. وحذف الصفّ يعيد الأصل المشحون كما كان — فالتعديل
-- قابل للتراجع دائماً، ولا يضيع سؤال البنك بتعديلٍ خاطئ.

create sequence if not exists public.question_admin_seq;

create table public.question_overrides (
  question_id text primary key,
  category    text not null,
  level       text not null check (level in ('سهل', 'متوسط', 'صعب')),
  topic       text,
  question    text not null,
  answer      text not null,
  -- مفتاح صورة لأسئلة «من صاحب الصورة؟». الصور مُجمَّعة في التطبيق
  -- (`celebs.ts`)، فاللوحة لا ترفع صورة — تحفظ المفتاح كما كان عند التعديل.
  image       text,
  origin      text not null check (origin in ('override', 'new')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

comment on column public.question_overrides.origin is
  'override = يحلّ محلّ سؤال في البنك المشحون · new = سؤال أضافته اللوحة ولا أصل له.';

alter table public.question_overrides enable row level security;

-- **لا سياسة كتابة.** التعديل عبر `admin_save_question` وحدها.
-- ولا سياسة قراءة للاعبين: الطبقة تُقرأ بدالّة تُرجع حقول السؤال وحدها،
-- فلا يخرج `updated_by` إلى الأجهزة.
create policy "question_overrides: admin reads all"
  on public.question_overrides for select using (public.is_admin());
