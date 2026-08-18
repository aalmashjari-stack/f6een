import raw from '../../data/questions-bank-v5.json'
import extraRaw from '../../data/questions-extra.json'
import type { Level, Question } from './types'

interface Bank {
  categories: string[]
  total: number
  levels: Record<Level, number>
  questions: Question[]
}

const bank = raw as Bank
// بنكٌ مكمّل منفصل — بنك v5 معتمد للقراءة فقط، فالفئات الجديدة (مشاهير، صور…)
// تُضاف هنا وتُدمج. ترتيب الفئات: القديمة أولاً ثم الجديدة.
const extra = extraRaw as { categories: string[]; questions: Question[] }

export const CATEGORIES: string[] = [...bank.categories, ...extra.categories]
export const ALL_QUESTIONS: Question[] = [...bank.questions, ...extra.questions]

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

/* ========================= عائلات القوالب ========================= */
/**
 * البنك فيه أسئلة تتشارك صيغة واحدة وتختلف إجاباتها — «ما العنصر الذي رمزه الكيميائي…؟»
 * أربع عشرة مرة، «في أي دولة تقع…؟» عشر مرات. سؤالان من عائلة واحدة في جلسة واحدة
 * يجعل اللعبة تُحسّ مكرّرة وإن لم يتكرّر سؤال. فنمنع أكثر من واحد من كل عائلة (القسم ٨).
 *
 * العائلة = أول أربع كلمات من نص السؤال بعد تجريد التشكيل وتوحيد الهمزة والتاء والألف
 * المقصورة. أربع كلمات لأن ثلاثاً تجمع أسئلة لا صلة بينها (٣٤١ سؤالاً بدل ١٠٣).
 * وتُعتبر عائلة فقط إن ضمّت ثلاثة أسئلة فأكثر — ما دون ذلك تشابه عابر لا قالب.
 */
const FAMILY_PREFIX_WORDS = 4
const FAMILY_MIN_SIZE = 3

const normalizeAr = (s: string) =>
  s
    .replace(/[ً-ْـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')

const prefixKey = (q: Question) =>
  normalizeAr(q.question).split(/\s+/).slice(0, FAMILY_PREFIX_WORDS).join(' ')

const familyById = new Map<string, string>()
{
  const counts = new Map<string, number>()
  // أسئلة الصور («من صاحب الصورة؟») نصّها واحد فتتجمّع كلّها في عائلة واحدة
  // فيُسمح بواحدة في الجلسة — وهو خطأ: العبرة بالصورة لا بالنصّ. تُستثنى فلا
  // عائلة لها، وتمييزها بالصورة يحرسه المحرك (لا صورة تتكرّر عبر عدم التكرار).
  const textual = ALL_QUESTIONS.filter((q) => !q.image)
  for (const q of textual) {
    const k = prefixKey(q)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  for (const q of textual) {
    const k = prefixKey(q)
    if ((counts.get(k) ?? 0) >= FAMILY_MIN_SIZE) familyById.set(q.id, k)
  }
}

/** مفتاح عائلة السؤال، أو null إن لم ينتمِ إلى قالب متكرّر. */
export function familyOf(q: Question): string | null {
  return familyById.get(q.id) ?? null
}
