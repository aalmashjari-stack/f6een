#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const sourceRtf = resolve(process.argv[2] || '/Users/alialmashjari/Downloads/Celebrities.rtf')
const manifestPath = resolve(process.argv[3] || 'assets/celebrities/manifest.json')
const outputPath = resolve(process.argv[4] || 'data/questions-extra.json')
const correctedNames = new Map([
  [70, 'لي جون'],
  [136, 'كاتالين كاريكو'],
  [137, 'درو وايسمان'],
])

const { stdout } = await execFileAsync('/usr/bin/textutil', ['-convert', 'txt', '-stdout', sourceRtf], {
  maxBuffer: 20 * 1024 * 1024,
})

let section = ''
const sourceRows = []
for (const rawLine of stdout.split(/\r?\n/u)) {
  const line = rawLine.trim()
  if (!line) continue
  if (!line.includes(' - ')) {
    section = line
    continue
  }
  sourceRows.push({ section })
}

const sectionCounts = new Map()
for (const row of sourceRows) sectionCounts.set(row.section, (sectionCounts.get(row.section) || 0) + 1)
const sectionSeen = new Map()
for (const row of sourceRows) {
  const position = (sectionSeen.get(row.section) || 0) + 1
  sectionSeen.set(row.section, position)
  row.position = position
  row.total = sectionCounts.get(row.section)
}

function levelFor(row) {
  const ratio = (row.position - 1) / row.total
  if (ratio < 1 / 3) return 'سهل'
  if (ratio < 2 / 3) return 'متوسط'
  return 'صعب'
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const included = manifest
  .filter((row) => row.status === 'ok' && row.filename)
  .sort((a, b) => a.index - b.index)

const questions = included.map((row, index) => {
  const source = sourceRows[row.index - 1]
  if (!source) throw new Error(`لا يوجد اسم مصدر للفهرس ${row.index}`)
  return {
    id: `X${String(index + 1).padStart(3, '0')}`,
    category: 'مشاهير',
    level: levelFor(source),
    topic: 'مشاهير',
    question: 'من صاحب الصورة؟',
    answer: correctedNames.get(row.index) || row.name,
    image: basename(row.filename, '.jpg'),
  }
})

const output = {
  _note: 'بنك مكمّل لفئة مشاهير. image هو اسم ملف الصورة دون الامتداد، ويُحل في src/game/celebs.ts. توزيع الصعوبة داخل كل قسم من قائمة المصدر: الثلث الأول سهل، ثم متوسط، ثم صعب.',
  categories: ['مشاهير'],
  questions,
}

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`كُتب ${questions.length} سؤالاً في ${outputPath}`)
