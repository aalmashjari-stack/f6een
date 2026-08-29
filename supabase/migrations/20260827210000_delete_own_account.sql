-- حذف الحساب من داخل التطبيق.
--
-- **شرط متجر آبل**، لا تحسيناً: كل تطبيق يسمح بإنشاء حساب يجب أن يسمح بحذفه
-- من داخله — والمراجعة تُردّ بدونه. وهو أيضاً ما تَعِد به سياسة الخصوصيّة
-- المنشورة على f6een.com/privacy.html.
--
-- الحذف من `auth.users` وحده يكفي: جداولنا كلّها تشير إليه بـ
-- `on delete cascade`، فيذهب معه الرصيد وذاكرة الأسئلة والجلسات
-- والاستبدالات. ولا يُترك أثر.

create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  -- بلا هذا الحارس تُنادى الدالّة بلا جلسة فتحذف حيث `id = null` — أي لا شيء،
  -- لكنّها تُرجع نجاحاً كاذباً فيظنّ العميل أنّ الحساب حُذف.
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

comment on function public.delete_own_account() is
  'يحذف حساب المستخدم الحالي وكل ما يتفرّع عنه. لا يُنادى إلا بجلسة قائمة.';

revoke execute on function public.delete_own_account() from public;
grant  execute on function public.delete_own_account() to authenticated;
