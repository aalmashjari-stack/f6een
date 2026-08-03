import type { ReactNode } from 'react'

export interface QuestionCardProps {
  children: ReactNode
}

/**
 * بطاقة السؤال — أكبر عنصر في شاشة اللعب.
 *
 * الانحناء كبير جداً (حتى 64px) عمداً: يكسر شكل المستطيل فلا تبدو الشاشة
 * كنموذج إدخال. والنص يكبر مع الشاشة حتى 46px لأن **أطول سؤال في البنك يجب
 * أن يُقرأ من آخر المجلس** — وهذا شرط تشغيل لا تفضيل جمالي.
 */
export function QuestionCard({ children }: QuestionCardProps) {
  return (
    <div className="sh-question">
      <p className="sh-question__text">{children}</p>
    </div>
  )
}
