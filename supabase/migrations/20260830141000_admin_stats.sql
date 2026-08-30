-- لوحة الإدارة (١١) — الأرقام الجملية.
--
-- كلّها في نداءٍ واحد: اللوحة تُفتح فتُقرأ مرّة، ولا معنى لسبعة طلبات
-- لسبعة أعداد. و`null` تعود لغير المدير — الشرط في `where` كبقيّة الدوالّ.

create function public.admin_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'users',        (select count(*) from auth.users),
    'balance',      (select coalesce(sum(p.games_balance), 0) from public.profiles p),
    'sessions',     (select count(*) from public.sessions),
    'open',         (select count(*) from public.sessions s where s.status = 'open'),
    'finished',     (select count(*) from public.sessions s where s.status = 'finished'),
    'abandoned',    (select count(*) from public.sessions s where s.status = 'abandoned'),
    'codes',        (select count(*) from public.gift_codes),
    'redemptions',  (select count(*) from public.gift_redemptions),
    'played_today', (select count(*) from public.sessions s
                      where s.created_at >= date_trunc('day', now()))
  )
  where public.is_admin();
$$;

revoke execute on function public.admin_stats() from public, anon;
grant  execute on function public.admin_stats() to authenticated;
