#!/usr/bin/env node
/**
 * نصفُ النسخة الليليّة الذي يكلّم Supabase — يشغّله `.github/workflows/backup.yml`
 * ولا يُشغَّل يدويّاً (للنسخة اليدويّة على الجهاز: `npm run db:backup`).
 *
 * ١) يستدعي `backup.snapshot()` بمستخدم `backup_reader` (لا يملك غيرها)، ويكتب
 *    ملفَّ JSON لكلّ جدول في `$OUT_DIR` — الصيغةُ نفسها التي ينتجها db:backup.
 * ٢) يقارن صور دلو art بما في R2 (`$R2_ART_LISTING`، قائمةٌ من `aws s3api`)،
 *    وينزّل إلى `$ART_DIR` الجديدَ والمتغيّرَ حجمُه وحده — فلا يُستهلك حدُّ
 *    الخروج المجّانيّ في Supabase (5 غ.ب) بإعادة تنزيل 200 م.ب كلّ ليلة.
 *
 * التشفيرُ والرفع في سير العمل نفسه (age وaws). وهذا السكربت لا يطبع إلّا
 * أعداداً: سجلّاتُ Actions في مستودعٍ عامّ يقرؤها أيّ أحد.
 */
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import pg from 'pg'

const { BACKUP_DB_URL, SUPABASE_URL, OUT_DIR, ART_DIR, R2_ART_LISTING, REPORT, RUN_JSON } = process.env
for (const [k, v] of Object.entries({ BACKUP_DB_URL, SUPABASE_URL, OUT_DIR, ART_DIR, R2_ART_LISTING })) {
  if (!v) {
    console.error(`ينقص ${k}`)
    process.exit(1)
  }
}

/** يُخفي كلمة السرّ من أيّ نصٍّ قبل طباعته. */
const hide = (s) => String(s ?? '').replace(/:\/\/[^@]*@/g, '://***@')

const client = new pg.Client({ connectionString: BACKUP_DB_URL, ssl: { rejectUnauthorized: false } })
let snap
try {
  await client.connect()
  const { rows } = await client.query('select backup.snapshot()::text as s')
  snap = JSON.parse(rows[0].s)
} catch (e) {
  console.error(`فشلت اللقطة: ${hide(e?.message ?? e)}`)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}

mkdirSync(OUT_DIR, { recursive: true })
const summary = {}
for (const [table, rows] of Object.entries(snap)) {
  writeFileSync(resolve(OUT_DIR, `${table}.json`), JSON.stringify(rows))
  summary[table] = rows.length
  console.log(`  ${table.padEnd(32)} ${rows.length}`)
}
writeFileSync(
  resolve(OUT_DIR, '_summary.json'),
  JSON.stringify({ at: new Date().toISOString(), tables: summary }, null, 2),
)

/* الصور: ما ليس في R2 بالحجم نفسه. */
const listing = JSON.parse(readFileSync(R2_ART_LISTING, 'utf8') || '[]') ?? []
const inR2 = new Map(listing.map(([key, size]) => [key.replace(/^art\//, ''), Number(size)]))
const base = SUPABASE_URL.replace(/\/$/, '')
const artDir = resolve(ART_DIR)
mkdirSync(artDir, { recursive: true })

let fetched = 0
let failed = 0
for (const { name, size } of snap['storage.objects'] ?? []) {
  if (inR2.get(name) === Number(size)) continue
  const dest = resolve(artDir, name)
  if (!dest.startsWith(artDir + '/')) continue
  const res = await fetch(
    `${base}/storage/v1/object/public/art/${name.split('/').map(encodeURIComponent).join('/')}`,
  )
  if (!res.ok || !res.body) {
    failed++
    console.error(`  ✗ صورة (${res.status})`)
    continue
  }
  mkdirSync(dirname(dest), { recursive: true })
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
  fetched++
}
const imagesLine = `الصور: ${(snap['storage.objects'] ?? []).length} في الدلو، ${fetched} جديدة${failed ? `، وفشل ${failed}` : ''}`
console.log(imagesLine)

/* ما يكتبه `backup-record.mjs` في سجلّ اللوحة. */
if (RUN_JSON) {
  writeFileSync(
    RUN_JSON,
    JSON.stringify({
      tables: summary,
      images_total: (snap['storage.objects'] ?? []).length,
      images_new: fetched,
    }),
  )
}

/* سطور رسالة تيليغرام — أعدادٌ فقط، كسجلّ المهمّة. */
if (REPORT) {
  const n = (t) => (summary[t] ?? 0).toLocaleString('en-US')
  writeFileSync(
    REPORT,
    [
      `الحسابات: ${n('auth.users')}`,
      `البنك: ${n('public.question_overrides')} سؤال`,
      `المسوّدات: ${n('public.question_drafts')}`,
      `الجلسات: ${n('public.sessions')}`,
      imagesLine,
      '',
    ].join('\n'),
  )
}
if (failed) process.exitCode = 1
