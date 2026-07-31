import type { Level, Question } from './types'
import { poolByCatLevel, poolByLevels } from './bank'

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * خوارزمية السحب — القسم ٨.
 * pool = أسئلة (التصنيف، المستوى) ناقص المستخدمة. إن نفد، نرجع لأقدم مستخدم.
 * في النسخة الحالية "الأقدم استخداماً" مبسّط: أي سؤال من الخلية (لأننا لا نحفظ ترتيب الاستخدام بعد).
 * تُضاف المعرّفات المسحوبة إلى used فوراً.
 */
export function drawOne(category: string, level: Level, used: Set<string>): Question {
  const cell = poolByCatLevel(category, level)
  const fresh = cell.filter((q) => !used.has(q.id))
  const pick = fresh.length > 0 ? fresh[Math.floor(Math.random() * fresh.length)] : cell[Math.floor(Math.random() * cell.length)]
  used.add(pick.id)
  return pick
}

/**
 * سحب مسبق لطابور الحق ما تلحق — القرار المعماري: 40 احتياطاً عند إنشاء الجلسة.
 * من مخزون سهل + متوسط كاملاً بلا تصنيف (القسم ٦/٨).
 */
export function drawStage3Queue(count: number, used: Set<string>): Question[] {
  const pool = poolByLevels(['سهل', 'متوسط']).filter((q) => !used.has(q.id))
  const chosen = shuffle(pool).slice(0, count)
  for (const q of chosen) used.add(q.id)
  return chosen
}
