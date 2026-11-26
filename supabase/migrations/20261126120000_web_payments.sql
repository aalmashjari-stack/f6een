-- الدفع على الموقع عبر ماي فاتورة — قرار علي ٢٦ نوفمبر ٢٠٢٦ (SPEC §١٣ بند ٢).
--
-- **القاعدة نفسها تكلّم ماي فاتورة**، لا المتصفّح ولا خادمٌ وسيط: مفتاحُ
-- ماي فاتورة في Vault لا يخرج منه، والسعرُ يُقرأ من `purchase_packs` هنا لا
-- ممّا يرسله العميل، والرصيدُ لا يزيد إلّا بعد أن تقول ماي فاتورة نفسها
-- «Paid» بالمبلغ نفسه. فلا يكفي لاعباً أن يعدّل نداءً أو يزوّر عنوانَ الرجوع.
-- وهذا امتدادٌ للقاعدة الحاكمة: العميل لا يكتب رصيداً (supabase/README.md).
--
-- الإعداد — مرّةً واحدة في SQL Editor بيد علي، ولا يُكتب المفتاح في ملفّ:
--   select vault.create_secret('<المفتاح>', 'myfatoorah_api_key');
--   select vault.create_secret('https://api.myfatoorah.com', 'myfatoorah_base_url');
-- وللتجربة أوّلاً: مفتاح ماي فاتورة التجريبيّ العامّ و https://apitest.myfatoorah.com
-- والتبديل بعدها بـ vault.update_secret. بلا السرّين تردّ الدوالّ payments_not_configured.

create extension if not exists http with schema extensions;

-- ─── الباقات: السعر الذي يُحاسَب عليه ────────────────────────────────────
-- مصدرُ الحقيقة للمبلغ. ونسختُها المعروضة في `src/components/SitePanels.tsx`
-- (PACKS)؛ واختبارٌ يقارن الاثنين (`payments.test.ts`)، و`pay_create` يرفض
-- بـ`price_changed` إن اختلف ما رآه اللاعب عمّا هنا — فلا يُحاسَب بسعرٍ لم يره.
create table public.purchase_packs (
  games  integer primary key check (games > 0),
  amount numeric(10, 3) not null check (amount > 0)
);

insert into public.purchase_packs (games, amount) values
  (1, 1.250),
  (2, 2.250),
  (5, 4.750),
  (10, 8.500);

alter table public.purchase_packs enable row level security;
create policy "purchase_packs: read all" on public.purchase_packs for select using (true);

-- ─── المشتريات ───────────────────────────────────────────────────────────
create table public.purchases (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  games      integer not null check (games > 0),
  amount     numeric(10, 3) not null check (amount > 0),
  invoice_id text unique,
  status     text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  created_at timestamptz not null default now(),
  paid_at    timestamptz
);

comment on table public.purchases is
  'كلّ محاولة شراء على الموقع. pending حتى تؤكّد ماي فاتورة الدفع؛ والرصيد يزيد مرّةً واحدة عند paid.';

create index purchases_user_pending on public.purchases (user_id, created_at) where status = 'pending';

alter table public.purchases enable row level security;

-- القراءة لصاحبها؛ ولا سياسة كتابة — الدوالّ أدناه وحدها تكتب.
create policy "purchases: read own"
  on public.purchases for select
  using ((select auth.uid()) = user_id);

create policy "purchases: admin read"
  on public.purchases for select
  using ((select public.is_admin()));

-- ─── نداء ماي فاتورة ─────────────────────────────────────────────────────
-- داخليّة: لا تُمنح لأحد. تقرأ السرّين، وتنادي، وترفع خطأً إن لم ينجح الردّ.
create function public.mf_request(p_method text, p_path text, p_body jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  k    text;
  base text;
  r    extensions.http_response;
  j    jsonb;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'myfatoorah_api_key';
  select decrypted_secret into base from vault.decrypted_secrets where name = 'myfatoorah_base_url';
  if k is null or base is null then
    raise exception 'payments_not_configured';
  end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '15000');
  select * into r from extensions.http((
    p_method,
    rtrim(base, '/') || p_path,
    array[extensions.http_header('Authorization', 'Bearer ' || k)],
    'application/json',
    case when p_body is null then null else p_body::text end
  )::extensions.http_request);

  begin
    j := r.content::jsonb;
  exception when others then
    raise exception 'payment_provider_error: http % (not json)', r.status;
  end;

  if r.status <> 200 or coalesce((j ->> 'IsSuccess')::boolean, false) = false then
    raise exception 'payment_provider_error: http % %', r.status, left(coalesce(j ->> 'Message', ''), 200);
  end if;
  return j -> 'Data';
end;
$$;

revoke execute on function public.mf_request(text, text, jsonb) from public, anon, authenticated;

