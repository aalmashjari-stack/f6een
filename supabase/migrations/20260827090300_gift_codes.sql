-- أكواد الهدية — SPEC القسم ٩.
--
-- الكود **يمنح لعبة مجانية**، وليس خصماً على السعر — اختيار متعمّد للبقاء
-- داخل قواعد آبل. واللفظ في كل النصوص «هدية» و«استبدال»، ولا كلمة «خصم»
-- ولا «كوبون» في أي مكان.

create table public.gift_codes (
  code            text primary key,
  games           integer not null default 1 check (games > 0),
  max_redemptions integer check (max_redemptions > 0),
  expires_at      timestamptz,
  owner           text,
  created_at      timestamptz not null default now()
);

comment on column public.gift_codes.owner is
  'صاحب الكود (المؤثّر) — لتتبّع الإحالة (SPEC ٩).';
comment on column public.gift_codes.max_redemptions is
  'سقف إجمالي للاستبدالات. NULL = بلا سقف.';

create table public.gift_redemptions (
  code        text not null references public.gift_codes (code) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  -- **استخدام واحد لكل حساب** (SPEC ٩) مفروضٌ هنا لا في الشيفرة: بدونه
  -- يصير كود عام + حسابات وهمية = محتوى لا نهائي.
  primary key (code, user_id)
);

alter table public.gift_codes       enable row level security;
alter table public.gift_redemptions enable row level security;

-- **لا سياسة قراءة على gift_codes.** لا أحد يتصفّح الأكواد الصالحة؛
-- التحقّق يقع داخل الدالّة أدناه وحدها.

create policy "gift_redemptions: read own"
  on public.gift_redemptions for select
  using ((select auth.uid()) = user_id);

create function public.redeem_gift_code(p_code text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  c    public.gift_codes;
  used integer;
begin
  -- for update يقفل صفّ الكود، فاستبدالان متزامنان لنفس الكود يصطفّان
  -- ولا يتجاوزان السقف معاً.
  select * into c from public.gift_codes where code = p_code for update;

  if not found then
    raise exception 'code_not_found';
  end if;

  if c.expires_at is not null and c.expires_at < now() then
    raise exception 'code_expired';
  end if;

  if c.max_redemptions is not null then
    select count(*) into used from public.gift_redemptions where code = p_code;
    if used >= c.max_redemptions then
      raise exception 'code_exhausted';
    end if;
  end if;

  insert into public.gift_redemptions (code, user_id)
  values (p_code, (select auth.uid()));

  update public.profiles
     set games_balance = games_balance + c.games
   where id = (select auth.uid());

  return c.games;

exception
  -- المفتاح الأساسي (code, user_id) هو الذي يمنع الاستخدام الثاني — تُترجَم
  -- مخالفته إلى رسالة مفهومة بدل خطأ قاعدة بيانات خام.
  when unique_violation then
    raise exception 'code_already_used';
end;
$$;

revoke execute on function public.redeem_gift_code(text) from public;
grant  execute on function public.redeem_gift_code(text) to authenticated;
