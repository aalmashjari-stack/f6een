-- **تصنيفاتٌ فوق الفئات** — طبقةٌ ثانية في شجرة المحتوى (قرار علي ١٠ سبتمبر ٢٠٢٦).
--
-- الفئة هي التي تُلعب: خليّةٌ على اللوح، وسحبٌ على (فئة × مستوى). والتصنيف
-- مظلّةٌ تجمعها في شاشة الإعداد وحدها — «رياضة» يضمّ «كأس العالم» و«دوري
-- أبطال أوروبا» و«الدوري الإنجليزي»، و«ثقافة عامة» يضمّ «جغرافيا» و«تاريخ».
--
-- **ولا شيء منه في الشيفرة.** الشجرة ستكبر كثيراً، ولو كُتبت أسماؤها في
-- الملفّ لصار كلُّ تصنيفٍ جديد إصداراً جديداً في المتاجر وانتظارَ مراجعة.
-- فهي هنا، تُضاف وتُنقل من اللوحة كما تُضاف الفئة نفسها.
--
-- **وإعادة تسمية التصنيف عمليّة — بخلاف الفئة.** اسمُ الفئة مكتوبٌ في كل
-- سؤالٍ في البنك المشحون (`question.category` نصٌّ لا رقم)، فتغييرُه يترك
-- أسئلةً بفئةٍ لا وجود لها (انظر `20260830190000_categories.sql`). واسمُ
-- التصنيف لا يعرفه إلّا عمودٌ واحد في جدولٍ واحد، ومفتاحٌ أجنبيّ بـ`on
-- update cascade` ينقله معه. فالتصنيف يُعاد تسميته، والفئة لا.

/* ═══════════ الجدول ═══════════ */

/* كلُّ ما في هذا الملفّ يُعاد تشغيلُه بلا ضرر: محرّرُ Supabase لا يلفّ
   اللصقةَ في معاملةٍ واحدة، فسقوطُ جملةٍ في الوسط يترك ما قبلها مطبَّقاً —
   وإعادةُ اللصق تصطدم بما نجح. (وقع في ١٠ سبتمبر ٢٠٢٦: `relation
   "category_groups" already exists`.) */

