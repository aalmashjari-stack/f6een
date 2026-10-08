/*
  سجلّ النسخ الاحتياطيّة في لوحة الإدارة — ٩ أكتوبر ٢٠٢٦ (طلب علي).

  المهمّة الليليّة (`.github/workflows/backup.yml`) تكتب سطراً بعد كلّ تشغيل،
  نجح أو فشل، ولسان «النسخ الاحتياطيّ» في اللوحة يقرؤه.

  **الكتابة بدالّة لا بجدولٍ مفتوح:** `backup_reader` لا يملك إلّا
  `backup.snapshot()` و`backup.record_run()` — يقرأ اللقطة ويضيف سطراً إلى
  سجلّه، ولا يلمس جدولاً غيره. والجدول في مخطّط `backup` غير المكشوف للواجهة،
  فلا يقرؤه المتصفّح إلّا عبر `admin_backups()` المحروسة بـ`is_super()`.

  ولا يدخل اللقطة نفسها: `snapshot()` تأخذ جداول public وحدها.
*/

create table if not exists backup.runs (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  ok            boolean     not null,
  file          text,
  size_bytes    bigint,
  tables        jsonb,
  images_total  integer,
  images_new    integer,
  run_url       text
);

create or replace function backup.record_run(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into backup.runs (ok, file, size_bytes, tables, images_total, images_new, run_url)
  values (
    coalesce((p->>'ok')::boolean, false),
    left(p->>'file', 200),
    (p->>'size_bytes')::bigint,
    case when jsonb_typeof(p->'tables') = 'object' then p->'tables' end,
    (p->>'images_total')::integer,
    (p->>'images_new')::integer,
    left(p->>'run_url', 300)
  );
  /* سنةٌ تكفي للسجلّ — والنسخ نفسها في R2 بقواعدها. */
  delete from backup.runs where at < now() - interval '400 days';
end $$;

revoke all on function backup.record_run(jsonb) from public, anon, authenticated;
grant execute on function backup.record_run(jsonb) to backup_reader;

create or replace function public.admin_backups()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;
  return coalesce(
    (select jsonb_agg(to_jsonb(r) order by r.at desc)
       from (select * from backup.runs order by at desc limit 60) r),
    '[]'::jsonb);
end $$;

revoke all on function public.admin_backups() from public, anon;
grant execute on function public.admin_backups() to authenticated;
