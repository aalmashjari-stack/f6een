import type { GameState } from '../game/session'
import { STAGE2_TIMER_MS } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionView } from '../components/QuestionView'
import { RoundBar } from '../components/RoundBar'

export function Stage2Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const q = state.currentQuestion!
  const sel = state.s2Sel!
  const left = useCountdown(STAGE2_TIMER_MS, true, () => dispatch({ t: 'S2_TO_REVEAL' }))
  const nameOf = (team: TeamId) => state.teams[team].players[sel[team]]?.name ?? ''

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      <div className="s2-versus">
        <span className="p right">{nameOf(0)}</span>
        <span className="vs">ضد</span>
        <span className="p left">{nameOf(1)}</span>
      </div>

      <RoundBar title="الديربي" chips={[state.currentCategory, 'متوسط', 'لا تشاور']} />

      <div className="q-box grow center-all">
        <QuestionView q={q} />
      </div>

      {/* مؤقّت الديربي داخل مسار مستقل: لا يشارك بطاقة السؤال ارتفاعها ولا
          يُترك كعنصر حرّ بين أقسام الصفحة القابلة للتمرير. */}
      <div className="s2-timer-stage">
        <Timer remainingMs={left} totalMs={STAGE2_TIMER_MS} />
      </div>

      <div className="stack gap-s">
        <button className="action compact" onClick={() => dispatch({ t: 'S2_TO_REVEAL' })}>
          كشف الإجابة
        </button>
        <div className="action-note">يُكشف تلقائياً عند انتهاء الوقت</div>
      </div>

      <style>{`
        .s2-versus { display:flex; align-items:center; justify-content:center; gap:clamp(12px,3vw,32px); }
        .s2-versus .p { font-size:clamp(20px,3vw,32px); font-weight:800; }
        .s2-versus .vs { color:var(--coral); font-weight:800; font-size:clamp(16px,2vw,22px); }
        .s2-timer-stage {
          flex:none;
          min-height:clamp(132px,22vh,220px);
          display:grid;
          place-items:center;
          padding-block:clamp(12px,2.4vh,26px);
          scroll-margin-block:clamp(28px,5vh,56px);
        }
        .screen .s2-timer-stage .ring-timer {
          flex:none;
          margin:0;
          max-height:none;
        }
      `}</style>
    </div>
  )
}
