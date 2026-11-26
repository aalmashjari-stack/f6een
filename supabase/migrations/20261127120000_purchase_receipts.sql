-- إيصال الشراء على البريد — قرار علي ٢٧ نوفمبر ٢٠٢٦: «نرسل من عندنا»، لا من ماي فاتورة.
--
-- يُرسَل من القاعدة نفسها عبر ZeptoMail (Zoho) بامتداد http، كما تُكلَّم ماي فاتورة،
-- من noreply@f6een.com إلى بريد الحساب، لحظةَ تأكيد الدفع في `pay_settle`.
-- **فشلُ الإرسال لا يمسّ الدفع**: يُسجَّل في `receipt_error` والرصيدُ قد أُضيف،
-- ويُعاد من لسان «المشتريات» (`admin_send_receipt`).
--
-- الإعداد — في SQL Editor بيد علي، ولا يُكتب المفتاح في ملفّ:
--   select vault.create_secret('<Send Mail Token>', 'zeptomail_token');
-- وبلا السرّ لا يُرسَل شيء (`receipt_error = 'not_configured'`) — فهذه الهجرة آمنةٌ
-- قبل إعداد ZeptoMail. والمضيف https://api.zeptomail.com افتراضاً؛ وإن كان حساب
-- Zoho في مركز بياناتٍ آخر: select vault.create_secret('https://api.zeptomail.eu', 'zeptomail_host');

alter table public.purchases
  add column if not exists receipt_no      integer unique,
  add column if not exists receipt_sent_at timestamptz,
  add column if not exists receipt_error   text,
  add column if not exists pay_method      text;

comment on column public.purchases.receipt_no is
  'رقم الإيصال المتسلسل (F6-000001) — يُعطى أوّلَ محاولة إرسال، ولا يتغيّر بإعادته.';
comment on column public.purchases.pay_method is
  'وسيلة الدفع كما تسمّيها ماي فاتورة (KNET، VISA/MASTER…) — للإيصال.';

create sequence if not exists public.receipt_seq;

