import type { ReactNode } from 'react'
import type { Question } from '../game/types'
import { isImageUrl } from '../game/celebs'
import { shippedImage } from '../game/shippedImage'

/**
 * وجهُ الإجابة إلى جانبها — لفافةٌ واحدة تستعملها شاشاتُ الكشف الثلاث.
 *
 * `answerImage` عكسُ `image`: السؤال يبقى نصّاً، والصورةُ لا تظهر إلّا لحظةَ
 * الكشف. فالمواضع التي تعرض إجابةً هي مواضعُ هذا الوجه — كشفُ الجولة
 * الجماعية، وكشفُ الديربي، و«الحق ما تلحق».
 *
 * **ولفافةٌ لا ثلاثُ نسخ**: شرطُ الالتفاف مكتوبٌ هنا وحده، فمن أضاف شاشةَ
 * كشفٍ رابعة يلفّ إجابتها بها ولا ينسخ شرطاً — وهذا أكثرُ ما يُعطب في هذا
 * المشروع: قائمةٌ أو شكلٌ في موضعين يُحدَّث في واحد.
 *
 * وبلا صورة لا يبقى أثر: تُعاد الإجابةُ كما هي، فلا صفٌّ زائد يزيح تنسيقاً
 * قائماً.
 *
 * **ومفتاحٌ لا يعرفه هذا الإصدار يُعامَل كغياب الصورة، لا كصورةٍ مؤقّتة.**
 * الوجوه تُشحن مع التطبيق والمفاتيح تأتي من القاعدة، فنسخةٌ قديمة في جيب
 * لاعبٍ تصلها مفاتيحُ دفعةٍ لم تُشحن فيها بعد (٥٠٠ وجهٍ في ١٤ سبتمبر ٢٠٢٦).
 * دائرةٌ رماديّة بجانب الإجابة تُقرأ عطباً؛ وغيابُها لا يُلاحَظ.
 */
export function AnswerFace({ q, children }: { q: Question; children: ReactNode }) {
  const key = q.answerImage
  const src = key ? (isImageUrl(key) ? key : shippedImage(key)) : null
  if (!src) return <>{children}</>
  return (
    <div className="rv-answer-row">
      <img className="rv-face" src={src} alt="" />
      {children}
    </div>
  )
}
