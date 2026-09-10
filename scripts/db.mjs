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

  SUPABASE_DB_URL=postgresql://...

ومن Supabase ← Project Settings ← Database ← Connection string، خُذ
**Session pooler** أو **Direct connection**.

  ✗ لا تأخذ «Transaction pooler» (المنفذ 6543): لا يحمل حالةَ الجلسة،
    والهجرات تحتاجها — فيفشل الدفع برسالةٍ غامضة.

  ✗ وكلمةُ السرّ تُرمَّز (percent-encoded): الـCLI يشترط ذلك، فحرفٌ مثل
    @ أو # أو / فيها يقطع الرابط. بدّلها بـ %40 و%23 و%2F.

ضَعه بيدك في الملفّ ولا تكتبه في رسالة.`)
  process.exit(1)
}

/**
 * **يُفحص شكلُ الرابط قبل تشغيل أيّ شيء.**
 *
 * وقع علي في هذا: نافذةُ Connect فيها زرّ «Copy prompt» يجاور الرابط،
 * وهو ينسخ تعليماتٍ نصّيّة لا رابطاً — فحُفظ في الملفّ نصٌّ يبدأ بـ
 * «1. Connection…»، وتعلّق الـCLI ينتظر ما لا يأتي. فالفحصُ هنا يقول
 * السبب في سطرٍ بدل أن يُترك المستعمِل مع خطأٍ غامض.
 */
function validate(u) {
  const bad = (why, hint) => {
    console.error(`الرابط في .env.db غير صالح — ${why}.\n\n${hint}`)
    process.exit(1)
  }
  if (!/^postgres(ql)?:\/\//.test(u)) {
    bad(
      'لا يبدأ بـ postgresql://',
      `الغالبُ أنّك ضغطت «Copy prompt» في نافذة Connect — وهي تنسخ تعليماتٍ لا رابطاً.
انزل تحتها إلى الصندوق الذي فيه النصّ نفسه، واضغط أيقونة النسخ الصغيرة عليه.`,
    )
  }
  if (!u.includes('@')) bad('لا يحمل مضيفاً بعد @', 'انسخ النصّ كاملاً بلا قصّ.')
  if (u.includes('[YOUR-PASSWORD]') || u.includes('[your-password]')) {
    bad('ما زال فيه [YOUR-PASSWORD]', 'استبدلها بكلمة سرّ القاعدة، ورمّز الحروف المحجوزة (@ ← %40).')
  }
  if (u.includes(':6543')) {
    bad(
      'المنفذ 6543 — وهو Transaction pooler',
      'ارجع إلى نافذة Connect واختر Session pooler (منفذه 5432)؛ الهجرات تحتاج حالةَ الجلسة.',
    )
  }
}
validate(url)

/** يُخفي كلمة السرّ من أيّ نصٍّ قبل طباعته. */
const hide = (s) => String(s ?? '').replace(/:\/\/[^@]*@/g, '://***@')

/**
 * يشغّل الـCLI ويعيد خرجَه.
 *
 * والرابط يمرّ في `--db-url` لأنّه الخيار الموثَّق الوحيد — فيراه `ps` على
 * هذا الجهاز لحظةَ التشغيل. مقبولٌ على جهازٍ شخصيّ، ويُذكر لأنّه حقيقة.
 * وكلُّ ما يخرج من هنا يمرّ على `hide` فلا تظهر كلمةُ السرّ في سجلّ.
 */
function cli(args, { quiet = false } = {}) {
  /* المدخلُ موروثٌ عمداً: أوّلُ تشغيلٍ قد ينزّل الـCLI، وبأنبوبٍ مغلق
     يتعلّق بلا أثرٍ على الشاشة — وهو ما وقع لعلي فقطعه بـCtrl+C. */
  const r = spawnSync('npx', ['--yes', 'supabase@latest', ...args, '--db-url', url], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
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
 * **يُنفَّذ مرّةً واحدة وعن قصد، وبحدٍّ صريح.**
 *
 * هجراتُ هذا المشروع طُبّقت كلُّها باللصق اليدويّ، فجدولُ التتبّع عند
 * Supabase فارغ — ودفعةٌ بلا هذا التسجيل تعيد تشغيلها كلَّها على قاعدةٍ
 * حيّة. فتُسجَّل «مطبَّقة» بلا تشغيلها.
 *
 * **ويشترط `--through <النسخة>` ولا افتراض له.** أوّل ما كتبتُه كان يسجّل
 * كلَّ ما في المجلّد — ومنه هجراتُ اليوم التي لم تُطبَّق بعد، فتُدفن صامتةً
 * ولا تُشغَّل أبداً. والحدُّ يُعرف من `npm run db:status`: آخرُ ما تقول
 * القاعدةُ إنّها تحمله.
 */
if (cmd === 'adopt') {
  const v = versions()
  const i = process.argv.indexOf('--through')
  const through = i > 0 ? process.argv[i + 1] : null

  if (!through) {
    console.error(`ينقص --through <النسخة>.

    شغّل «npm run db:status» أوّلاً واعرف آخرَ هجرةٍ تحملها القاعدة فعلاً،
    ثمّ سجّل حتّاها وحدها:

      npm run db:adopt -- --through 20260910130000 --yes

    وما بعدها يبقى منتظِراً ليطبّقه «npm run db:push».

    **ولا تسجّل هجرةً لم تُطبَّق**: تُدفن صامتةً ولا تُشغَّل أبداً.
    نسخُ هذا المجلّد: ${v[0]} … ${v[v.length - 1]} (${v.length} هجرة)`)
    process.exit(1)
  }

  const pick = v.filter((x) => x <= through)
  if (pick.length === 0) {
    console.error(`لا هجرةَ عند ${through} أو قبلها.`)
    process.exit(1)
  }
  const after = v.filter((x) => x > through)

  if (!process.argv.includes('--yes')) {
    console.log(`سيُسجَّل ${pick.length} «مطبَّقة» بلا تشغيلها: ${pick[0]} … ${pick[pick.length - 1]}
${after.length ? `وسيبقى ${after.length} منتظِراً: ${after.join('، ')}` : 'ولا شيء بعدها.'}

أضِف --yes للتنفيذ.`)
    process.exit(0)
  }

  /* نداءٌ واحد بالنسخ كلّها: `migration repair` تقبل `version...`. وكان
     نداءً لكلّ نسخة — أربعةً وخمسين اتّصالاً بالقاعدة تستغرق دقائق. */
  console.log(`يسجّل ${pick.length} هجرة…`)
  const { code } = cli(['migration', 'repair', '--status', 'applied', ...pick])
  if (code === 0) {
    console.log(`\nتمّ. شغّل «npm run db:status» للتأكّد، ثمّ «npm run db:push».`)
  }
  process.exit(code)
}

console.error(`أمرٌ غير معروف «${cmd}» — status أو push أو adopt.`)
process.exit(1)
