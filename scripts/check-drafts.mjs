#!/usr/bin/env node
/**
 * فحصُ دفعة أسئلةٍ **قبل** إرسالها إلى المسوّدات.
 *
 *   node scripts/check-drafts.mjs <ملفّ.csv>
 *
 * كُتب بعد أن أظهرت دفعةُ ٩ سبتمبر ٢٠٢٦ (٣٨٠ سؤالاً) ستّةَ أخطاء وقائع
 * وستّةَ أسئلةٍ معطوبة الصياغة، لم يكشفها إلّا مسحٌ يدويّ كامل. ولا يزعم
 * هذا السكربت أنّه يمسك خطأ الواقعة — **لا شيء آليّ يمسك «لقبٌ صحيح لشخصٍ
 * آخر»** — إنّما يمسك الأصنافَ التي تتكرّر بالجملة حين يضيق المؤلّف:
 *
 *  1. **الإجابة داخل السؤال** — «ما اسم الطاقة التي تولّدها الرياح؟ طاقة
 *     الرياح». قاعدةُ علي ٥ سبتمبر: لا سؤال بديهيّ.
 *  2. **تكرارٌ حرفيّ** مع البنك المشحون أو داخل الدفعة نفسها، بالمقارنة
 *     المطبَّعة نفسها التي تحرس الرفع في القاعدة (`norm_question`).
 *  3. **واقعةٌ مكرّرة بصياغةٍ مقلوبة** — «كم مرّة فازت البرازيل؟ خمس» و«من
 *     فاز خمس مرّات؟ البرازيل». التطبيعُ لا يمسكها لأنّ النصّين مختلفان،
 *     ويمسكها تقاطعُ الإجابة مع كلماتِ سؤالٍ قائم. **وهذا أخطرُ أنواع
 *     التكرار** لأنّه يعبر التصنيفات، واللوحُ يسحب من كل تصنيفٍ سؤالاً.
 *  4. **عائلةٌ واحدة مرّتين** داخل الدفعة — أوّل أربع كلمات، كحارس المحرّك.
 *  5. **خليّةٌ ناقصة** — أقلّ من عشرين في (فئة × مستوى)، وهو حدُّ القاعدة.
 *  6. **أرقام هنديّة** (٠١٢٣) — الواجهة لاتينيّة دائماً.
 *
 * والمخرجات صنفان: **مانعٌ** يوقف الإرسال، و**إنذارٌ** يُقرأ بالعين. ونسبةُ
 * الإنذارات الكاذبة في الصنف الأوّل معروفة سلفاً (٣٥ حقيقيّاً من ٧٤ إشارة
 * في تدقيق ٤ سبتمبر)، فلا تُحذف آليّاً.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadBank } from './lib/bank.mjs'

const CELL_FLOOR = 20
const LEVELS = ['سهل', 'متوسط', 'صعب', 'تعجيزي']

/* ── التطبيع: نفس ما تفعله `norm_question` في القاعدة تقريباً ── */
const stripTashkeel = (s) => s.replace(/[ً-ْٰـ]/g, '')
const unifyLetters = (s) =>
  s
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
const norm = (s) =>
  unifyLetters(stripTashkeel(String(s ?? '')))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/**
 * **الصيغ الشرعيّة تُطرح قبل المقارنة.**
 *
 * «صلى الله عليه وسلم» و«رضي الله عنه» و«عليه السلام» صيغُ أدبٍ لا محتوى،
 * وهي في كلّ سؤالٍ من أسئلة السيرة والأنبياء. وبقاؤها كان يردّ «ما اسم والد
 * النبيّ صلى الله عليه وسلم؟ → عبد الله» بحجّة أنّ الإجابة في السؤال —
 * ولفظُ الجلالة إنّما جاء في الصيغة لا في السؤال.
 */
const HONORIFICS = [
  /صلى الله عليه وسلم/g,
  /صلّى الله عليه وسلّم/g,
  /رضي الله عن(?:ه|ها|هم|هما)/g,
  /علي(?:ه|ها|هم)\s?السلام/g,
  /عليهم\s?الصلاة والسلام/g,
  /سبحانه وتعالى/g,
  /عز وجل/g,
  /عزّ وجلّ/g,
]
const stripHonorifics = (s) => HONORIFICS.reduce((t, re) => t.replace(re, ' '), String(s ?? ''))