-- ─── نصّ الإيصال ──────────────────────────────────────────────────────────
-- HTML بأنماطٍ مضمَّنة (برامج البريد تُسقط <style>)، عربيّ من اليمين، وأرقامٌ لاتينيّة.
create function public.receipt_html(p public.purchases, p_email text)
returns text
language sql
stable
set search_path = ''
as $$
  select format($html$<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBF4;font-family:Tahoma,Arial,sans-serif;color:#22201C">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#FFFBF4;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:2px solid #22201C;border-radius:18px">
<tr><td align="center" style="padding:26px 24px 6px"><img src="https://f6een.com/logo.png" width="150" alt="فطين" style="display:block;border:0"></td></tr>
<tr><td align="center" style="padding:4px 24px 0;font-size:22px;font-weight:bold">إيصال شراء</td></tr>
<tr><td align="center" style="padding:6px 24px 18px;font-size:14px;color:#57524A">شكراً لك — أُضيفت الألعاب إلى رصيدك.</td></tr>
<tr><td style="padding:0 24px">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="font-size:15px;border-top:1px solid #E8E0D0">
<tr><td style="padding:11px 0;color:#6E695E;border-bottom:1px solid #E8E0D0">رقم الإيصال</td><td align="left" dir="ltr" style="padding:11px 0;font-weight:bold;border-bottom:1px solid #E8E0D0">%s</td></tr>
<tr><td style="padding:11px 0;color:#6E695E;border-bottom:1px solid #E8E0D0">التاريخ</td><td align="left" dir="ltr" style="padding:11px 0;font-weight:bold;border-bottom:1px solid #E8E0D0">%s</td></tr>
<tr><td style="padding:11px 0;color:#6E695E;border-bottom:1px solid #E8E0D0">الباقة</td><td align="left" style="padding:11px 0;font-weight:bold;border-bottom:1px solid #E8E0D0">%s</td></tr>
<tr><td style="padding:11px 0;color:#6E695E;border-bottom:1px solid #E8E0D0">وسيلة الدفع</td><td align="left" dir="ltr" style="padding:11px 0;font-weight:bold;border-bottom:1px solid #E8E0D0">%s</td></tr>
<tr><td style="padding:11px 0;color:#6E695E;border-bottom:1px solid #E8E0D0">رقم فاتورة ماي فاتورة</td><td align="left" dir="ltr" style="padding:11px 0;font-weight:bold;border-bottom:1px solid #E8E0D0">%s</td></tr>
<tr><td style="padding:11px 0;color:#6E695E;border-bottom:1px solid #E8E0D0">الحساب</td><td align="left" dir="ltr" style="padding:11px 0;font-weight:bold;border-bottom:1px solid #E8E0D0">%s</td></tr>
<tr><td style="padding:14px 0;font-size:17px;font-weight:bold">المبلغ</td><td align="left" style="padding:14px 0;font-size:22px;font-weight:bold;color:#E8542F"><span dir="ltr">%s</span> د.ك</td></tr>
</table></td></tr>
<tr><td style="padding:14px 24px 0;font-size:13px;line-height:1.8;color:#57524A">اللعبة جلسة كاملة بمراحلها الثلاث، وتُخصم من رصيدك عند بدئها. ورصيدك لا ينتهي.</td></tr>
<tr><td style="padding:18px 24px 24px;font-size:12px;line-height:1.9;color:#6E695E;border-top:0">
البائع: <span dir="ltr">Digital transformation</span> — دولة الكويت · <a href="https://f6een.com" style="color:#57524A">f6een.com</a><br>
<a href="https://f6een.com/terms" style="color:#57524A">الشروط والأحكام وسياسة الاسترداد</a> · للدعم: <a href="mailto:support@f6een.com" style="color:#57524A">support@f6een.com</a>
</td></tr></table>
<p style="font-size:11px;color:#948C80;margin:14px 0 0">رسالة آليّة من noreply@f6een.com — لا تردّ عليها.</p>
</td></tr></table></body></html>$html$,
    'F6-' || lpad(p.receipt_no::text, 6, '0'),
    to_char(coalesce(p.paid_at, p.created_at) at time zone 'Asia/Kuwait', 'YYYY/MM/DD HH24:MI'),
    case when p.games = 1 then 'لعبة واحدة' when p.games = 2 then 'لعبتان'
         when p.games between 3 and 10 then p.games || ' ألعاب' else p.games || ' لعبة' end,
    coalesce(nullif(p.pay_method, ''), 'MyFatoorah'),
    coalesce(p.invoice_id, '—'),
    p_email,
    to_char(p.amount, 'FM999990.000')
  );
$$;

revoke execute on function public.receipt_html(public.purchases, text) from public, anon, authenticated;

-- ─── الإرسال ──────────────────────────────────────────────────────────────
-- داخليّة. تُعطي رقم الإيصال إن لم يكن، وتنادي ZeptoMail، وتسجّل النتيجة. لا ترفع
-- خطأً أبداً — تُرجع 'sent' أو سبب الفشل — كي لا تُسقط معاملة الدفع التي نادتها.
create function public.send_receipt(p_purchase uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p     public.purchases;
  email text;
  tok   text;
  host  text;
  r     extensions.http_response;
  why   text;
begin
  select * into p from public.purchases where id = p_purchase;
  if not found or p.status <> 'paid' then
    return 'not_paid';
  end if;
  select u.email::text into email from auth.users u where u.id = p.user_id;
  if email is null then
    update public.purchases set receipt_error = 'no_email' where id = p.id;
    return 'no_email';
  end if;

  select decrypted_secret into tok from vault.decrypted_secrets where name = 'zeptomail_token';
  select decrypted_secret into host from vault.decrypted_secrets where name = 'zeptomail_host';
  if tok is null then
    update public.purchases set receipt_error = 'not_configured' where id = p.id;
    return 'not_configured';
  end if;

  if p.receipt_no is null then
    update public.purchases set receipt_no = nextval('public.receipt_seq') where id = p.id
      returning * into p;
  end if;

  begin
    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '10000');
    select * into r from extensions.http((
      'POST',
      rtrim(coalesce(host, 'https://api.zeptomail.com'), '/') || '/v1.1/email',
      array[extensions.http_header('Authorization', 'Zoho-enczapikey ' || tok),
            extensions.http_header('Accept', 'application/json')],
      'application/json',
      jsonb_build_object(
        'from', jsonb_build_object('address', 'noreply@f6een.com', 'name', 'فطين'),
        'to', jsonb_build_array(jsonb_build_object('email_address', jsonb_build_object('address', email))),
        'subject', 'إيصال شراء — فطين ' || 'F6-' || lpad(p.receipt_no::text, 6, '0'),
        'htmlbody', public.receipt_html(p, email)
      )::text
    )::extensions.http_request);
  exception when others then
    why := left('http: ' || sqlerrm, 300);
  end;

  if why is null and r.status between 200 and 299 then
    update public.purchases set receipt_sent_at = now(), receipt_error = null where id = p.id;
    return 'sent';
  end if;
  why := coalesce(why, left('http ' || r.status || ' ' || coalesce(r.content, ''), 300));
  update public.purchases set receipt_error = why where id = p.id;
  return why;
