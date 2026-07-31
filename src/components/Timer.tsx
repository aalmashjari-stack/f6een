/**
 * المؤقت: رقم كبير للحكم وشريط للجمهور معاً — القسم ١٠.
 * coral=true في الحق ما تلحق فقط (العداء مع الوقت).
 */
export function Timer({ remainingMs, totalMs, coral }: { remainingMs: number; totalMs: number; coral?: boolean }) {
  const secs = Math.ceil(remainingMs / 1000)
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs))
  const color = coral ? 'var(--coral)' : 'var(--gold)'
  const low = remainingMs <= 5000
  return (
    <div className="timer">
      <div className="timer-num tabular" style={{ color, transform: low ? 'scale(1.04)' : 'none' }}>
        {secs}
      </div>
      <div className="timer-track">
        <div className="timer-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <style>{`
        .timer { display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; }
        .timer-num { font-size: clamp(56px, 12vh, 128px); font-weight: 800; line-height: 1; transition: transform .2s ease; }
        .timer-track { width:100%; max-width:900px; height:14px; background: var(--surface); border-radius: 999px; overflow:hidden; border:1px solid var(--border); }
        .timer-fill { height:100%; border-radius:999px; transition: width .12s linear; }
      `}</style>
    </div>
  )
}
