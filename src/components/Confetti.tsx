import { useEffect, useRef } from 'react'

/**
 * انفجار رقائق للختام. ألوان الهوية وحدها (القسم ١١) — بلا لون جديد.
 * Canvas لا DOM: مئة عنصر متحرّك في DOM تُثقل الجهاز، واللوحة تطبعها في تمريرة واحدة.
 * يُلغى كاملاً عند تفضيل تقليل الحركة.
 */
const COLORS = ['#FFBD59', '#E4674A', '#F5EFE3']

interface Chip {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  rot: number
  vrot: number
  color: string
}

export function Confetti({ burstMs = 4200 }: { burstMs?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // دفعتان من الجانبين نحو المنتصف — أوضح من مطر عمودي متجانس.
    const chips: Chip[] = []
    const count = w < 700 ? 90 : 150
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0
      chips.push({
        x: fromLeft ? -20 : w + 20,
        y: h * (0.25 + Math.random() * 0.5),
        vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 7),
        vy: -(6 + Math.random() * 8),
        w: 6 + Math.random() * 7,
        h: 9 + Math.random() * 9,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length],
      })
    }

    const t0 = performance.now()
    let raf = 0

    const frame = (t: number) => {
      const age = t - t0
      ctx.clearRect(0, 0, w, h)
      let alive = false

      for (const c of chips) {
        c.vy += 0.28 // جاذبية
        c.vx *= 0.992
        c.x += c.vx
        c.y += c.vy
        c.rot += c.vrot

        if (c.y < h + 40) alive = true

        // تلاشٍ في الثلث الأخير بدل اختفاء مفاجئ
        const fade = age > burstMs * 0.66 ? Math.max(0, 1 - (age - burstMs * 0.66) / (burstMs * 0.34)) : 1
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(c.x, c.y)
        ctx.rotate(c.rot)
        ctx.fillStyle = c.color
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
        ctx.restore()
      }

      if (alive && age < burstMs) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, w, h)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [burstMs])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  )
}
