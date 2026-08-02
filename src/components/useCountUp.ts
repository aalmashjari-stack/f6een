import { useEffect, useRef, useState } from 'react'

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * يعدّ الرقم صعوداً أو نزولاً بدل أن يقفز.
 * النقاط تُقرأ من آخر المجلس، والقفزة المفاجئة تضيع على من لم يكن ناظراً —
 * العدّ يجرّ العين إلى الرقم المتغيّر.
 *
 * `initial` لبدء العدّ من رقم سابق عند أول عرض — يلزم لأن شريط النتيجة
 * يُعاد بناؤه مع كل شاشة، فلا يرث القيمة القديمة من نفسه.
 */
export function useCountUp(value: number, ms = 650, initial = value) {
  const [display, setDisplay] = useState(initial)
  const shownRef = useRef(initial)

  useEffect(() => {
    if (shownRef.current === value) return
    if (reduced()) {
      shownRef.current = value
      setDisplay(value)
      return
    }

    const from = shownRef.current
    const t0 = performance.now()
    let raf = 0

    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      const next = Math.round(from + (value - from) * eased)
      shownRef.current = next
      setDisplay(next)
      if (p < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])

  return display
}
