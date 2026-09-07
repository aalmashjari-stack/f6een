#!/usr/bin/env node
/**
 * يبني ملفَّ **تعديل** لأسئلة قائمة في البنك — لا ملفَّ إضافة.
 *
 *   node scripts/rewrite-answers.mjs <تصدير-اللوحة.csv> <خريطة.json> <الفئة> [خرج.csv]
 *
 * الخريطة `{"مفتاح الصورة أو نصّ السؤال": "الإجابة الجديدة"}`. والمطابقة
 * تقع على **عمود المعرّف** المأخوذ من تصدير اللوحة نفسه — وهو الشرط الذي
 * يجعل «رفع ملفّ» يقرأ الصفّ تعديلاً لا إضافةً ثانية.
 *
 * **ولا يُستنتج المعرّف بتسلسل الأسطر أبداً**: معرّفٌ منزاح يعدّل السؤال
 * الخطأ بصمت. فما لم يُطابَق يُترك ويُذكر بالاسم، ولا يدخل الملفّ.
 *
 * **والفئة شرطٌ لا خيار** (٨ سبتمبر ٢٠٢٦): المطابقة بالإجابة وحدها أصابت
 * ثمانية أسئلة في فئاتٍ أخرى تشترك في الجواب — «ما اسم أوّل بيت وُضع
 * للناس؟» كان سيصير جوابه «الكعبة، السعودية». فالبحث يقتصر على صفوف الفئة
 * المطلوبة، ولا يخرج منها.
 *
 * والتحقّق قبل الضغط في اللوحة: تعرض «0 إضافة · N تعديل · 0 مردود».
 * أيّ رقمٍ غير هذا يعني أنّ المطابقة انزاحت، فأوقف الرفع.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

const [exportPath, mapPath, category, outPath = 'تعديل-الإجابات.csv'] = process.argv.slice(2)
if (!exportPath || !mapPath || !category) {
  console.error('الاستعمال: node scripts/rewrite-answers.mjs <تصدير.csv> <خريطة.json> <الفئة> [خرج.csv]')
  process.exit(1)
}

const table = parseCsv(readFileSync(resolve(exportPath), 'utf8'))
const head = table[0].map((h) => h.trim())
const col = (n) => head.indexOf(n)
const iId = col('المعرّف'), iCat = col('التصنيف'), iLvl = col('المستوى')
const iTopic = col('الموضوع'), iQ = col('السؤال'), iA = col('الإجابة')
if ([iId, iCat, iLvl, iQ, iA].some((i) => i < 0)) {
  console.error('تصدير اللوحة ينقصه عمود: المعرّف · التصنيف · المستوى · السؤال · الإجابة')
  process.exit(1)
}

const map = JSON.parse(readFileSync(resolve(mapPath), 'utf8'))
/* المطابقة بالإجابة القديمة: تصدير اللوحة لا يحمل عمود الصورة، والإجابة هي
   ما يميّز سؤال الصورة — نصُّه واحدٌ في كلّها. */
const byOldAnswer = new Map()
for (const [key, next] of Object.entries(map)) {
  const old = next.split('،')[0].trim()
  byOldAnswer.set(old, { key, next })
}

const out = [], skipped = [], seen = new Set()
let inCategory = 0
for (let i = 1; i < table.length; i++) {
  const r = table[i]
  if ((r[iCat] ?? '').trim() !== category) continue   // الفئة شرط، لا يخرج منه البحث
  inCategory++
  const id = (r[iId] ?? '').trim()
  const old = (r[iA] ?? '').trim()
  const hit = byOldAnswer.get(old)
  if (!id || !hit) continue
  if (old === hit.next) continue          // معدَّلٌ سابقاً
  if (seen.has(hit.key)) { skipped.push(`${hit.key}: أكثر من صفّ بالإجابة نفسها`); continue }
  seen.add(hit.key)
  out.push([id, (r[iCat] ?? '').trim(), (r[iLvl] ?? '').trim(),
            iTopic >= 0 ? (r[iTopic] ?? '').trim() : '', (r[iQ] ?? '').trim(), hit.next])
}

const missed = [...byOldAnswer.values()].filter((v) => !seen.has(v.key)).map((v) => v.key)
const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
const csv = '﻿' + [['المعرّف','التصنيف','المستوى','الموضوع','السؤال','الإجابة'], ...out]
  .map((r) => r.map(esc).join(',')).join('\r\n')
writeFileSync(resolve(outPath), csv)

console.log(`صفوف الفئة «${category}» في التصدير: ${inCategory}`)
if (inCategory === 0) {
  console.error('لا صفوف بهذه الفئة — تأكّد من اسم الفئة ومن أنّ التصدير حديث.')
  process.exit(1)
}
console.log(`صفوف التعديل: ${out.length}`)
if (skipped.length) console.log('تُخطّي:', skipped.join(' · '))
if (missed.length) console.log(`لم يُطابَق (${missed.length}):`, missed.join('، '))
console.log('كُتب:', resolve(outPath))
console.log('ارفعه من «رفع ملفّ». المتوقّع في اللوحة: 0 إضافة · ' + out.length + ' تعديل · 0 مردود')
