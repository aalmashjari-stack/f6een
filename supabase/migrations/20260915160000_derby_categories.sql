-- الديربي يُفتح على فئاتٍ بعينها (قرار علي ١٥ سبتمبر ٢٠٢٦).
--
-- كان يسحب «متوسط» من البنك المشحون وحده بلا تصنيف (قانونا ٤ سبتمبر).
-- والقرار الجديد: **سهل ومتوسط** من فئاتٍ محدَّدة بالتصنيف مع استثناءات —
-- ثقافة عامة كلُّها، وإسلاميات كلُّها، وفنّ وترفيه إلّا ألعاب الفيديو وديزني
-- وبيكسار وأنمي، ومنوعات إلّا حروف. وعلوم وصحة ورياضة خارجه. ولا صعب
-- ولا تعجيزي.
--
-- وبما أنّ فئات إسلاميات الخمس كلُّها مضافةٌ من اللوحة (لا معرّف مشحون
-- فيها)، فالقانون يسقط بالضرورة قيدَ «المشحون وحده» عن الديربي — ويبقى
-- على الحق ما تلحق كما كان.
--
-- عمودٌ على الفئة لا قائمةٌ في الشيفرة: التصنيفات والفئات تعيش في القاعدة
-- ولا يُنتظر بها إصدارُ متجر، فكذلك عضويّةُ الديربي. والافتراضيّ `false`:
-- الديربي نجمةُ اللعبة، وفئةٌ جديدة تُفتح عليه بقرار لا بالسهو.

alter table public.categories
  add column if not exists derby boolean not null default false;

comment on column public.categories.derby is
  'تدخل الفئةُ مخزونَ الديربي (سهل + متوسط). قرار علي ١٥ سبتمبر ٢٠٢٦ — بالتصنيف مع استثناءات.';

update public.categories c
   set derby = (
         c.group_name in ('ثقافة عامة', 'إسلاميات', 'فنّ وترفيه', 'منوعات')
     and c.name not in ('ألعاب فيديو', 'ديزني وبيكسار', 'أنمي', 'حروف')
   );

/* القارئ للاعب واللوحة — يحمل العمود الجديد. */
drop function if exists public.extra_categories();

create function public.extra_categories()
returns table (name text, art_url text, is_extra boolean, group_name text, group_sort integer, derby boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, c.art_url, c.is_extra, c.group_name, g.sort, c.derby
  from public.categories c
  left join public.category_groups g on g.name = c.group_name
  order by c.created_at;
$$;

comment on function public.extra_categories() is
  'الفئات المضافة وصفوفُ الصور البديلة، ومعها تصنيفُ كلٍّ وترتيبُه وعضويّتُه في الديربي. يقرؤها اللاعب واللوحة معاً.';

revoke execute on function public.extra_categories() from public, anon;
grant  execute on function public.extra_categories() to authenticated;