create table if not exists public.category_groups (
  name       text primary key,
  /* ترتيب العرض في الإعداد. لا `created_at` كترتيب الفئات: التصنيفات صفٌّ
     من العناوين يقرؤه الحكم من فوق، وترتيبُها قرارُ عرضٍ يُعاد لا تاريخُ
     إضافة. */
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

comment on table public.category_groups is
  'تصنيفات المحتوى — مظلّاتٌ تجمع الفئات في شاشة الإعداد. لا تُلعب ولا يُسحب منها.';

alter table public.category_groups enable row level security;

drop policy if exists "category_groups: admin reads all" on public.category_groups;
create policy "category_groups: admin reads all"
  on public.category_groups for select using (public.is_admin());

/* ═══════════ عمود الانتماء ═══════════ */

/* `on delete set null` لا `cascade`: حذفُ تصنيفٍ يُخرج فئاتِه من مظلّتها
   ولا يحذفها — وإلّا ضاعت مئاتُ الأسئلة بضغطةٍ على عنوان. */
alter table public.categories
  add column if not exists group_name text
  references public.category_groups (name) on update cascade on delete set null;

comment on column public.categories.group_name is
  'التصنيف الذي تنتمي إليه الفئة — null يعني بلا تصنيف، فتُعرض في آخر الإعداد.';

/* الفئة المشحونة ليست في هذا الجدول أصلاً، فصفُّها يُنشأ عند أوّل تعيين —
   كما فعل `admin_set_category_art` بصور الفئات المشحونة (`is_extra=false`). */

/* ═══════════ ما يقرؤه اللاعب ═══════════ */

-- شكل الإرجاع تغيّر، و`create or replace` لا يغيّر أعمدة الإرجاع.
drop function if exists public.extra_categories();

create function public.extra_categories()
returns table (name text, art_url text, is_extra boolean, group_name text, group_sort integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, c.art_url, c.is_extra, c.group_name, g.sort
  from public.categories c
  left join public.category_groups g on g.name = c.group_name
  order by c.created_at;
$$;

comment on function public.extra_categories() is
  'الفئات المضافة وصفوفُ الصور البديلة، ومعها تصنيفُ كلٍّ وترتيبُه. يقرؤها اللاعب واللوحة معاً.';

revoke execute on function public.extra_categories() from public, anon;
grant  execute on function public.extra_categories() to authenticated;

/* ═══════════ اللوحة — إدارة التصنيفات ═══════════ */

create or replace function public.admin_add_group(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(p_name, ''));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if length(clean) < 2 then
    raise exception 'name_too_short';
  end if;

  insert into public.category_groups (name, sort, created_by)
  values (
    clean,
    coalesce((select max(g.sort) + 1 from public.category_groups g), 0),
    (select auth.uid())
  );

  return clean;

exception
  when unique_violation then
    raise exception 'group_exists';
end;
$$;

revoke execute on function public.admin_add_group(text) from public, anon;
grant  execute on function public.admin_add_group(text) to authenticated;

/* إعادةُ التسمية تنتقل إلى الفئات وحدها بـ`on update cascade` — لا سؤالَ
   يمسّه هذا، فالسؤال يعرف فئتَه لا تصنيفَها. */
create or replace function public.admin_rename_group(p_old text, p_new text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_name text := btrim(coalesce(p_old, ''));
  new_name text := btrim(coalesce(p_new, ''));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if length(new_name) < 2 then
    raise exception 'name_too_short';
  end if;

  update public.category_groups set name = new_name where name = old_name;

  if not found then
    raise exception 'no_such_group';
  end if;

  return new_name;

exception
  when unique_violation then
    raise exception 'group_exists';
end;
$$;

revoke execute on function public.admin_rename_group(text, text) from public, anon;
grant  execute on function public.admin_rename_group(text, text) to authenticated;

/* الحذف يُخرج الفئات من المظلّة ولا يمسّها — ولذلك لا يشترط أن يكون فارغاً:
   شرطُ الفراغ على الفئة سببُه أنّ أسئلتها تضيع، ولا شيء يضيع هنا. */
create or replace function public.admin_delete_group(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  delete from public.category_groups where name = btrim(coalesce(p_name, ''));

  if not found then
    raise exception 'no_such_group';
  end if;
end;
$$;

revoke execute on function public.admin_delete_group(text) from public, anon;
grant  execute on function public.admin_delete_group(text) to authenticated;

/* الترتيب يُرسَل كاملاً لا خطوةً خطوة: «ارفع هذا» يحتاج قراءةَ الجار
   وكتابتَه، وطلبان متزامنان يتبادلان الرقم نفسه. */
create or replace function public.admin_reorder_groups(p_names text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_names is null then
    raise exception 'bad_payload';
  end if;

  update public.category_groups g
     set sort = t.i
    from (select unnest(p_names) as name, generate_subscripts(p_names, 1) as i) t
   where g.name = t.name;
end;
$$;

revoke execute on function public.admin_reorder_groups(text[]) from public, anon;
grant  execute on function public.admin_reorder_groups(text[]) to authenticated;

/* ═══════════ اللوحة — انتماء الفئة ═══════════ */

/* الفئة المشحونة لا صفَّ لها حتى تُصوَّر أو تُصنَّف، فالصفُّ يُنشأ هنا
   بـ`is_extra=false` — وإلّا ظهرت الفئة مرّتين في قائمة اللاعب. */
create or replace function public.admin_set_category_group(p_name text, p_group text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(p_name, ''));
  grp   text := nullif(btrim(coalesce(p_group, '')), '');
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if clean = '' then
    raise exception 'no_such_category';
  end if;

  if grp is not null and not exists (select 1 from public.category_groups g where g.name = grp) then
    raise exception 'no_such_group';
  end if;

  insert into public.categories (name, group_name, is_extra, created_by)
  values (clean, grp, false, (select auth.uid()))
  on conflict (name) do update
    set group_name = excluded.group_name;

  return clean;
end;
$$;

revoke execute on function public.admin_set_category_group(text, text) from public, anon;
grant  execute on function public.admin_set_category_group(text, text) to authenticated;
