-- بلاغات الأسئلة وحجزها — SPEC ١٠: «وظيفته تعليم السؤال للتصحيح واستبعاده
-- من سحوبات ذلك الحساب».
--
-- **جدولان لا واحد**، لأنّهما يجيبان عن سؤالين مختلفين:
-- `question_reports` سجلّ من بلّغ ومتى (للتدقيق ولعدّ المبلّغين المختلفين)،
-- و`question_flags` حالة السؤال الآن (أمحجوز أم روجع؟) — وهي التي يقرؤها
-- المحرّك قبل كل سحب.
--
-- ولا يعيش نصّ السؤال في أيّهما: البنك يُشحن مع التطبيق
-- (`data/questions-bank-v5.json`)، ونسخُه هنا يصنع مصدرَي حقيقة يفترقان
-- أوّل تصحيح.

create table public.question_reports (
  question_id text        not null,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  session_id  uuid        references public.sessions (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- بلاغ واحد لكل حساب لكل سؤال: تكرار الضغط لا يرفع العدّاد، فيبقى الرقم
  -- «كم شخصاً» لا «كم ضغطة».
  primary key (question_id, user_id)
);

create table public.question_flags (
  question_id text primary key,
  status      text not null default 'pending'
                check (status in ('pending', 'ok', 'disabled')),
  reports     integer not null default 0,
  first_at    timestamptz not null default now(),
  last_at     timestamptz not null default now(),
  note        text,
  reviewed_at timestamptz
);

comment on column public.question_flags.status is
  'pending = محجوز لحين المراجعة (لا يُسحب) · ok = روجع وأُعيد إلى السحب · disabled = ملغى نهائياً.';

alter table public.question_reports enable row level security;
alter table public.question_flags   enable row level security;

-- **لا سياسة إضافة على البلاغات.** الإضافة عبر `report_question` وحدها:
-- هي التي ترفع العدّاد وتحجز السؤال في المعاملة نفسها، ولو فُتح الإدخال
-- المباشر لأمكن تسجيل بلاغ بلا حجز، أو حجز بلا بلاغ.
create policy "question_reports: read own"
  on public.question_reports for select
  using ((select auth.uid()) = user_id);

create policy "question_reports: admin reads all"
  on public.question_reports for select using (public.is_admin());

-- **ولا سياسة قراءة على `question_flags` للاعبين.** قائمة المحجوز تُقرأ
-- بدالّة تُرجع المعرّفات وحدها — فملاحظات المراجعة لا تخرج إلى الأجهزة.
create policy "question_flags: admin reads all"
  on public.question_flags for select using (public.is_admin());
