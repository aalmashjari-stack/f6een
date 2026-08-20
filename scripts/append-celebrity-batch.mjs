#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const namesPath = resolve(process.argv[2] || 'data/pending/celebrities-next-75.txt')
const manifestPath = resolve(process.argv[3] || 'assets/celebrities/manifest.json')
const bankPath = resolve(process.argv[4] || 'data/questions-extra.json')
const firstAssetIndex = Number.parseInt(process.env.CELEB_FIRST_ASSET_INDEX || '301', 10)

const names = (await readFile(namesPath, 'utf8')).split(/\r?\n/u).map((name) => name.trim()).filter(Boolean)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const bank = JSON.parse(await readFile(bankPath, 'utf8'))

const hard = new Set([
  'نبيل شعيل', 'عبد الكريم عبد القادر', 'أمير خان', 'أميتاب باتشان', 'نيللي كريم',
  'أحمد مكي', 'هدى حسين', 'إد شيران', 'جاستن بيبر', 'سيلين ديون',
  'روبرت داوني جونيور', 'كيانو ريفز', 'جيم كاري', 'روان أتكينسون', 'يوسين بولت',
])

const medium = new Set([
  'صباح', 'وردة الجزائرية', 'فريد الأطرش', 'شادية', 'رابح صقر', 'نوال الكويتية',
  'أنغام', 'راغب علامة', 'ماجد المهندس', 'بلقيس فتحي', 'حسن البلام', 'طارق العلي',
  'عبدالله السدحان', 'محمد صبحي', 'كريم عبد العزيز', 'أحمد السقا', 'يحيى الفخراني',
  'نور الشريف', 'محمود عبد العزيز', 'إسماعيل ياسين', 'سمير غانم', 'دنيا سمير غانم',
  'سلمان خان', 'بريانكا تشوبرا', 'جينيفر لوبيز', 'براد بيت', 'أنجلينا جولي',
  'شاروخان', 'مورغان فريمان', 'مايك تايسون',
])

if (names.length !== 75 || new Set(names).size !== 75) {
  throw new Error(`يجب أن تضم الدفعة 75 اسماً فريداً؛ الموجود ${names.length}`)
}
if (hard.size !== 15 || medium.size !== 30 || [...hard].some((name) => medium.has(name))) {
  throw new Error('توزيع الصعوبة غير صالح')
}
for (const name of [...hard, ...medium]) {
  if (!names.includes(name)) throw new Error(`اسم مستوى غير موجود في الدفعة: ${name}`)
}

const rows = names.map((name, position) => {
  const assetIndex = firstAssetIndex + position
  const row = manifest.find((item) => item.index === assetIndex)
  if (!row || row.status !== 'ok' || !row.filename) throw new Error(`لا توجد صورة مكتملة للفهرس ${assetIndex}: ${name}`)
  if (row.name !== name) throw new Error(`عدم تطابق الاسم في الفهرس ${assetIndex}: ${name} ≠ ${row.name}`)
  return row
})

const firstQuestionNumber = 151
const batchQuestions = rows.map((row, position) => ({
  id: `X${String(firstQuestionNumber + position).padStart(3, '0')}`,
  category: 'مشاهير',
  level: hard.has(row.name) ? 'صعب' : medium.has(row.name) ? 'متوسط' : 'سهل',
  topic: 'مشاهير',
  question: 'من صاحب الصورة؟',
  answer: row.name,
  image: basename(row.filename, '.jpg'),
}))

const batchIds = new Set(batchQuestions.map((question) => question.id))
const batchImages = new Set(batchQuestions.map((question) => question.image))
bank.questions = bank.questions.filter(
  (question) => !batchIds.has(question.id) && !batchImages.has(question.image),
)
bank.questions.push(...batchQuestions)
bank._note = 'بنك مكمّل لفئة مشاهير. image هو اسم ملف الصورة دون الامتداد، ويُحل في src/game/celebs.ts. صعوبة الصور مراجعة يدوية لجمهور عربي وخليجي حسب شهرة الوجه.'

await writeFile(bankPath, `${JSON.stringify(bank, null, 2)}\n`)
console.log(`أضيفت ${batchQuestions.length} شخصية: ${batchQuestions.filter((q) => q.level === 'سهل').length} سهل، ${batchQuestions.filter((q) => q.level === 'متوسط').length} متوسط، ${batchQuestions.filter((q) => q.level === 'صعب').length} صعب`)
