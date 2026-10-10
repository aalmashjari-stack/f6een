import { useRef } from 'react'
import { useFitText } from './fitText'
import timerCss from './Timer.css?inline'

/**
 * المؤقت: حلقة تفرغ والرقم في وسطها.
 * coral=true في الحق ما تلحق فقط (العداء مع الوقت) — القسم ١٠.
 */
const R = 46
const C = 2 * Math.PI * R

export function Timer({
  remainingMs,
  totalMs,
  coral,
  size = 'md',
}: {
  remainingMs: number
  totalMs: number
  coral?: boolean
  size?: 'md' | 'lg'
}) {
  const secs = Math.ceil(remainingMs / 1000)
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs))
  const color = coral ? 'var(--coral)' : 'var(--gold)'
  const low = remainingMs <= 5000 && remainingMs > 0

  /**
   * الرقم مقاسُه من الشاشة بينما البطاقة تتقلّص مع ما يتبقّى لها من العمود
   * (flex:0 1 auto وmax-height:100%) — فحين يضيق العمود تنكمش هي ويبقى هو على
   * حاله فيخرج منها. ظهر ذلك حين أضاف تلميحُ «أكمل المثل» ثلاثين بكسلاً إلى
   * بطاقة السؤال فوقه، لكن العلّة أقدم من التلميح وتصيب أي عمودٍ ضيّق.
   * فيقيس نفسه على بطاقته كما يفعل السؤال والإجابة — وقيمةُ الشاشة تبقى
   * مقاسَ البداية، فلا يمسّه القياس إلا حين تضيق البطاقة فعلاً.
   */
  const secsRef = useRef<HTMLSpanElement>(null)
  useFitText(secsRef, String(secs))

  return (
    <div className={'ring-timer ' + size + (low ? ' low' : '')}>
      <svg viewBox="0 0 100 100">
        <circle className="track" cx="50" cy="50" r={R} />
        <circle
          className="fill"
          cx="50"
          cy="50"
          r={R}
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
        />
      </svg>
      <span ref={secsRef} className="secs tabular" style={{ color }}>
        {secs}
      </span>
      <span className="timer-progress" aria-hidden="true">
        <span style={{ width: `${pct * 100}%`, background: color }} />
      </span>

      <style>{timerCss}</style>
    </div>
  )
}
