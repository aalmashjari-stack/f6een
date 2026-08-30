import { supabase } from './supabase'
import { setBlockedQuestionIds } from '../game/bank'

/**
 * الأسئلة المحجوزة — بلاغٌ من لاعب يوقف السؤال حتى يراجعه المدير.
 *
 * **الجهاز يبقى مصدر اللعب.** اللعبة تعمل بلا إنترنت بعد التحميل (SPEC ٦)،
 * فلا يجوز أن ينتظر سحبُ سؤالٍ شبكةً: القائمة تُقرأ من `localStorage` فوراً
 * عند الإقلاع، ثمّ تُحدَّث من الخادم في الخلفية للمرّة القادمة. وكل فشل
 * شبكة يُبتلع — أسوأ أثره أن يتأخّر حجزٌ جلسةً واحدة.
 */

const KEY = 'f6een.blockedQuestionIds'

function loadLocal(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveLocal(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* تجاهل */
  }
}

/** تُنادى عند الإقلاع قبل أي سحب — بلا شبكة. */
export function applyCachedBlocked() {
  setBlockedQuestionIds(loadLocal())
}

/** تُنادى بعد توفّر الجلسة: تُحدّث القائمة من الخادم وتخزّنها. */
export async function syncBlocked(): Promise<void> {
  const { data, error } = await supabase.rpc('blocked_questions')
  if (error) throw error
  const ids = (data ?? []).map((r: { question_id: string }) => r.question_id)
  saveLocal(ids)
  setBlockedQuestionIds(ids)
}

/**
 * تبليغ عن سؤال — يسجّل البلاغ ويحجز السؤال في القاعدة.
 *
 * والحجز يُطبَّق محلّياً في اللحظة نفسها: من بلّغ عن سؤالٍ في ختام جلسته
 * لا يريد أن يراه في جلسته التالية قبل أن تُزامن القائمة.
 */
export async function reportQuestion(questionId: string, sessionId?: string | null): Promise<void> {
  const { error } = await supabase.rpc('report_question', {
    p_question_id: questionId,
    p_session_id: sessionId ?? null,
  })
  if (error) throw error
  const ids = [...new Set([...loadLocal(), questionId])]
  saveLocal(ids)
  setBlockedQuestionIds(ids)
}
