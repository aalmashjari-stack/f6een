-- تصحيحان بعد أوّل تجربة على بيئة ماي فاتورة التجريبيّة (٢٦ نوفمبر ٢٠٢٦):
--
-- ١. **ماي فاتورة ترفض localhost عنوانَ رجوع** («RedirectionURL is not valid»)،
--    فـpay_create يقبل f6een.com وحده (www أو بدونها)، وكلُّ ما سواه يُرجع
--    إلى https://f6een.com/ — والتجربة المحلّيّة تُكمل من الموقع الحيّ.
-- ٢. **خطأ ماي فاتورة يحمل اسمَ الحقل**: كان «Invalid data» وحده، فلا يُعرف
--    أيُّ حقلٍ رُفض. صار ValidationErrors في نصّ الخطأ.

create or replace function public.mf_request(p_method text, p_path text, p_body jsonb)
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
    raise exception 'payment_provider_error: http % % %', r.status,
      left(coalesce(j ->> 'Message', ''), 200), left(coalesce((j -> 'ValidationErrors')::text, ''), 300);
  end if;
  return j -> 'Data';
end;
$$;

create or replace function public.pay_create(p_games integer, p_amount numeric, p_return_url text default null)
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
    when p_return_url ~ '^https://(www\.)?f6een\.com/'
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
