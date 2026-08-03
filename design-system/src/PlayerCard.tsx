import type { ReactNode } from 'react'

export interface PlayerCardProps {
  team: string
  name: string
  /** يلوّن الإطار بحكم اللاعب — يُقرأ من آخر المجلس بلمحة */
  mark?: 'none' | 'gold' | 'coral'
  /** صناديق الحكم (ChoiceBox) */
  children?: ReactNode
}

/**
 * بطاقة لاعب في مواجهة فردية: اسم الفريق فوق، اسم اللاعب كبيراً، والحكم تحته.
 *
 * الإطار يحمل الحكم والصندوق يحمل التفصيل — الجالس بعيداً يقرأ اللون،
 * والمشغّل يقرأ الرقم.
 */
export function PlayerCard({ team, name, mark = 'none', children }: PlayerCardProps) {
  return (
    <div className={'sh-playercard' + (mark !== 'none' ? ` sh-playercard--${mark}` : '')}>
      <span className="sh-playercard__team">{team}</span>
      <span className="sh-playercard__name">{name}</span>
      {children && <div className="sh-playercard__choices">{children}</div>}
    </div>
  )
}
