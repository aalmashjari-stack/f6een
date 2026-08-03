import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** primary = الفعل الوحيد الظاهر · coral = مرحلة فيها عداء مع الوقت · ghost = فعل ثانوي · sub = خيار ثالث بحجم النص */
  variant?: 'primary' | 'coral' | 'ghost' | 'sub'
  children: ReactNode
}

/**
 * الفعل الأساسي في الشاشة — كبسولة لا مستطيل، وعرضها كامل عادةً.
 *
 * مبدأ صحصحلي: فعل واحد ظاهر في كل شاشة. إن احتجت زرّين، الثاني `ghost`
 * أو `sub` لا `primary` ثانٍ — زران أساسيان يجعلان الحكم يتردّد قبل الضغط.
 *
 * ونصّ الزر يسمّي **الخطوة التالية** لا الحالية («انتهى التشاور — إجابة سالم»)،
 * لأن مشغّل اللعبة يقود ثلاث مراحل ولا يحفظ التسلسل.
 */
export function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  return (
    <button className={`sh-btn sh-btn--${variant}`} {...rest}>
      {children}
    </button>
  )
}
