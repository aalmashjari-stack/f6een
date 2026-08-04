import { useEffect, useRef, useState } from 'react'
import { play } from '../audio/sfx'

/** آخر كم ثانية تُسمَع نبضاتها. */
const AUDIBLE_SECS = 5

/**
 * عدّاد تنازلي دقيق يعتمد على الزمن الحقيقي (performance.now) لا على عدد النبضات،
 * حتى لا ينحرف على التابلت. يعيد المتبقّي بالميلي ثانية.
 * running=false يوقف العدّ ويجمّد القيمة. عند بلوغ الصفر يُستدعى onDone مرة واحدة.
 *
 * الصوت هنا لا في الشاشات: المؤقت يظهر في أربع شاشات، ووضعه في كل واحدة
 * يفتح باب اختلافها. وهو أقوى مواضع الصوت مبرراً — الفريق يتشاور ووجوهه
 * إلى بعضها لا إلى الشاشة، فلا أحد يراقب الرقم وهو ينزل.
 */
export function useCountdown(durationMs: number, running: boolean, onDone?: () => void) {
  const [remaining, setRemaining] = useState(durationMs)
  const endRef = useRef<number>(0)
  const firedRef = useRef(false)
  /** آخر ثانية صحيحة نُطقت — حتى تُسمع النبضة مرة واحدة لا في كل إطار. */
  const lastSecRef = useRef(-1)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  // إعادة الضبط عند تغيّر المدّة (سؤال جديد / دور جديد)
  useEffect(() => {
    setRemaining(durationMs)
    firedRef.current = false
    lastSecRef.current = -1
  }, [durationMs])

  useEffect(() => {
    if (!running) return
    endRef.current = performance.now() + remaining
    let raf = 0
    const tick = () => {
      const left = Math.max(0, endRef.current - performance.now())
      setRemaining(left)

      const sec = Math.ceil(left / 1000)
      if (sec !== lastSecRef.current) {
        // الشرط الأول يمنع نبضة عند أول إطار: المؤقت يُركَّب وهو في ثانيته الأخيرة
        // في وضع الاختبار السريع، فتنطلق نبضة قبل أن يبدأ العدّ فعلاً.
        if (lastSecRef.current !== -1 && sec >= 1 && sec <= AUDIBLE_SECS) play('tick')
        lastSecRef.current = sec
      }

      if (left <= 0) {
        if (!firedRef.current) {
          firedRef.current = true
          play('timeUp')
          doneRef.current?.()
        }
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, durationMs])

  return remaining
}
