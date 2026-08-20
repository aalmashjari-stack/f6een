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
      <span className="secs tabular" style={{ color }}>
        {secs}
      </span>
      <span className="timer-progress" aria-hidden="true">
        <span style={{ width: `${pct * 100}%`, background: color }} />
      </span>

      <style>{`
        /* align-self:center إلزامي — بدونه يمدّد الأب عرض الحلقة فتنفجر خارج الشاشة.
           والتقلّص عند ضيق المساحة بدل أن تطرد ما تحتها. */
        .ring-timer {
          position:relative; display:grid; place-items:center;
          align-self:center; aspect-ratio:1; min-height:0;
        }
        .ring-timer.md { flex:0 1 auto; height:clamp(120px,20vh,200px); max-height:100%; }
        .ring-timer.lg { flex:0 1 auto; height:min(32vh, 40vw, 320px); max-height:100%; }
        .ring-timer svg { width:100%; height:100%; transform:rotate(-90deg); overflow:visible; }
        .ring-timer .track { fill:none; stroke:var(--border); stroke-width:8; opacity:.55; }
        .ring-timer .fill {
          fill:none; stroke-width:8; stroke-linecap:round;
          transition:stroke-dashoffset .12s linear;
          filter:drop-shadow(0 0 10px currentColor);
        }
        .ring-timer .secs {
          position:absolute; font-weight:800; line-height:1;
          font-size:clamp(34px,9.5vh,104px);
          transition:transform .25s var(--ease-spring);
        }
        .ring-timer.low .secs { animation:tick 1s ease-in-out infinite; }
        .ring-timer.low .fill { animation:pulse-ring 1s ease-in-out infinite; }
        @keyframes tick {
          0%,100% { transform:scale(1); }
          22%     { transform:scale(1.13); }
        }
        @keyframes pulse-ring {
          0%,100% { opacity:1; }
          50%     { opacity:.55; }
        }

        /* جوال أفقي: أرضية الحلقة ١٢٠ بكسل وأرضية الرقم ٣٤ — أكبر ممّا يتبقّى
           لها من الارتفاع، فيخرج الرقم من حلقته ويركب على السؤال والزر معاً.
           هنا تنزل الأرضيتان إلى ما تحتمله الشاشة القصيرة. */
        @media (max-height:480px) {
          .ring-timer.md { height:clamp(56px, 16vh, 200px); }
          .ring-timer.lg { height:min(26vh, 40vw, 320px); }
          .ring-timer .secs { font-size:clamp(20px, 8vh, 104px); }
          .ring-timer .track, .ring-timer .fill { stroke-width:10; }
        }
      `}</style>
    </div>
  )
}