/** كلماتٌ لا تدلّ على شيء حين تُقارن الإجاباتُ بالأسئلة. */
const STOP = new Set(
  ('من ما في اي أي على عن الى إلى هو هي التي الذي كم هل عام سنة اسم كان بين مع بعد قبل عند لا و ثم أول اول ذلك هذا هذه كل بلا نفس'
    .split(' ')),
)
const words = (s) => norm(s).split(' ').filter((w) => w.length > 3 && !STOP.has(w))
/** العائلة: أوّل أربع كلمات — نفس اشتقاق المحرّك في `bank.ts`. */
const family = (q) => norm(q).split(' ').slice(0, 4).join(' ')

/* ── قارئ CSV يحترم الاقتباس (نفس قارئ submit-drafts) ── */
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
  console.error('الاستعمال: node scripts/check-drafts.mjs <ملفّ.csv>')
  process.exit(1)
}

const root = resolve(import.meta.dirname, '..')
/* البنك من القاعدة الحيّة إن أمكن — انظر `lib/bank.mjs`. */
const { rows: bank, source: bankSource } = await loadBank()

const table = parseCsv(readFileSync(resolve(file), 'utf8'))
const head = table[0].map((h) => h.trim())
const at = (n) => head.indexOf(n)
const iCat = at('التصنيف'), iLvl = at('المستوى'), iQ = at('السؤال'), iA = at('الإجابة')
if ([iCat, iLvl, iQ, iA].some((i) => i < 0)) {
  console.error('ينقص عمود من: التصنيف · المستوى · السؤال · الإجابة')
  process.exit(1)
}

const rows = table.slice(1).map((r, i) => ({
  line: i + 2,
  category: (r[iCat] ?? '').trim(),
  level: (r[iLvl] ?? '').trim(),
  question: (r[iQ] ?? '').trim(),
  answer: (r[iA] ?? '').trim(),
}))

const blocking = []
const warning = []
const block = (r, why) => blocking.push(`سطر ${r.line}: ${why}\n    ${r.question} → ${r.answer}`)
const warn = (r, why) => warning.push(`سطر ${r.line}: ${why}\n    ${r.question} → ${r.answer}`)

/* فهارس البنك */
const bankByNorm = new Map(bank.map((q) => [norm(q.question), q]))
const bankByAnswer = new Map()
for (const q of bank) {
  const k = norm(q.answer)
  if (!bankByAnswer.has(k)) bankByAnswer.set(k, [])
  bankByAnswer.get(k).push(q)
}

const seen = new Map()
const seenFamily = new Map()