end;
$$;

revoke execute on function public.send_receipt(uuid) from public, anon, authenticated;

-- ─── التسوية تُرسل الإيصال، وتحفظ وسيلة الدفع ────────────────────────────
-- كما في `20261126120000_web_payments.sql` حرفاً، مع سطرين: وسيلة الدفع من آخر
-- عمليّةٍ ناجحة في ردّ ماي فاتورة، والإيصال بعد إضافة الرصيد في كتلةٍ تبتلع الخطأ.
create or replace function public.pay_settle(p_purchase uuid)
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
    update public.purchases
       set status = 'paid', paid_at = now(),
           pay_method = (select t ->> 'PaymentGateway'
                           from jsonb_array_elements(coalesce(d -> 'InvoiceTransactions', '[]'::jsonb)) t
                          where t ->> 'TransactionStatus' in ('Succss', 'Success', 'SUCCESS')
                          limit 1)
     where id = p.id;
    update public.profiles set games_balance = games_balance + p.games where id = p.user_id;
    begin
      perform public.send_receipt(p.id);
    exception when others then
      null;  -- الإيصال تتمّة: لا يُسقط دفعاً اكتمل.
    end;
    return 'paid';
  elsif d ->> 'InvoiceStatus' = 'Canceled' then
    update public.purchases set status = 'canceled' where id = p.id;
    return 'canceled';
  end if;
  return 'pending';
end;
$$;

revoke execute on function public.pay_settle(uuid) from public, anon, authenticated;

-- ─── اللوحة ───────────────────────────────────────────────────────────────
drop function if exists public.admin_purchases(integer);
create function public.admin_purchases(p_limit integer default 300)
returns table (
  id              uuid,
  email           text,
  games           integer,
  amount          numeric,
  status          text,
  invoice_id      text,
  created_at      timestamptz,
  paid_at         timestamptz,
  receipt_no      integer,
  receipt_sent_at timestamptz,
  receipt_error   text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, p.games, p.amount, p.status, p.invoice_id, p.created_at, p.paid_at,
         p.receipt_no, p.receipt_sent_at, p.receipt_error
  from public.purchases p
  join auth.users u on u.id = p.user_id
  where public.is_super()
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 300), 1000));
$$;

revoke execute on function public.admin_purchases(integer) from public, anon;
grant  execute on function public.admin_purchases(integer) to authenticated;

-- «أرسل الإيصال» من اللسان — لشراءٍ مدفوع لم يصله إيصاله، أو لإعادته.
create function public.admin_send_receipt(p_purchase uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;
  return public.send_receipt(p_purchase);
end;
$$;

revoke execute on function public.admin_send_receipt(uuid) from public, anon;
grant  execute on function public.admin_send_receipt(uuid) to authenticated;
