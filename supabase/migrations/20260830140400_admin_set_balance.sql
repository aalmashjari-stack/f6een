-- لوحة الإدارة (٥) — تعديل رصيد حساب.
--
-- **الاستثناء الوحيد المُراجَع** للقاعدة الحاكمة «لا يكتب العميل رصيداً»:
-- الكتابة هنا أيضاً لا تقع من العميل بل داخل دالّة تحرسها `is_admin()`،
-- ومفتاح التطبيق العلنيّ بيد الجميع لا يفتحها لأنّ الصفّ في `admins` هو
-- الشرط لا الرمز.
--
-- والقيمة تُكتب كاملة لا فرقاً (+1/−1): المدير يرى الرقم أمامه ويصحّحه،
-- والفرق يتراكم مرّتين إن أُعيد الطلب على شبكةٍ متعثّرة.

create function public.admin_set_balance(p_user uuid, p_balance integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_balance is null or p_balance < 0 then
    raise exception 'bad_balance';
  end if;

  update public.profiles set games_balance = p_balance where id = p_user;

  if not found then
    raise exception 'no_such_user';
  end if;

  return p_balance;
end;
$$;

revoke execute on function public.admin_set_balance(uuid, integer) from public, anon;
grant  execute on function public.admin_set_balance(uuid, integer) to authenticated;
