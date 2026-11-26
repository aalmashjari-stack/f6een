-- لسان «المشتريات» في اللوحة — طلب علي ٢٦ نوفمبر ٢٠٢٦، بعد أوّل دفعة حقيقيّة.
--
-- **المال للمدير العامّ وحده** (قاعدة `admin_roles.sql`). وهجرة الدفع أعطت
-- `purchases` سياسةَ قراءةٍ بـ`is_admin()` — فكان محرّرُ الأسئلة يقرأ
-- المشتريات مباشرةً عبر المفتاح العلنيّ. تُستبدل هنا بـ`is_super()`.

drop policy if exists "purchases: admin read" on public.purchases;

create policy "purchases: super read"
  on public.purchases for select
  using ((select public.is_super()));

-- المشتريات ببريد صاحبها، الأحدث أوّلاً.
create function public.admin_purchases(p_limit integer default 300)
returns table (
  id         uuid,
  email      text,
  games      integer,
  amount     numeric,
  status     text,
  invoice_id text,
  created_at timestamptz,
  paid_at    timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, p.games, p.amount, p.status, p.invoice_id, p.created_at, p.paid_at
  from public.purchases p
  join auth.users u on u.id = p.user_id
  where public.is_super()
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 300), 1000));
$$;

revoke execute on function public.admin_purchases(integer) from public, anon;
grant  execute on function public.admin_purchases(integer) to authenticated;

-- «تحقّق» على شراءٍ معلّق: يسأل ماي فاتورة الآن ويضيف الرصيد إن دُفع —
-- لمن دفع وأغلق الصفحة ولم يدخل بعدها، أو شكا أنّ رصيده لم يصل. هي
-- `pay_settle` نفسها (القفل وإضافةٌ واحدة)، بلا شرط أن يكون الشراء للمنادي.
create function public.admin_pay_settle(p_purchase uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;
  return public.pay_settle(p_purchase);
end;
$$;

revoke execute on function public.admin_pay_settle(uuid) from public, anon;
grant  execute on function public.admin_pay_settle(uuid) to authenticated;
