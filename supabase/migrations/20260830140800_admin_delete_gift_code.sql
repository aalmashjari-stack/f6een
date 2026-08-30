-- لوحة الإدارة (٩) — حذف كود هدية.
--
-- الحذف يجرف سجلّ إضافاته معه (`on delete cascade` في `gift_redemptions`)،
-- فمن أضاف الكود **يبقى رصيده** — الرصيد أُضيف وقتها ولا يُسترجَع. وهذا
-- مقصود: حذف الكود يقفل الباب أمام الجديد ولا يعاقب من دخل منه.

create function public.admin_delete_gift_code(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  delete from public.gift_codes where code = upper(btrim(p_code));

  if not found then
    raise exception 'code_not_found';
  end if;
end;
$$;

revoke execute on function public.admin_delete_gift_code(text) from public, anon;
grant  execute on function public.admin_delete_gift_code(text) to authenticated;