-- ─── التسوية: تسأل ماي فاتورة عن فاتورة وتضيف الرصيد مرّةً واحدة ─────────
-- داخليّة أيضاً. تقفل صفّ الشراء، فطلبان متزامنان (رجوعُ المتصفّح والتسوية
-- عند الفتح) يصطفّان، والثاني يجده paid فلا يضيف.
create function public.pay_settle(p_purchase uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.purchases;
  d jsonb;
begin
  select * into p from public.purchases where id = p_purchase for update;
  if not found then
    raise exception 'purchase_not_found';
  end if;
  if p.status <> 'pending' or p.invoice_id is null then
    return p.status;
  end if;

  -- يُسأل برقم الفاتورة الذي حفظناه نحن، لا بما في عنوان الرجوع.
  d := public.mf_request('POST', '/v2/GetPaymentStatus',
         jsonb_build_object('Key', p.invoice_id, 'KeyType', 'InvoiceId'));

  if d ->> 'InvoiceStatus' = 'Paid' then
    if (d ->> 'InvoiceValue')::numeric <> p.amount
       or coalesce(d ->> 'CustomerReference', '') <> p.id::text then
      raise exception 'payment_mismatch';
    end if;
    update public.purchases set status = 'paid', paid_at = now() where id = p.id;
    update public.profiles set games_balance = games_balance + p.games where id = p.user_id;
    return 'paid';
  elsif d ->> 'InvoiceStatus' = 'Canceled' then
    update public.purchases set status = 'canceled' where id = p.id;
    return 'canceled';
  end if;
  return 'pending';
end;
$$;

revoke execute on function public.pay_settle(uuid) from public, anon, authenticated;

-- ─── بدء الشراء: يُرجع رابط صفحة الدفع ───────────────────────────────────
-- p_amount هو السعر الذي رآه اللاعب — يُقارَن ولا يُستعمل.
-- p_return_url يُقبل للموقع ولـlocalhost وحدهما، وإلّا رُجع إلى f6een.com.
create function public.pay_create(p_games integer, p_amount numeric, p_return_url text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid    uuid := (select auth.uid());
  price  numeric;
  pid    uuid;
  ret    text;
  d      jsonb;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select amount into price from public.purchase_packs where games = p_games;
  if price is null then
    raise exception 'unknown_pack';
  end if;
  if p_amount is distinct from price then
    raise exception 'price_changed';
  end if;

  -- كلُّ محاولةٍ نداءٌ خارجيّ؛ سقفٌ يمنع إغراقه من حسابٍ واحد.
  if (select count(*) from public.purchases
       where user_id = uid and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many_payments';
  end if;

  insert into public.purchases (user_id, games, amount)
  values (uid, p_games, price)
  returning id into pid;

  ret := case
    when p_return_url ~ '^(https://(www\.)?f6een\.com|http://localhost:[0-9]+)/'
      then split_part(p_return_url, '?', 1)
    else 'https://f6een.com/'
  end;

  d := public.mf_request('POST', '/v3/payments', jsonb_build_object(
    'Order', jsonb_build_object('Amount', price, 'Currency', 'KWD', 'ExternalIdentifier', pid::text),
    'Customer', jsonb_build_object('Name', 'فطين', 'Reference', pid::text),
    'IntegrationUrls', jsonb_build_object('Redirection', ret || '?pay=' || pid::text),
    'Language', 'AR',
    'NotificationOption', 'LINK'
  ));

  update public.purchases set invoice_id = d ->> 'InvoiceId' where id = pid;
  return d ->> 'PaymentURL';
end;
$$;

revoke execute on function public.pay_create(integer, numeric, text) from public, anon;
grant  execute on function public.pay_create(integer, numeric, text) to authenticated;

-- ─── عند الرجوع من صفحة الدفع ────────────────────────────────────────────
create function public.pay_verify(p_purchase uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p  public.purchases;
  st text;
begin
  select * into p from public.purchases where id = p_purchase and user_id = (select auth.uid());
  if not found then
    raise exception 'purchase_not_found';
  end if;
  st := public.pay_settle(p.id);
  return jsonb_build_object('status', st, 'games', p.games);
end;
$$;

revoke execute on function public.pay_verify(uuid) from public, anon;
grant  execute on function public.pay_verify(uuid) to authenticated;

-- ─── تسويةُ ما عُلّق ─────────────────────────────────────────────────────
-- من دفع ثمّ أغلق الصفحة قبل الرجوع: يُسوّى عند فتحه الموقعَ أو التطبيقَ
-- بعدها. لا نداء خارجيّ إن لم يكن عنده شراءٌ معلّق — وهو الغالب.
-- ثلاثة أيّام = عمر الفاتورة عند ماي فاتورة.
create function public.pay_reconcile()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r      record;
  paid   integer := 0;
begin
  for r in
    select id, games from public.purchases
     where user_id = (select auth.uid())
       and status = 'pending'
       and invoice_id is not null
       and created_at > now() - interval '3 days'
     order by created_at desc
     limit 5
  loop
    begin
      if public.pay_settle(r.id) = 'paid' then
        paid := paid + r.games;
      end if;
    exception when others then
      -- عطلُ شبكةٍ عند واحدة لا يُسقط تسويةَ البقيّة.
      null;
    end;
  end loop;
  return paid;
end;
$$;

revoke execute on function public.pay_reconcile() from public, anon;
grant  execute on function public.pay_reconcile() to authenticated;
