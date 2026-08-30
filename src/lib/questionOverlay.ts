import { supabase } from './supabase'
import { setQuestionOverlay } from '../game/bank'
import type { Level, Question } from '../game/types'

/**
 * طبقة الأسئلة — ما عدّلته اللوحة أو أضافته فوق البنك المشحون.
 *
 * **نفس عقد قائمة المحجوز:** تُقرأ من التخزين المحلّي فوراً عند الإقلاع،
 * ثمّ تُحدَّث من الخادم في الخلفية. اللعبة تعمل بلا إنترنت (SPEC ٦)، فلا
 * ينتظر سحبُ سؤالٍ شبكةً — وأسوأ ما يقع بلا اتّصال أن يتأخّر تعديلُ سؤالٍ
 * جلسةً واحدة.
 */

const KEY = 'f6een.questionOverlay'

interface Row {
  question_id: string
  category: string
  level: string
  topic: string | null
  question: string
  answer: string
  image: string | null
}

const LEVELS: Level[] = ['سهل', 'متوسط', 'صعب']

/** صفٌّ من القاعدة إلى سؤال. الصفّ الفاسد يُطرح ولا يُسقط الطبقة كلّها. */
function toQuestion(r: Row): Question | null {
  if (!r?.question_id || !r.question || !r.answer) return null
  if (!LEVELS.includes(r.level as Level)) return null
  return {
    id: r.question_id,
    category: r.category,
    level: r.level as Level,
    topic: r.topic ?? '',
    question: r.question,
    answer: r.answer,
    ...(r.image ? { image: r.image } : {}),
  }
}

function loadLocal(): Row[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Row[]) : []
  } catch {
    return []
  }
}

function apply(rows: Row[]) {
  setQuestionOverlay(rows.map(toQuestion).filter((q): q is Question => q !== null))
}

/** تُنادى عند الإقلاع قبل أي سحب — بلا شبكة. */
export function applyCachedOverlay() {
  apply(loadLocal())
}

/** تُنادى بعد توفّر الجلسة. */
export async function syncOverlay(): Promise<void> {
  const { data, error } = await supabase.rpc('question_overlay')
  if (error) throw error
  const rows = (data ?? []) as Row[]
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {
    /* تجاهل — الطبقة تُطبَّق في هذه الجلسة على أي حال. */
  }
  apply(rows)
}
