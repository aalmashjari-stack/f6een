import { useEffect, useState } from 'react'
import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'

/**
 * «السؤال السابق» — زرٌّ بجانب «اكشف الإجابة» يعيد الحكمَ إلى **شاشة كشف
 * السؤال الذي سبق** (طلب علي ٢٠ سبتمبر ٢٠٢٦: «الزرّ يجعلني أعود لصفحة
 * السؤال السابق»): يُلغى الاختيار الجاري وتُفتح خليّته، ويُمسح تنقيطُ السابق
 * ليُعاد — `S1_BACK` يستعيد اللقطة التي أخذها `S1_SCORE`.
 *
 * ضغطتان لا واحدة: الأولى تُظهر «تأكيد الرجوع؟» ثلاث ثوانٍ، والثانية تنفّذ —
 * كزرّ «إنهاء». ضغطةٌ عابرة على شاشة المجلس لا تُسقط سؤالاً معروضاً.
 * ولا يظهر الزرّ حين لا سابق (أوّل سؤال) بدل أن يُعطَّل — المطفأ يُقرأ معطوباً.
 */
export function PrevQuestion({
  state,
  dispatch,
}: {
  state: GameState
  dispatch: (a: Action) => void
}) {
  const [arm, setArm] = useState(false)
  useEffect(() => {
    if (!arm) return
    const t = setTimeout(() => setArm(false), 3000)
    return () => clearTimeout(t)
  }, [arm])

  if (!state.s1Undo) return null

  return (
    <button
      className={'action compact ghost pq-btn' + (arm ? ' armed' : '')}
      onClick={() => {
        if (!arm) {
          setArm(true)
          return
        }
        setArm(false)
        dispatch({ t: 'S1_BACK' })
      }}
    >
      {arm ? 'تأكيد الرجوع؟' : 'السؤال السابق'}
    </button>
  )
}
