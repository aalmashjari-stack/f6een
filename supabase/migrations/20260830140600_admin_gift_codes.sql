-- لوحة الإدارة (٧) — أكواد الهدية وحصيلة كل كود.
--
-- عدد الإضافات محسوب هنا لا في الواجهة: هو الرقم الوحيد الذي يقول إن كان
-- كود المؤثّر يعمل أصلاً (SPEC ٩ — الكود مربوط بصاحبه لتتبّع الإحالة).

create function public.admin_gift_codes()
returns table (
  code            text,
  games           integer,
  max_redemptions integer,
  expires_at      timestamptz,
  owner           text,
  created_at      timestamptz,
  redeemed        integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.code, g.games, g.max_redemptions, g.expires_at, g.owner, g.created_at,
         (select count(*) from public.gift_redemptions r where r.code = g.code)::int
  from public.gift_codes g
  where public.is_admin()
  order by g.created_at desc;
$$;

revoke execute on function public.admin_gift_codes() from public, anon;
grant  execute on function public.admin_gift_codes() to authenticated;
