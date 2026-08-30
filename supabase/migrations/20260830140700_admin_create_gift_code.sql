-- لوحة الإدارة (٨) — إنشاء كود هدية.
--
-- الكود يُرفع إلى الحروف الكبيرة ويُنظَّف من الفراغ: اللاعب يكتبه كما سمعه،
-- و«f6-ali» و«F6-ALI» يجب أن يكونا واحداً. والتحقّق في `redeem_gift_code`
-- يقارن حرفياً، فالتوحيد يقع عند الإنشاء وعند الإضافة معاً.
--
-- ولفظ «هدية» و«إضافة» وحدهما (SPEC ٩) — لا «خصم» ولا «كوبون» في أيّ نصّ.

create function public.admin_create_gift_code(
  p_code    text,
  p_games   integer default 1,
  p_max     integer default null,
  p_expires timestamptz default null,
  p_owner   text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := upper(btrim(coalesce(p_code, '')));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if length(clean) < 3 then
    raise exception 'code_too_short';
  end if;

  if p_games is null or p_games < 1 then
    raise exception 'bad_games';
  end if;

  insert into public.gift_codes (code, games, max_redemptions, expires_at, owner)
  values (clean, p_games, p_max, p_expires, nullif(btrim(coalesce(p_owner, '')), ''));

  return clean;

exception
  when unique_violation then
    raise exception 'code_exists';
end;
$$;

revoke execute on function public.admin_create_gift_code(text, integer, integer, timestamptz, text) from public, anon;
grant  execute on function public.admin_create_gift_code(text, integer, integer, timestamptz, text) to authenticated;
