import { unzipSync, strFromU8 } from 'fflate'
import type { Level } from '../game/types'

/**
 * قراءة ملفّ أسئلة (xlsx أو csv) وتحويله إلى خطّة رفع.
 *
 * **كلّه في المتصفّح، والقاعدة لا ترى إلّا ما نجا.** الملفّ الذي يأتي من
 * إكسل فيه دائماً ما لا يصلح: صفٌّ فارغ، مستوى مكتوب «سهله»، فئة بحرفٍ
 * زائد، وسؤالٌ موجود في البنك أصلاً. ولو أُرسل كما هو لدخل نصفه ثمّ رُدّ
 * الباقي بخطأٍ واحدٍ غامض — فالفرز هنا، ومعه سببُ كل صفٍّ مرفوض.
 *
 * ولا مكتبة إكسل: الملفّ زِمٌّ (zip) فيه XML، وفكّه بـ`fflate` (عشرة
 * كيلوبايت) وقراءتُه بتعبير نمطيّ أخفّ من أربعمئة كيلوبايت تُحمَّل لتفتح
 * ورقةً واحدة نصُّها كلّه.
 */

export interface ImportRow {
  /** معرّف سؤالٍ قائم = تعديل. فارغ = إضافة. */
  id: string | null
  category: string
  level: Level
  topic: string
  question: string
  answer: string
}

export interface Rejected {
  line: number
  reason: string
  text: string
}

export interface Plan {
  rows: ImportRow[]
  rejected: Rejected[]
  added: number
  updated: number
}

const LEVELS: Level[] = ['سهل', 'متوسط', 'صعب']

/* ============================== قراءة الملفّ ============================== */

/** فواصل الأسطر ثلاثة أشكال، والاقتباس يحمي الفواصل داخل النصّ (RFC 4180). */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

const colIndex = (ref: string): number => {
  const letters = ref.replace(/\d+/g, '')
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')

const textOf = (xml: string): string =>
  [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => unescapeXml(m[1])).join('')

/** ورقة إكسل الأولى إلى صفوف نصّية. الصيغ تُقرأ بقيمتها المحفوظة لا بحسابها. */
export function parseXlsx(buf: ArrayBuffer): string[][] {
  const files = unzipSync(new Uint8Array(buf))
  const sheetName =
    Object.keys(files).find((n) => /^xl\/worksheets\/sheet1\.xml$/.test(n)) ??
    Object.keys(files).find((n) => /^xl\/worksheets\/.*\.xml$/.test(n))
  if (!sheetName) throw new Error('الملفّ ليس ورقة إكسل صالحة')

  const shared = files['xl/sharedStrings.xml']
    ? [...strFromU8(files['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
        textOf(m[1]),
      )
    : []

  const sheet = strFromU8(files[sheetName])
  const rows: string[][] = []

  for (const rowMatch of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = []
    for (const c of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = c[1]
      const body = c[2]
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1]
      const type = /t="([^"]+)"/.exec(attrs)?.[1]
      let value = ''
      if (type === 's') {
        const idx = Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '-1')
        value = shared[idx] ?? ''
      } else if (type === 'inlineStr') {
        value = textOf(body)
      } else {
        value = unescapeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '')
      }
      const at = ref ? colIndex(ref) : cells.length
      while (cells.length < at) cells.push('')
      cells[at] = value
    }
    rows.push(cells)
  }
  return rows
}

export async function readTable(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer()
  if (/\.csv$/i.test(file.name)) return parseCsv(new TextDecoder('utf-8').decode(buf))
  return parseXlsx(buf)
}

/* ============================== بناء الخطّة ============================== */

/** تطبيع عربي — نفس تطبيع المحرّك: به تُكشف الأسئلة المكرّرة رغم اختلاف الرسم. */
const norm = (s: string) =>
  s
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]/gu, '')

