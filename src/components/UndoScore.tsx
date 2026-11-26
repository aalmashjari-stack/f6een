import { useEffect } from 'react'
import undoScoreCss from './UndoScore.css?inline'

/** مدّة النافذة — أطول من ردّ فعل «لا، الفريق الثاني!» وأقصر من أن تُنسى على الشاشة. */
export const UNDO_MS = 4000

/**
 * «تراجع» بعد تنقيط الجولة الجماعية (تدقيق ٥ أكتوبر M7، ٢٦ نوفمبر ٢٠٢٦).
 *
 * ضغطةٌ على الفريق الخطأ تمنح النقاط وتعود إلى اللوح، وكان ردُّها بأزرار ±10
 * وحدها: خمسون نقطةً تعجيزيّة ذهبت للفريق الخطأ = خمس ضغطات هنا وخمس هناك.
 * أربع ثوانٍ بعد التنقيط يظهر هذا الزرّ فيعيد الشاشة إلى «من أجاب؟» كما كانت
 * — باللقطة المحفوظة قبل التنقيط (`RESUME`)، لا بعكس الحساب: لا منطقَ
 * ثانياً يُكتب للنقاط والسجلّ فينحرف عن الأوّل.
 *
 * في الزاوية المقابلة لـ«إنهاء» لا فوق اللوح: الحكم يضغط الخليّة التالية
 * في هذه الثواني، وزرٌّ في الوسط يركب عليها.
 */
export function UndoScore({ onUndo, onExpire }: { onUndo: () => void; onExpire: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onExpire, UNDO_MS)
    return () => window.clearTimeout(t)
  }, [onExpire])
  return (
    <div className="undo-score">
      <button type="button" onClick={onUndo}>
        تراجع
      </button>
      <style>{undoScoreCss}</style>
    </div>
  )
}
