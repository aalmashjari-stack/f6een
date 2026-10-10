#!/usr/bin/env node
/**
 * نسخةٌ احتياطيّة من القاعدة وصور دلو `art` إلى `backups/` على هذا الجهاز.
 *
 *   npm run db:backup
 *
 * **لماذا:** الخطّة المجّانيّة في Supabase لا تنسخ احتياطيّاً، والبنك
 * والمسوّدات (آلاف الصفوف) ليست في git — الملفُّ بذرةٌ قديمة، والحيُّ في
 * القاعدة. حذفٌ بالخطأ أو مشروعٌ عُطب = لا رجعة. وPro عند الإطلاق ينسخ
 * يوميّاً؛ إلى ذلك الحين هذا السكربت.
 *
 * **ما يُحفظ:**
 * - كلُّ جداول `public` — ملفُّ JSON لكلّ جدول في `backups/<الزمن>/`،
 *   من معاملةٍ واحدة للقراءة فقط (لقطةٌ متّسقة، ولا يكتب شيئاً).
 * - صورُ دلو `art` في `backups/art/` المشترك: يُنزَّل الجديد والمتغيّر
 *   حجمُه وحده، فلا يُستهلك حدُّ الخروج المجّانيّ (5 غ.ب) في كلّ تشغيل.
 *
 * **ما لا يُحفظ:** المخطّط (هو `supabase/migrations/` في git)، وحسابات
 * الدخول `auth.users` (لا تُستعاد بنسخ صفوف، وكلماتُ السرّ مجزَّأة عند
 * Supabase). فالنسخة تحفظ المحتوى والأرصدة، لا الحسابات نفسها.
 *
 * يقرأ `SUPABASE_DB_URL` من `.env.db` (كـ`db.mjs`) و`VITE_SUPABASE_URL` من
 * `.env`. و`backups/` متجاهَلٌ في git: فيه رسائلُ اللاعبين وبريدهم.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import pg from 'pg'

const root = resolve(import.meta.dirname, '..')

/** يقرأ ملفّ `KEY=value` بلا اعتماد على حزمة — نفس قارئ `db.mjs`. */
function readEnv(path) {
  const out = {}
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    return out
  }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    out[t.slice(0, i).trim()] = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...readEnv(resolve(root, '.env')), ...readEnv(resolve(root, '.env.db')), ...process.env }
const dbUrl = env.SUPABASE_DB_URL
const apiUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
if (!dbUrl) {
  console.error('ينقص SUPABASE_DB_URL في .env.db — هو نفسه الذي يستعمله db:push.')
  process.exit(1)
}

/** يُخفي كلمة السرّ من أيّ نصٍّ قبل طباعته. */
const hide = (s) => String(s ?? '').replace(/:\/\/[^@]*@/g, '://***@')

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = resolve(root, 'backups', stamp)
mkdirSync(outDir, { recursive: true })

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query('begin isolation level repeatable read read only')

  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name`,
  )

  const summary = {}
  for (const { table_name: t } of tables) {
    const { rows } = await client.query(`select * from public.${pg.escapeIdentifier(t)}`)
    writeFileSync(resolve(outDir, `${t}.json`), JSON.stringify(rows))
    summary[t] = rows.length
    console.log(`  ${t.padEnd(24)} ${rows.length}`)
  }

  const { rows: objects } = await client.query(
    `select name, (metadata->>'size')::bigint as size
       from storage.objects where bucket_id = 'art' order by name`,
  )
  await client.query('rollback')

  writeFileSync(
    resolve(outDir, '_summary.json'),
    JSON.stringify({ at: new Date().toISOString(), tables: summary, art_objects: objects.length }, null, 2),
  )
  console.log(`\nالجداول: ${tables.length} → backups/${stamp}/`)

  /* الصور: الجديدُ والمتغيّرُ حجمُه وحده. */
  if (!apiUrl) {
    console.log('لا VITE_SUPABASE_URL في .env — تُخطّت الصور.')
  } else {
    const artDir = resolve(root, 'backups', 'art')
    let fetched = 0
    let failed = 0
    for (const { name, size } of objects) {
      const dest = resolve(artDir, name)
      if (!dest.startsWith(artDir + '/')) continue
      if (existsSync(dest) && size != null && statSync(dest).size === Number(size)) continue
      const res = await fetch(
        `${apiUrl}/storage/v1/object/public/art/${name.split('/').map(encodeURIComponent).join('/')}`,
      )
      if (!res.ok || !res.body) {
        failed++
        console.error(`  ✗ ${name} (${res.status})`)
        continue
      }
      mkdirSync(dirname(dest), { recursive: true })
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
      fetched++
    }
    console.log(
      `الصور: ${objects.length} في الدلو، نُزّل ${fetched} جديد${failed ? `، وفشل ${failed}` : ''} → backups/art/`,
    )
    if (failed) process.exitCode = 1
  }
} catch (e) {
  console.error(`فشلت النسخة: ${hide(e?.message ?? e)}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
