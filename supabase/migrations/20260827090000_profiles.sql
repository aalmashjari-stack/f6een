-- الحسابات والرصيد — SPEC القسم ٩.
--
-- صفٌّ واحد لكل مستخدم في auth.users. لا يحمل اسماً ولا بريداً: هذه تعيش في
-- auth.users وحدها، فلا تُنسخ هنا لتفترق النسختان لاحقاً.

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  games_balance integer not null default 2 check (games_balance >= 0),
  created_at    timestamptz not null default now()
);

comment on column public.profiles.games_balance is
  'رصيد الألعاب. الحساب الجديد يبدأ بجلستين مجانيتين كاملتين (SPEC ٩) — ولهذا الافتراض 2 لا 0.';

alter table public.profiles enable row level security;

-- القراءة لصاحب الصفّ وحده.
create policy "profiles: read own"
  on public.profiles for select
  using ((select auth.uid()) = id);

-- **لا سياسة كتابة، عمداً.** بدون هذا يستطيع أي لاعب أن يكتب رصيده بنفسه
-- عبر واجهة supabase-js. الرصيد لا يتغيّر إلا داخل دوالّ security definer
-- (start_session و redeem_gift_code) التي تفرض القاعدة قبل التغيير.

-- صفُّ الحساب يُنشأ مع الحساب نفسه، فلا يوجد مستخدم بلا رصيد.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
