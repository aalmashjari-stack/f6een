import type { Question } from '../game/types'
import { isImageUrl } from '../game/celebs'
import { shippedImage } from '../game/shippedImage'

/**
 * تحميلُ الصور قبل أن تُطلب — ما يُعرف مسبقاً وحده.
 *
 * قِيس ١٦ أكتوبر ٢٠٢٦ من الكويت: أوّلُ طلبٍ لصورةٍ 0.6–0.9 ثانية (Cloudflare
 * لا يحتفظ بها لقلّة اللاعبين فيذهب الطلب إلى Railway في أوروبا)، والثاني
 * 0.2–0.45. وكانت كلُّ صورةٍ لا تُطلب إلّا لحظةَ ظهورها.
 *
 * وما يُعرف مسبقاً شيئان فقط: **صورةُ الإجابة** ما دام السؤال معروضاً (تظهر
 * لحظةَ الكشف)، و**طابورُ «الحق ما تلحق»** المسحوبُ أوّلَ الجلسة. أمّا سؤال
 * اللوح والديربي فيُسحب لحظةَ الضغط ويظهر فوراً — لا شيء يُسبَق هناك.
 */

/** مصادرُ صورتَي السؤال المشحونة أو المرفوعة؛ المفتاح المجهول يُسقَط. */
export function questionImageSrcs(q: Question): string[] {
  const out: string[] = []
  for (const key of [q.image, q.answerImage]) {
    if (!key) continue
    const src = isImageUrl(key) ? key : shippedImage(key)
    if (src && !out.includes(src)) out.push(src)
  }
  return out
}

/* المحمَّل يُحفظ وسمُه كي لا يُجمع قبل أن يكتمل جلبُه، ولا يُطلب مرّتين. */
const warmed = new Map<string, HTMLImageElement>()

/** يطلب صور الأسئلة في الخلفيّة لتكون في ذاكرة المتصفّح حين تُعرض. */
export function warmQuestionImages(qs: Iterable<Question | null | undefined>): void {
  for (const q of qs) {
    if (!q) continue
    for (const src of questionImageSrcs(q)) {
      if (warmed.has(src)) continue
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      warmed.set(src, img)
    }
  }
}