/** أسماء الأعمدة كما يكتبها الناس — لا عمود واحد له اسم واحد. */
const HEADERS: Record<string, string[]> = {
  category: ['التصنيف', 'الفئة', 'القسم'],
  level: ['المستوى', 'الصعوبة'],
  question: ['السؤال', 'النص'],
  answer: ['الإجابة', 'الاجابة', 'الجواب'],
  topic: ['الموضوع'],
  id: ['المعرّف', 'المعرف', 'الرقم'],
}

function headerMap(head: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  head.forEach((cell, i) => {
    const key = norm(cell)
    for (const [field, names] of Object.entries(HEADERS)) {
      if (names.some((n) => norm(n) === key)) map[field] = i
    }
  })
  return map
}

export interface KnownQuestion {
  id: string
  question: string
}

/**
 * يفرز الجدول إلى ما يُرفع وما يُردّ ومعه سببه.
 *
 * **الفئة تُشترط موجودة ولا تُنشأ** (قرار علي ٣١ أغسطس ٢٠٢٦): الفئة تُضاف
 * وتُرفع صورتها أوّلاً، ثمّ يأتي ملفّها. فخطأٌ مطبعيّ في اسم فئة لا يخلق
 * فئةً شبحاً لا صورة لها ولا تدخل العجلة.
 */
export function buildPlan(
  table: string[][],
  ctx: { categories: string[]; existing: KnownQuestion[] },
): Plan {
  const rows: ImportRow[] = []
  const rejected: Rejected[] = []

  const head = table.find((r) => r.some((c) => c.trim() !== '')) ?? []
  const map = headerMap(head)
  const missing = ['category', 'level', 'question', 'answer'].filter((f) => map[f] === undefined)
  if (missing.length > 0) {
    return {
      rows: [],
      rejected: [
        {
          line: 1,
          reason: 'ينقص الملفّ عمود: ' + missing.map((f) => HEADERS[f][0]).join('، '),
          text: head.join(' · '),
        },
      ],
      added: 0,
      updated: 0,
    }
  }

  const cats = new Set(ctx.categories)
  const byId = new Map(ctx.existing.map((q) => [q.id, q]))
  const byText = new Map(ctx.existing.map((q) => [norm(q.question), q.id]))
  const seenText = new Set<string>()
  const seenId = new Set<string>()

  const start = table.indexOf(head) + 1
  for (let i = start; i < table.length; i++) {
    const cells = table[i]
    const at = (f: string) => (map[f] === undefined ? '' : (cells[map[f]] ?? '').trim())
    const question = at('question')
    const answer = at('answer')
    const line = i + 1

    if (!question && !answer && !at('category')) continue // سطر فارغ

    const push = (reason: string) => rejected.push({ line, reason, text: question || answer })

    if (!question || !answer) {
      push('السؤال أو الإجابة فارغ')
      continue
    }

    const category = at('category')
    if (!cats.has(category)) {
      push(`فئة غير معروفة: ${category || '—'}`)
      continue
    }

    const level = at('level') as Level
    if (!LEVELS.includes(level)) {
      push(`مستوى غير معروف: ${at('level') || '—'}`)
      continue
    }

    const id = at('id') || null
    if (id !== null && !byId.has(id)) {
      push(`معرّف لا وجود له: ${id}`)
      continue
    }
    if (id !== null && seenId.has(id)) {
      push(`المعرّف مكرّر في الملفّ: ${id}`)
      continue
    }

    const key = norm(question)
    if (seenText.has(key)) {
      push('السؤال مكرّر داخل الملفّ')
      continue
    }
    /* التكرار يُقاس بالنصّ المطبَّع: «ما هي عاصمةُ مصر؟» و«ما هي عاصمة مصر»
       سؤالٌ واحد على المسامع. ويُستثنى تعديلُ السؤال نفسه بمعرّفه. */
    const twin = byText.get(key)
    if (twin && twin !== id) {
      push(`موجود في البنك (${twin})`)
      continue
    }

    seenText.add(key)
    if (id) seenId.add(id)
    rows.push({ id, category, level, topic: at('topic'), question, answer })
  }

  return {
    rows,
    rejected,
    added: rows.filter((r) => r.id === null).length,
    updated: rows.filter((r) => r.id !== null).length,
  }
}
