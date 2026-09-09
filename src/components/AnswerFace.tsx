import type { ReactNode } from 'react'
import type { Question } from '../game/types'
import { celebSrc } from '../game/celebs'

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
 */
export function AnswerFace({ q, children }: { q: Question; children: ReactNode }) {
  if (!q.answerImage) return <>{children}</>
  return (
    <div className="rv-answer-row">
      <img className="rv-face" src={celebSrc(q.answerImage)} alt="" />
      {children}
    </div>
  )
}
