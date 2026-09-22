/* ترتيب الفئات داخل تصنيفها — طلب علي ٢٣ سبتمبر ٢٠٢٦: «ميزة في لوحة التحكّم
   بحيث أستطيع ترتيب الفئات».

   التصنيفات مرتّبةٌ منذ ١٠ سبتمبر (`category_groups.sort`)، أمّا الفئات داخل
   التصنيف فكانت بترتيب القائمة: المشحونة ثمّ المضافة بتاريخ إضافتها. فعمودٌ
   `sort` على الفئة، يُقرأ داخل تصنيفها وحده، و`null` = لم تُرتَّب بعد فتبقى
   بعد المرتّبة بترتيبها القديم. */

alter table public.categories add column if not exists sort integer;

comment on column public.categories.sort is
  'موضع الفئة داخل تصنيفها في شاشة الإعداد (من 1). null = لم تُرتَّب، فتأتي بعد المرتّبة بترتيب القائمة.';

/* الترتيب يُرسَل كاملاً لتصنيفٍ واحد — كـ`admin_reorder_groups`: «ارفع هذه»
   خطوةً خطوة يقرأ الجار ويكتبه، وضغطتان متسارعتان تتبادلان الرقم نفسه.

   والفئة المشحونة لا صفّ لها حتى تُصوَّر أو تُصنَّف أو تُرتَّب، فالصفّ يُنشأ
   هنا بـ`is_extra=false` — وإلّا ظهرت في قائمة اللاعب مرّتين (كما في
   `admin_set_category_group`). */
create or replace function public.admin_reorder_categories(p_names text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_names is null or array_length(p_names, 1) is null then
    raise exception 'bad_payload';
  end if;

  insert into public.categories (name, is_extra, created_by)
  select btrim(n), false, (select auth.uid())
    from unnest(p_names) as n
   where btrim(coalesce(n, '')) <> ''
  on conflict (name) do nothing;

  update public.categories c
     set sort = t.i
    from (select btrim(unnest(p_names)) as name, generate_subscripts(p_names, 1) as i) t
   where c.name = t.name;
end;
$$;

revoke execute on function public.admin_reorder_categories(text[]) from public, anon;
grant  execute on function public.admin_reorder_categories(text[]) to authenticated;

/* القارئ للاعب واللوحة — يحمل العمود الجديد. شكل الإرجاع تغيّر فتُسقط وتُعاد. */
drop function if exists public.extra_categories();

create function public.extra_categories()
returns table (name text, art_url text, is_extra boolean, group_name text, group_sort integer, derby boolean, hidden boolean, sort integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, c.art_url, c.is_extra, c.group_name, g.sort, c.derby, c.hidden, c.sort
  from public.categories c
  left join public.category_groups g on g.name = c.group_name
  order by c.created_at;
$$;

comment on function public.extra_categories() is
  'الفئات المضافة وصفوفُ الصور البديلة، ومعها تصنيفُ كلٍّ وترتيبُه وعضويّتُه في الديربي واستبعادُه المؤقّت من اللوح وموضعُ الفئة داخل تصنيفها. يقرؤها اللاعب واللوحة معاً.';

revoke execute on function public.extra_categories() from public, anon;
grant  execute on function public.extra_categories() to authenticated;
