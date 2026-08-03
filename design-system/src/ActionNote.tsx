import type { ReactNode } from 'react'

export interface ActionNoteProps {
  children: ReactNode
}

/**
 * سطر خافت تحت الزر يشرح ما سيحدث — «السحبة نهائية بلا إعادة»،
 * «يُكشف تلقائياً عند انتهاء الوقت».
 *
 * يشرح القاعدة لا الزر: سطرٌ يقول «اضغط للسحب» تحت زر مكتوب عليه «ابدأ»
 * ضجيج، ويُحذف.
 */
export function ActionNote({ children }: ActionNoteProps) {
  return <div className="sh-action-note">{children}</div>
}