for (const r of rows) {
  if (!r.category) block(r, 'بلا تصنيف')
  if (!LEVELS.includes(r.level)) block(r, `مستوى غير معروف «${r.level}»`)
  if (!r.question || !r.answer) block(r, 'سؤالٌ أو إجابةٌ فارغة')
  if (!r.question || !r.answer) continue

  /* ١ — الإجابة داخل السؤال، بعد طرح صيغ الأدب من الطرفين */
  const aw = words(stripHonorifics(r.answer))
  const qBare = norm(stripHonorifics(r.question))
  if (aw.length && aw.every((w) => qBare.includes(w))) {
    block(r, 'الإجابة مذكورة في نصّ السؤال')
  }

  /* ٢ — تكرارٌ حرفيّ */
  const n = norm(r.question)
  if (bankByNorm.has(n)) {
    block(r, `مكرّر حرفيّاً مع البنك (${bankByNorm.get(n).id})`)
  }
  if (seen.has(n)) block(r, `مكرّر داخل الدفعة (سطر ${seen.get(n)})`)
  else seen.set(n, r.line)

  /* ٣ — واقعةٌ مقلوبة: إجابتي هي إجابةُ سؤالٍ قائمٍ يتقاطع معه معنىً */
  for (const q of bankByAnswer.get(norm(r.answer)) ?? []) {
    const mine = new Set(words(r.question))
    const hits = words(q.question).filter((w) => mine.has(w))
    if (hits.length >= 2) {
      warn(r, `واقعةٌ قد تكون مكرّرةً مع ${q.id} [${q.category}]: «${q.question} → ${q.answer}»`)
      break
    }
  }
  /* والعكس: سؤالي يسأل عمّا يجيب عنه سؤالٌ قائمٌ بصيغةٍ مقلوبة */
  const myAnswerWords = new Set(words(r.answer))
  for (const q of bank) {
    if (!myAnswerWords.size) break
    const qw = words(q.question)
    if (!qw.length) continue
    const overlap = qw.filter((w) => myAnswerWords.has(w))
    if (overlap.length >= 2 && words(r.question).some((w) => norm(q.answer).includes(w))) {
      warn(r, `صياغةٌ مقلوبة لسؤالٍ قائم ${q.id} [${q.category}]: «${q.question} → ${q.answer}»`)
      break
    }
  }

  /* ٤ — عائلةٌ واحدة مرّتين في الدفعة */
  const f = family(r.question)
  if (seenFamily.has(f)) warn(r, `عائلةٌ مكرّرة مع سطر ${seenFamily.get(f)} — «${f}»`)
  else seenFamily.set(f, r.line)

  /* ٦ — أرقام هنديّة */
  if (/[٠-٩]/.test(r.question + r.answer)) block(r, 'أرقام هنديّة — الواجهة لاتينيّة دائماً')
}

/* ٥ — امتلاء الخلايا: الدفعةُ **زائداً ما في البنك أصلاً**.
      دفعةُ تكميلٍ من ستّة أسئلةٍ ليست خليّةً ناقصة إن كان في القاعدة أربعةَ
      عشر — والعدّ على الملفّ وحده كان يصيح في كل تكميل. */
const cells = new Map()
const already = new Map()
for (const q of bank) {
  const k = `${q.category}|${q.level}`
  already.set(k, (already.get(k) ?? 0) + 1)
}
for (const r of rows) {
  const k = `${r.category}|${r.level}`
  cells.set(k, (cells.get(k) ?? 0) + 1)
}

console.log(`\n${rows.length} سؤالاً في ${new Set(rows.map((r) => r.category)).size} فئة`)
console.log(`قُورنت بـ: ${bankSource}\n`)
for (const cat of new Set(rows.map((r) => r.category))) {
  const line = LEVELS.map((l) => {
    const k = `${cat}|${l}`
    const n = cells.get(k) ?? 0
    const have = already.get(k) ?? 0
    const total = n + have
    /* «5+15=20»: ما في الدفعة، وما في البنك، ومجموعُهما مقابل الحدّ. */
    const shown = have ? `${n}+${have}=${total}` : `${n}`
    return `${l} ${shown}${total < CELL_FLOOR ? ' ⚠' : ''}`
  }).join(' · ')
  console.log(`  ${cat}: ${line}`)
  for (const l of LEVELS) {
    const k = `${cat}|${l}`
    const total = (cells.get(k) ?? 0) + (already.get(k) ?? 0)
    if (total > 0 && total < CELL_FLOOR) {
      warning.push(`خليّة ناقصة: ${cat} · ${l} — ${total} من ${CELL_FLOOR} (بعد هذه الدفعة)`)
    }
  }
}

if (warning.length) {
  console.log(`\n── إنذارات (${warning.length}) — تُقرأ بالعين ولا تُحذف آليّاً ──`)
  for (const w of warning) console.log('  ⚠ ' + w)
}
if (blocking.length) {
  console.log(`\n── مانعة (${blocking.length}) ──`)
  for (const b of blocking) console.log('  ✗ ' + b)
  console.log('\nلا تُرسل الدفعة قبل إصلاحها.')
  process.exit(1)
}

console.log(`\n✅ لا مانع. ${warning.length ? 'راجع الإنذارات ثمّ أرسل.' : 'جاهزة للإرسال.'}`)
