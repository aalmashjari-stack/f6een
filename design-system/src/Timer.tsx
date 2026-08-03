const R = 46
const C = 2 * Math.PI * R

export interface TimerProps {
  /** ما تبقّى بالملي ثانية */
  remainingMs: number
  /** المدة الكاملة — الحلقة تفرغ بنسبة remainingMs/totalMs */
  totalMs: number
  /** مرجاني بدل ذهبي — للمرحلة التي فيها عداء مع الوقت وحدها */
  coral?: boolean
  size?: 'md' | 'lg'
}

/**
 * المؤقّت: حلقة تفرغ والرقم في وسطها.
 *
 * الرقم للمشغّل والحلقة للجمهور — الاثنان معاً لا أحدهما، لأن الجالس في آخر
 * المجلس يقرأ القوس ولا يقرأ الرقم.
 *
 * **اللون قرار لا تزيين:** الذهبي هو الأصل، والمرجاني للمرحلة التي تكون فيها
 * الساعة خصماً (الحق ما تلحق). استعماله في مرحلة تشاور يكذب على الجمهور.
 *
 * تحت خمس ثوانٍ يدخل تلقائياً حالة `low`: الرقم ينبض والحلقة تخفت.
 */
export function Timer({ remainingMs, totalMs, coral, size = 'md' }: TimerProps) {
  const secs = Math.ceil(remainingMs / 1000)
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs))
  const color = coral ? 'var(--sh-coral)' : 'var(--sh-gold)'
  const low = remainingMs <= 5000 && remainingMs > 0

  return (
    <div className={`sh-timer sh-timer--${size}` + (low ? ' sh-timer--low' : '')}>
      <svg viewBox="0 0 100 100">
        <circle className="sh-timer__track" cx="50" cy="50" r={R} />
        <circle
          className="sh-timer__fill"
          cx="50"
          cy="50"
          r={R}
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
        />
      </svg>
      <span className="sh-timer__secs sh-num" style={{ color }}>
        {secs}
      </span>
    </div>
  )
}
