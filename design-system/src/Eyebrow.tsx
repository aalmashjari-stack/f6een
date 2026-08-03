import type { ReactNode } from 'react'

export interface EyebrowProps {
  children: ReactNode
}

/**
 * سطر السياق فوق المحتوى: أين نحن في اللعبة.
 * «الجولة الجماعية · سؤال 3 / 6 · متوسط · دور الصقور»
 *
 * الفواصل نقاط وسطية (·) لا شرطات — تُقرأ كسطر واحد لا كقائمة.
 */
export function Eyebrow({ children }: EyebrowProps) {
  return <div className="sh-eyebrow">{children}</div>
}
