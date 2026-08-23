import { useRef, type ReactNode } from 'react'
import { useFitText } from './fitText'

/**
 * الإجابة المكشوفة — مقاسها يتبع طولها.
 *
 * إجابات البنك أسماءٌ وأماكن: وسيطها عشرة أحرف، والمئين التاسع والتسعون
 * ثلاثون. فكفاها مقاسٌ ثابت كبير سنةً كاملة. ثم دخلت «أمثال وألغاز» في
 * ٢٣ أغسطس ٢٠٢٦ بإجابات جملٍ كاملة — «زن ثلاثًا مقابل ثلاث؛ إن تساوتا…»
 * مئةٌ واثنان وعشرون حرفاً — فخرجت عن بطاقة الكشف تسعةً وتسعين بكسلاً
 * وابتُتر آخرها، وهو أسوأ ما يقع في شاشة الكشف: الإجابة هي الذروة.
 *
 * خمسُ إجاباتٍ من ألفٍ وستمئةٍ وتسعٍ وثلاثين تتجاوز الستّين حرفاً، فالقياس
 * لا يمسّ سواها — البقيّة تسعُ صندوقها من أول رسمة فلا يهبط لها مقاس.
 *
 * `as="span"` للديربي: إجابته جزءٌ من سطرٍ فيه لصيقة «الإجابة»، فلا تصلح
 * أن تكون كتلة. و`fitKey` لمن كان محتواه مركّباً لا نصّاً مفرداً.
 */
export function FitAnswer({
  children,
  className,
  as: Tag = 'div',
  fitKey,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'span' | 'p'
  fitKey?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useFitText(ref, fitKey ?? (typeof children === 'string' ? children : ''))

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  )
}
