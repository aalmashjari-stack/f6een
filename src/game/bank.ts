import raw from '../../data/questions-bank-v4.json'
import type { Level, Question } from './types'

interface Bank {
  categories: string[]
  total: number
  levels: Record<Level, number>
  questions: Question[]
}

const bank = raw as Bank

export const CATEGORIES: string[] = bank.categories
export const ALL_QUESTIONS: Question[] = bank.questions

/** فهرسة: تصنيف × مستوى ← أسئلة. جوهر السحب في القسم ٨. */
const byCatLevel = new Map<string, Question[]>()
/** فهرسة بالمستوى فقط — لسحب الحق ما تلحق (بلا تصنيف). */
const byLevel = new Map<Level, Question[]>()

const key = (category: string, level: Level) => `${category}|${level}`

for (const q of ALL_QUESTIONS) {
  const k = key(q.category, q.level)
  if (!byCatLevel.has(k)) byCatLevel.set(k, [])
  byCatLevel.get(k)!.push(q)
  if (!byLevel.has(q.level)) byLevel.set(q.level, [])
  byLevel.get(q.level)!.push(q)
}

export function poolByCatLevel(category: string, level: Level): Question[] {
  return byCatLevel.get(key(category, level)) ?? []
}

export function poolByLevels(levels: Level[]): Question[] {
  return levels.flatMap((l) => byLevel.get(l) ?? [])
}
