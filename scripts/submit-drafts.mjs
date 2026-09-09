#!/usr/bin/env node
/**
 * يرسل ملفّ أسئلة إلى طبقة المسوّدات — لا إلى البنك.
 *
 *   node scripts/submit-drafts.mjs <ملفّ.csv>
 *
 * الأعمدة أعمدة اللوحة نفسها: التصنيف · المستوى · السؤال · الإجابة، ومعها
 * الموضوع اختياراً. **ولا عمود معرّف**: المسوّدة اقتراحُ سؤالٍ جديد لا
 * تعديلُ قائم — والتعديل يبقى من اللوحة بيد المدير.
 *
 * المفتاح من `.env.agent` (متجاهَل في git) في المتغيّر `F6EEN_AGENT_KEY`،
 * ورابطُ القاعدة ومفتاحُها العلنيّ من `.env` كبقيّة المشروع.
 *
 * **ما يستطيعه هذا السكربت هو كلّ ما يستطيعه المفتاح: الكتابة في
 * المسوّدات.** لا حذف، ولا تعديل سؤالٍ قائم، ولا مسّ رصيد، ولا قراءة
 * حساب. والاعتماد بيد المدير في اللوحة.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* المستويات الأربعة — و«تعجيزي» رابعُها منذ ٩ سبتمبر ٢٠٢٦. وهذه القائمة
   شقيقةٌ لقوائمَ في `types.ts` و`bank.test.ts` واللوحة والقاعدة؛ من زاد
   مستوىً فليمرّ عليها كلّها، وإلّا ردّ السكربتُ دفعةً صحيحة. */
const LEVELS = ['سهل', 'متوسط', 'صعب', 'تعجيزي']

/** يقرأ ملفّ `KEY=value` بلا اعتماد على حزمة. */
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

/** قارئ CSV يحترم الاقتباس والفواصل داخله — نفس ما يكتبه تصدير اللوحة. */
function parseCsv(text) {
  const rows = []
  let row = [], cell = '', quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim() !== ''))
}

const file = process.argv[2]
if (!file) {
  console.error('الاستعمال: node scripts/submit-drafts.mjs <ملفّ.csv>')
  process.exit(1)
}

const root = resolve(import.meta.dirname, '..')
const env = { ...readEnv(resolve(root, '.env')), ...readEnv(resolve(root, '.env.agent')), ...process.env }
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_PUBLISHABLE_KEY
const key = env.F6EEN_AGENT_KEY

if (!url || !anon) {
  console.error('ينقص VITE_SUPABASE_URL أو VITE_SUPABASE_PUBLISHABLE_KEY في .env')
  process.exit(1)
}
if (!key) {
  console.error('ينقص F6EEN_AGENT_KEY في .env.agent — ولّده علي وأدخله في agent_keys')
  process.exit(1)
}

const table = parseCsv(readFileSync(resolve(file), 'utf8'))
const head = table[0].map((h) => h.trim())
const at = (name) => head.indexOf(name)
const iCat = at('التصنيف'), iLvl = at('المستوى'), iQ = at('السؤال'), iA = at('الإجابة')
const iTopic = at('الموضوع'), iId = at('المعرّف'), iImg = at('الصورة')

if ([iCat, iLvl, iQ, iA].some((i) => i < 0)) {
  console.error('ينقص الملفّ عمود من: التصنيف · المستوى · السؤال · الإجابة')
  process.exit(1)
}
if (iId >= 0 && table.slice(1).some((r) => (r[iId] ?? '').trim() !== '')) {
  console.error('الملفّ يحمل معرّفات — والمسوّدات إضافةٌ لا تعديل. احذف عمود المعرّف.')
  process.exit(1)
}

const rows = []
for (let i = 1; i < table.length; i++) {
  const r = table[i]
  const row = {
    category: (r[iCat] ?? '').trim(),
    level: (r[iLvl] ?? '').trim(),
    question: (r[iQ] ?? '').trim(),
    answer: (r[iA] ?? '').trim(),
    topic: iTopic >= 0 ? (r[iTopic] ?? '').trim() : '',
    /* مفتاح صورة مشحونة (`landmark-…`) أو رابطٌ في دلو art. الخادم يحرس
       الروابط الخارجية؛ والمفتاح المشحون يحلّه التطبيق من `assets/`. */
    image: iImg >= 0 ? (r[iImg] ?? '').trim() : '',
  }
  if (!row.question && !row.answer && !row.category) continue
  if (!row.category || !row.question || !row.answer) {
    console.error(`سطر ${i + 1}: ينقصه التصنيف أو السؤال أو الإجابة`)
    process.exit(1)
  }
  if (!LEVELS.includes(row.level)) {
    console.error(`سطر ${i + 1}: مستوى غير معروف «${row.level}»`)
    process.exit(1)
  }
  rows.push(row)
}

const cats = [...new Set(rows.map((r) => r.category))]
const counts = LEVELS.map((l) => `${l} ${rows.filter((r) => r.level === l).length}`).join(' · ')
console.log(`${rows.length} سؤالاً — ${cats.join('، ')} — ${counts}`)

const res = await fetch(`${url}/rest/v1/rpc/agent_submit_drafts`, {
  method: 'POST',
  headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_key: key, p_rows: rows }),
})

const body = await res.text()
if (!res.ok) {
  /* المفتاح لا يُطبع في أيّ حال، ولا يُعاد في ردّ القاعدة. */
  console.error(`فشل الإرسال (${res.status}): ${body}`)
  process.exit(1)
}

const out = JSON.parse(body)
console.log(`وصلت المسوّدات: ${out.rows} صفّاً · الدفعة ${out.batch}`)
console.log('تنتظر «اعتمد» في لسان المسوّدات باللوحة — ولا تصل اللاعبين قبله.')
