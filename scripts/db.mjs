#!/usr/bin/env node
/**
 * **تطبيقُ الهجرات بأمرٍ واحد بدل اللصق في محرّر Supabase.**
 *
 *   npm run db:status   — ما طُبّق وما ينتظر
 *   npm run db:push     — يطبّق ما ينتظر بالترتيب
 *   npm run db:adopt    — مرّةً واحدة: يسجّل الهجرات القديمة «مطبَّقة»
 *
 * **لماذا:** كان كلُّ تغييرٍ في القاعدة يعني ملفّاً يُرسَل إلى علي ليلصقه
 * بيده — ومنه ما يفشل في منتصفه فيترك القاعدة نصفَ مطبَّقة (وقع في ١٠
 * سبتمبر ٢٠٢٦: `relation "category_groups" already exists`). وطولُ الطريق
 * كان يدفعني إلى كتابة هجراتٍ لما تفعله اللوحة بضغطة.
 *
 * **والسرّ لا يمرّ من هنا ولا يُطبع.** رابطُ القاعدة يقرؤه هذا السكربت من
 * `.env.db` (متجاهَل في git كـ`.env` و`.env.agent`)، ويضعه علي بيده مرّةً
 * واحدة. ولا يُكتب في رسالةٍ ولا في سجلّ: كلُّ خرجٍ هنا يُخفي كلمة السرّ.
 *
 * **وهو مفتاحٌ كامل على القاعدة** — أقوى من مفتاح المسوّدات بكثير، ولذلك
 * يبقى على جهاز علي وحده ولا يُشحن في حزمةٍ ولا يُرفع.
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

/** يقرأ ملفّ `KEY=value` بلا اعتماد على حزمة — نفس قارئ `submit-drafts`. */
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
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...readEnv(resolve(root, '.env.db')), ...process.env }
const url = env.SUPABASE_DB_URL

if (!url) {
  console.error(`ينقص SUPABASE_DB_URL.

ضعه في ملفّ .env.db بجذر المشروع (متجاهَل في git):

  SUPABASE_DB_URL=postgresql://postgres.<المعرّف>:<كلمة السرّ>@<المضيف>:6543/postgres

وتجده في Supabase ← Project Settings ← Database ← Connection string ← URI.
ضَعه بيدك في الملفّ ولا تكتبه في رسالة.`)
  process.exit(1)
}

/** يُخفي كلمة السرّ من أيّ نصٍّ قبل طباعته. */
const hide = (s) => String(s ?? '').replace(/:\/\/[^@]*@/g, '://***@')

/** يشغّل الـCLI ويعيد خرجَه — والرابط يمرّ في البيئة لا في سطر الأوامر. */
function cli(args, { quiet = false } = {}) {
  const r = spawnSync('npx', ['--yes', 'supabase@latest', ...args, '--db-url', url], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_DB_URL: url },
  })
  const out = hide((r.stdout ?? '') + (r.stderr ?? ''))
  if (!quiet) process.stdout.write(out)
  return { code: r.status ?? 1, out }
}

const cmd = process.argv[2] ?? 'status'
const versions = () =>
  readdirSync(resolve(root, 'supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => f.split('_')[0])
    .sort()

if (cmd === 'status') {
  const { code } = cli(['migration', 'list'])
  process.exit(code)
}

if (cmd === 'push') {
  console.log('يطبّق ما ينتظر…\n')
  const { code } = cli(['db', 'push', '--include-all'])
  if (code !== 0) {
    console.error(`
فشل التطبيق. والأرجح أحد اثنين:
  • القاعدة لا تعرف الهجرات القديمة — شغّل «npm run db:adopt» مرّةً واحدة.
  • هجرةٌ غير قابلةٍ لإعادة التشغيل اصطدمت بما هو موجود.`)
  }
  process.exit(code)
}

/**
 * **يُنفَّذ مرّةً واحدة وعن قصد.**
 *
 * هجراتُ هذا المشروع طُبّقت كلُّها باللصق اليدويّ، فجدولُ التتبّع عند
 * Supabase فارغ — ودفعةٌ بلا هذا التسجيل تعيد تشغيل أربعٍ وخمسين هجرة على
 * قاعدةٍ حيّة. فيُسجَّل الموجودُ «مطبَّقاً» **بلا تشغيله**، ثمّ يصير
 * `db:push` يطبّق الجديد وحده.
 *
 * ويشترط تأكيداً صريحاً: `npm run db:adopt -- --yes`.
 */
if (cmd === 'adopt') {
  const v = versions()
  if (!process.argv.includes('--yes')) {
    console.log(`سيُسجَّل ${v.length} هجرةً «مطبَّقة» بلا تشغيلها — من ${v[0]} إلى ${v[v.length - 1]}.

**لا تفعل هذا إلّا إن كانت القاعدة الحيّة تحمل هذه الهجرات فعلاً** (وهي كذلك
هنا: طُبّقت باللصق اليدويّ). وإلّا ظنّ النظامُ أنّها طُبّقت وهي لم تُطبَّق.

للتنفيذ:  npm run db:adopt -- --yes`)
    process.exit(0)
  }
  let ok = 0
  for (const ver of v) {
    const { code } = cli(['migration', 'repair', '--status', 'applied', ver], { quiet: true })
    if (code === 0) ok++
    else console.error(`  ✗ ${ver}`)
  }
  console.log(`سُجّلت ${ok} من ${v.length}. شغّل «npm run db:status» للتأكّد.`)
  process.exit(ok === v.length ? 0 : 1)
}

console.error(`أمرٌ غير معروف «${cmd}» — status أو push أو adopt.`)
process.exit(1)
