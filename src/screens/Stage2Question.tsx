import type { GameState } from '../game/session'
import { STAGE2_TIMER_MS } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'

export function Stage2Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const q = state.currentQuestion!
  const sel = state.s2Sel!
  const left = useCountdown(STAGE2_TIMER_MS, true, () => dispatch({ t: 'S2_TO_REVEAL' }))
  const nameOf = (team: TeamId) => state.teams[team].players[sel[team]]?.name ?? ''

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`راس براس · جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      <div className="s2-versus">
        <span className="p right">{nameOf(0)}</span>
        <span className="vs">ضد</span>
        <span className="p left">{nameOf(1)}</span>
      </div>

      <div className="eyebrow center">
        {state.currentCategory} · متوسط · لا تشاور
      </div>

      <div className="q-box grow center-all">
        <p className="q-text">{q.question}</p>
      </div>

      <Timer remainingMs={left} totalMs={STAGE2_TIMER_MS} />

      <div className="stack gap-s">
        <button className="action" onClick={() => dispatch({ t: 'S2_TO_REVEAL' })}>
          كشف الإجابة
        </button>
        <div className="action-note">يُكشف تلقائياً عند انتهاء الوقت</div>
      </div>

      <style>{`
        .s2-versus { display:flex; align-items:center; justify-content:center; gap:clamp(12px,3vw,32px); }
        .s2-versus .p { font-size:clamp(20px,3vw,32px); font-weight:800; }
        .s2-versus .vs { color:var(--coral); font-weight:800; font-size:clamp(16px,2vw,22px); }
        .q-box { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:clamp(20px,4vh,44px); }
        .q-text { font-size:clamp(24px,4.4vw,46px); font-weight:800; line-height:1.5; text-align:center; }
      `}</style>
    </div>
  )
}
