import { supabase } from './supabase'
import { loadUsedIds, persistUsedIds } from '../game/session'

/**
 * ذاكرة الأسئلة على الخادم — SPEC القسم ٨.
 *
 * **الجهاز يبقى مصدر اللعب، والخادم ذاكرةٌ دائمة فوقه.** اللعبة تعمل بلا
 * إنترنت بعد التحميل (SPEC القسم ٦)، فلا يجوز أن ينتظر سحبُ سؤالٍ شبكةً.
 * لذلك: القراءة من `localStorage` كما كانت، والخادم يُدمج فيها قبل بدء أي
 * لعبة، ويُغذَّى بعدها في الخلفية. وكلّ فشل شبكة يُبتلع — أسوأ أثره أن
 * تتأخّر المزامنة إلى المرّة القادمة، لا أن تتعطّل لعبة قائمة.
 */

/** ما يعرفه الخادم عن هذا الحساب. */
export async function fetchServerUsedIds(): Promise<string[]> {
  const { data, error } = await supabase.from('used_questions').select('question_id')
  if (error) throw error
  return (data ?? []).map((r) => r.question_id as string)
}

/**
 * رفع معرّفات إلى الخادم.
 *
 * `ignoreDuplicates` يعتمد على المفتاح الأساسي `(user_id, question_id)`:
 * رفع سؤالٍ مرفوع سابقاً لا يفعل شيئاً ولا يُعدّ خطأً — فيصير الرفع آمن
 * التكرار، ولا نحتاج فحصاً قبله.
 */
export async function pushUsedIds(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const rows = ids.map((question_id) => ({ user_id: userId, question_id }))
  const { error } = await supabase
    .from('used_questions')
    .upsert(rows, { onConflict: 'user_id,question_id', ignoreDuplicates: true })
  if (error) throw error
}

/**
 * مزامنة أولى عند توفّر الجلسة — **قبل أي لعبة**.
 *
 * الاتّجاهان معاً عمداً:
 * - **نزولاً:** ما يعرفه الخادم يدخل الجهاز، فمن لعب على كمبيوتره لا يسمع
 *   الأسئلة نفسها على جواله.
 * - **صعوداً:** ما لعبه على هذا الجهاز *قبل* أن ينشئ حساباً يُرفع مرّة، فلا
 *   تضيع ذاكرته بمجرّد أنّه سجّل متأخّراً.
 *
 * والدمج اتّحادٌ لا استبدال: الذاكرة تراكميّة بالتعريف.
 * والحفظ المحلّي يسبق الرفع، فلو انقطعت الشبكة بينهما بقي المكسب النازل.
 */
export async function syncUsedIds(userId: string): Promise<{ merged: Set<string>; pushed: number }> {
  const local = loadUsedIds()
  const server = new Set(await fetchServerUsedIds())

  const onlyLocal = [...local].filter((id) => !server.has(id))
  const merged = new Set([...local, ...server])

  persistUsedIds(merged)
  await pushUsedIds(userId, onlyLocal)

  return { merged, pushed: onlyLocal.length }
}
