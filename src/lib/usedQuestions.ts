import { supabase } from './supabase'
import { currentUserId } from './auth'
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

/**
 * حدّ الصفوف في الطلب الواحد — `db-max-rows` في Supabase ألفٌ، وما فوقه
 * يُقصّ **بصمت**. وقع في لوحة الأسئلة (٥ سبتمبر ٢٠٢٦) ولم يُعمَّم هنا:
 * حسابٌ لعب نحو عشرين جلسة يتجاوز الألف، فكان جهازه الثاني يستلم ذاكرةً
 * مبتورة ويعيد أسئلةً سُمعت. فتُقرأ صفحةً صفحةً حتى تقصر الصفحة.
 */
const PAGE = 1000

/**
 * ما يعرفه الخادم عن هذا الحساب — **بترتيب الاستعمال، الأقدم أوّلاً**.
 * الترتيب ليس زينة: عليه تقوم قاعدة «الأقدم استخداماً» في السحب عند النفاد.
 */
export async function fetchServerUsedIds(): Promise<string[]> {
  const uid = await currentUserId()
  const ids: string[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('used_questions')
      .select('question_id')
      .eq('user_id', uid)
      .order('used_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    const page = (data ?? []).map((r) => r.question_id as string)
    ids.push(...page)
    if (page.length < PAGE) break
  }
  return ids
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
 * - **صعوداً:** ما في هذا الجهاز ولم يبلغ الخادم يُرفع مرّة.
 *
 * والدمج اتّحادٌ لا استبدال: الذاكرة تراكميّة بالتعريف. وترتيبُ الخادم
 * هو الأصل (يحمل `used_at`)، وما انفرد به الجهاز يلحق به — فهو الأحدث.
 * والمحلّي يُقرأ **بعد** وصول الردّ لا قبله: سؤالٌ عُرض والطلبُ في الطريق
 * كان يُمحى حين تُكتب النتيجة فوقه.
 * والحفظ المحلّي يسبق الرفع، فلو انقطعت الشبكة بينهما بقي المكسب النازل.
 */
export async function syncUsedIds(userId: string): Promise<{ merged: Set<string>; pushed: number }> {
  const server = await fetchServerUsedIds()
  const known = new Set(server)
  const local = loadUsedIds()

  const onlyLocal = [...local].filter((id) => !known.has(id))
  const merged = new Set([...server, ...onlyLocal])

  persistUsedIds(merged)
  await pushUsedIds(userId, onlyLocal)

  return { merged, pushed: onlyLocal.length }
}
