/*
  النسخة الاحتياطيّة الليليّة — ٨ أكتوبر ٢٠٢٦.

  مهمّةٌ على GitHub Actions (`.github/workflows/backup.yml`) تأخذ كلّ ليلة لقطةً
  من القاعدة، تشفّرها بـage، وترفعها إلى Cloudflare R2 — مستقلّةً عن Supabase
  وعن جهاز علي.

  **لماذا دالّةٌ لا مستخدمٌ يقرأ الجداول:** مستخدمٌ عاديّ يقرأ الجداول تحجبه
  سياسات RLS (فيرى صفر صفوف)، و`BYPASSRLS` وقراءةُ `auth.users` لمستخدمٍ جديد
  لا يضمنهما توثيق Supabase. أمّا دالّةٌ `security definer` فتعمل بصلاحيّة
  مالكها (من يطبّق الهجرة) أيّاً كانت تلك القيود.

  **والمستخدم `backup_reader` لا يملك إلّا تشغيلها:** لا يقرأ جدولاً ولا يكتب
  شيئاً. فلو تسرّب رابطُه من أسرار GitHub لم يكن به تغييرٌ ولا حذف — أسوأ ما
  فيه قراءةُ اللقطة، وهي ما نحفظه أصلاً.

  **كلمة سرّه ليست هنا** (المستودع عامّ). يُنشأ بلا دخول، ثمّ يضعها علي بيده:
    alter role backup_reader with login password '<كلمة طويلة عشوائيّة>';

  والمخطّط لا يُنسخ: هو `supabase/migrations/` في git.
*/

create schema if not exists backup;
revoke all on schema backup from public;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'backup_reader') then
    create role backup_reader nologin;
  end if;
end $$;

grant usage on schema backup to backup_reader;

/*
  اللقطة كلّها في كائنٍ واحد: مفتاحٌ لكلّ جدول («public.categories» …) وقيمتُه
  صفوفُه. جداول public كلّها تُكتشف وقت التشغيل، فجدولٌ جديد يدخل النسخة بلا
  تعديلٍ هنا. والحسابات (`auth.users` و`auth.identities`) لأنّ الأرصدة والجلسات
  معلّقةٌ بمعرّفاتها — بدونها يعود كلّ لاعبٍ غريباً عن رصيده.
  و`storage.objects` لدلو art وحده: قائمةُ الصور التي تُنسخ ملفّاتُها.
*/
create or replace function backup.snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  t    text;
  rows jsonb;
  out  jsonb := '{}'::jsonb;
begin
  for t in
    select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x', t) into rows;
    out := out || jsonb_build_object('public.' || t, rows);
  end loop;

  out := out
    || jsonb_build_object('auth.users',
         (select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb) from auth.users u))
    || jsonb_build_object('auth.identities',
         (select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) from auth.identities i))
    || jsonb_build_object('storage.objects',
         (select coalesce(jsonb_agg(jsonb_build_object(
                   'name', o.name, 'size', (o.metadata->>'size')::bigint, 'updated_at', o.updated_at)
                   order by o.name), '[]'::jsonb)
            from storage.objects o where o.bucket_id = 'art'));
  return out;
end $$;

revoke all on function backup.snapshot() from public, anon, authenticated;
grant execute on function backup.snapshot() to backup_reader;
