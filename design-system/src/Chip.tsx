import type { ReactNode } from 'react'

export interface ChipProps {
  /** رقم يسبق النص — يُعرض بخط أعرض قليلاً */
  count?: number
  /** gold للإيجابي · coral للسلبي · neutral لما لا حكم فيه */
  tone?: 'neutral' | 'gold' | 'coral'
  children: ReactNode
}

/**
 * شريحة إحصائية صغيرة: «3 صحيحة» · «2 خاطئة».
 *
 * اللون يحمل الحكم فلا يحتاج القارئ أن يقرأ الكلمة ليعرف إن كان الرقم في
 * صالحه. تُستعمل في صفوف الختام حيث يُقارَن فريق بفريق بلمحة.
 */
export function Chip({ count, tone = 'neutral', children }: ChipProps) {
  return (
    <span className={`sh-chip sh-chip--${tone}`}>
      {count !== undefined && <span className="sh-chip__count sh-num">{count}</span>}
      {children}
    </span>
  )
}
