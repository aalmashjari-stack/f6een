-- الجلسات ونافذة الاستكمال — SPEC القسم ٩.
--
-- الجلسة تبقى مفتوحة وقابلة للاستئناف بعد انهيار أو انقطاع، وإعادة الفتح
-- ترجع لنفس الجلسة بنفس الأسئلة والنقاط **بلا خصم لعبة جديدة**.

create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  state      jsonb not null,
  status     text not null default 'open' check (status in ('open', 'finished', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.sessions.state is
  'لقطة الحالة: النقاط، والأسئلة المسحوبة وأيّها استُهلك، وحالة العجلة، ودورة اللاعبين (SPEC ٩). jsonb لا أعمدة: شكل الحالة يتبع محرّك اللعبة ويتغيّر معه، ولا يُستعلَم عنه هنا.';

-- جلسة مفتوحة واحدة لكل حساب: الاستئناف يعني «أكمل جلستك»، وجلستان مفتوحتان
-- تجعلان السؤال «أيّهما؟» بلا جواب — والخصم وقع على كلتيهما.
create unique index sessions_one_open_per_user
  on public.sessions (user_id)
  where status = 'open';

alter table public.sessions enable row level security;

create policy "sessions: read own"
  on public.sessions for select
  using ((select auth.uid()) = user_id);

-- التعديل مسموح لصاحبها: حفظ الحالة أثناء اللعب وإغلاقها عند الختام.
create policy "sessions: update own"
  on public.sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- **لا سياسة إضافة.** الجلسة لا تُنشأ إلا عبر start_session أدناه، لأنّ
-- إنشاءها هو لحظة الخصم — ولو فُتح الإدخال المباشر لأنشأ اللاعب جلسات بلا رصيد.

create function public.start_session(initial_state jsonb)
returns public.sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.sessions;
  fresh    public.sessions;
begin
  -- استئناف قبل أي خصم: جلسة مفتوحة تُعاد كما هي (SPEC ٩ — نافذة الاستكمال).
  select * into existing
    from public.sessions
   where user_id = (select auth.uid()) and status = 'open'
   limit 1;

  if found then
    return existing;
  end if;

  -- الخصم والإنشاء في معاملة واحدة: إمّا أن يُخصم رصيد وتُنشأ جلسة، أو لا شيء.
  -- والشرط games_balance > 0 داخل update نفسه لا في فحص سابق، فلا تتسلّل
  -- طلبتان متزامنتان بينهما.
  update public.profiles
     set games_balance = games_balance - 1
   where id = (select auth.uid()) and games_balance > 0;

  if not found then
    raise exception 'no_balance' using
      hint = 'الرصيد صفر — إلى شاشة الشراء';
  end if;

  insert into public.sessions (user_id, state)
  values ((select auth.uid()), initial_state)
  returning * into fresh;

  return fresh;
end;
$$;

revoke execute on function public.start_session(jsonb) from public;
grant  execute on function public.start_session(jsonb) to authenticated;
