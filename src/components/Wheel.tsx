import { useRef, useState } from 'react'
import { CATEGORIES } from '../game/bank'

const N = CATEGORIES.length // 9
const SEG = 360 / N
const CX = 50
const CY = 50
const R = 48

function xy(r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)]
}

function sectorPath(i: number) {
  const [x1, y1] = xy(R, i * SEG)
  const [x2, y2] = xy(R, (i + 1) * SEG)
  return `M ${CX} ${CY} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`
}

/** يقسّم اسم التصنيف لسطرين على الكلمة للعرض داخل القطاع. */
function twoLines(label: string): [string, string] {
  const parts = label.split(' ')
  if (parts.length === 1) return [label, '']
  const mid = Math.ceil(parts.length / 2)
  return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')]
}

export function Wheel({
  spent,
  onResult,
  eyebrow,
}: {
  spent: string[]
  onResult: (category: string) => void
  eyebrow: string
}) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState<string | null>(null)
  const firedRef = useRef(false)
  const landedRef = useRef<string | null>(null)

  const available = CATEGORIES.filter((c) => !spent.includes(c))

  function spin() {
    if (spinning || available.length === 0) return
    setSpinning(true)
    setLanded(null)
    firedRef.current = false
    const target = available[Math.floor(Math.random() * available.length)]
    const idx = CATEGORIES.indexOf(target)
    const centerAngle = idx * SEG + SEG / 2
    const spins = 5
    const base = rotation + spins * 360
    const targetMod = ((360 - centerAngle) % 360 + 360) % 360
    const currentMod = ((base % 360) + 360) % 360
    let delta = targetMod - currentMod
    if (delta < 0) delta += 360
    const jitter = (Math.random() * 2 - 1) * (SEG / 2 - 6)
    const final = base + delta + jitter
    setRotation(final)
    // خزّن النتيجة لاستدعائها عند انتهاء الحركة
    landedRef.current = target
  }

  function onEnd() {
    if (!spinning || firedRef.current) return
    firedRef.current = true
    setSpinning(false)
    const target = landedRef.current!
    setLanded(target)
    // انتقال تلقائي للسؤال بعد لحظة — القسم ٧
    setTimeout(() => onResult(target), 850)
  }

  return (
    <div className="wheel-screen">
      <div className="eyebrow center">{eyebrow}</div>

      <div className="wheel-body">
        <div className="disc-wrap">
          {/* المؤشر المرجاني في الأعلى */}
          <svg className="pointer" viewBox="0 0 20 18" width="34" height="30" aria-hidden>
            <path d="M10 18 L0 0 L20 0 Z" fill="var(--coral)" />
          </svg>
          <svg
            className="disc"
            viewBox="0 0 100 100"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4.2s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
            }}
            onTransitionEnd={onEnd}
          >
            {CATEGORIES.map((cat, i) => {
              const isSpent = spent.includes(cat)
              const fill = isSpent ? 'var(--spent)' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'
              const [l1, l2] = twoLines(cat)
              const mid = i * SEG + SEG / 2
              const [tx, ty] = xy(30, mid)
              return (
                <g key={cat}>
                  <path d={sectorPath(i)} fill={fill} stroke="var(--night)" strokeWidth={0.6} />
                  <g transform={`translate(${tx} ${ty}) rotate(${mid})`}>
                    <text
                      textAnchor="middle"
                      fontSize={l2 ? 3.4 : 3.8}
                      fontWeight={700}
                      fill={isSpent ? 'var(--spent-text)' : 'var(--cream)'}
                      y={l2 ? -1.6 : 1.2}
                    >
                      {l1}
                    </text>
                    {l2 && (
                      <text textAnchor="middle" fontSize={3.4} fontWeight={700} fill={isSpent ? 'var(--spent-text)' : 'var(--cream)'} y={2.6}>
                        {l2}
                      </text>
                    )}
                  </g>
                </g>
              )
            })}
            <circle cx={CX} cy={CY} r={7} fill="var(--gold)" stroke="var(--night)" strokeWidth={0.8} />
          </svg>
        </div>

        {/* قائمة ما خرج من العجلة */}
        <div className="spent-list">
          <div className="spent-title">خرجت من العجلة</div>
          {spent.length === 0 && <div className="spent-empty">— لا شيء بعد —</div>}
          {spent.map((c) => (
            <div key={c} className="spent-item">
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="stack gap-s">
        <button className="action" onClick={spin} disabled={spinning || landed !== null || available.length === 0}>
          {landed ? `التصنيف: ${landed}` : spinning ? '...' : 'لف العجلة'}
        </button>
        <div className="action-note">اللفّة نهائية — بلا إعادة</div>
      </div>

      <style>{`
        .wheel-screen { flex:1; min-height:0; display:flex; flex-direction:column; gap:16px; }
        .wheel-body { flex:1; min-height:0; display:flex; align-items:center; justify-content:center; gap:clamp(12px,3vw,40px); }
        .disc-wrap { position:relative; height:100%; aspect-ratio:1; max-height:min(62vh, 560px); display:flex; align-items:center; justify-content:center; }
        .pointer { position:absolute; top:-6px; left:50%; transform:translateX(-50%); z-index:2; filter: drop-shadow(0 2px 3px rgba(0,0,0,.4)); }
        .disc { width:100%; height:100%; border-radius:50%; filter: drop-shadow(0 8px 24px rgba(0,0,0,.35)); }
        .spent-list { min-width:150px; max-width:220px; display:flex; flex-direction:column; gap:6px; align-self:center; }
        .spent-title { color: var(--text-2); font-weight:800; font-size:14px; margin-bottom:4px; }
        .spent-empty { color: var(--text-3); font-size:13px; }
        .spent-item { color: var(--spent-text); font-size:14px; font-weight:600; padding:6px 10px; background:var(--spent); border-radius:10px; }
        @media (max-width: 700px) { .spent-list { display:none; } }
      `}</style>
    </div>
  )
}
