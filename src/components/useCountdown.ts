import { useEffect, useRef, useState } from 'react'

/**
 * عدّاد تنازلي دقيق يعتمد على الزمن الحقيقي (performance.now) لا على عدد النبضات،
 * حتى لا ينحرف على التابلت. يعيد المتبقّي بالميلي ثانية.
 * running=false يوقف العدّ ويجمّد القيمة. عند بلوغ الصفر يُستدعى onDone مرة واحدة.
 */
export function useCountdown(durationMs: number, running: boolean, onDone?: () => void) {
  const [remaining, setRemaining] = useState(durationMs)
  const endRef = useRef<number>(0)
  const firedRef = useRef(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  // إعادة الضبط عند تغيّر المدّة (سؤال جديد / دور جديد)
  useEffect(() => {
    setRemaining(durationMs)
    firedRef.current = false
  }, [durationMs])

  useEffect(() => {
    if (!running) return
    endRef.current = performance.now() + remaining
    let raf = 0
    const tick = () => {
      const left = Math.max(0, endRef.current - performance.now())
      setRemaining(left)
      if (left <= 0) {
        if (!firedRef.current) {
          firedRef.current = true
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
