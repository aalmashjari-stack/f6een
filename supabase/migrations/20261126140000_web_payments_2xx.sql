-- ماي فاتورة تردّ على إنشاء الدفع (v3 POST /v3/payments) بـ201 Created لا 200
-- — ظهر في أوّل تجربة على القاعدة الحيّة ببيئتها التجريبيّة (٢٦ نوفمبر ٢٠٢٦):
-- «payment_provider_error: http 201». فالنجاح أيُّ 2xx مع IsSuccess.

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

  if r.status not between 200 and 299 or coalesce((j ->> 'IsSuccess')::boolean, false) = false then
    raise exception 'payment_provider_error: http % % %', r.status,
      left(coalesce(j ->> 'Message', ''), 200), left(coalesce((j -> 'ValidationErrors')::text, ''), 300);
  end if;
  return j -> 'Data';
end;
$$;
