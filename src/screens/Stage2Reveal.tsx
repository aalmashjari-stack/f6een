import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { Mark, TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'

const CYCLE: Record<Mark, Mark> = { صمت: 'صح', صح: 'غلط', غلط: 'صمت' }
const PTS: Record<Mark, string> = { صمت: '٠', صح: '+٢٠', غلط: '−١٠' }

/**
 * تنقيط راس براس — الشاشة ٥. بطاقة كل لاعب زر يدوّر حالته: صمت ← صح ← غلط.
 * صح ذهبية ممتلئة، غلط بإطار مرجاني، صمت هو الابتدائي.
 */
export function Stage2Reveal({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const q = state.currentQuestion!
  const sel = state.s2Sel!
  const nameOf = (team: TeamId) => state.teams[team].players[sel[team]]?.name ?? ''

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`راس براس · جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      <div className="reveal-q center fade">{q.question}</div>
      <div className="reveal-a center">
        <span className="a-label">الإجابة</span>
        <span className="a-text">{q.answer}</span>
      </div>

      <div className="eyebrow center">اضغط بطاقة كل لاعب لتحديد حالته</div>

      <div className="mark-cards grow">
        {[0, 1].map((ti) => {
          const team = ti as TeamId
          const mark = state.s2Marks[team]
          return (
            <button
              key={ti}
              className={'mcard ' + mark}
              onClick={() => dispatch({ t: 'S2_SET_MARK', who: team, mark: CYCLE[mark] })}
            >
              <span className="mc-name">{nameOf(team)}</span>
              <span className="mc-state">{mark}</span>
              <span className="mc-pts">{PTS[mark]}</span>
            </button>
          )
        })}
      </div>

      <button className="action" onClick={() => dispatch({ t: 'S2_NEXT_ROUND' })}>
        الجولة التالية
      </button>

      <style>{`
        .reveal-q { font-size:clamp(15px,2vw,20px); font-weight:600; }
        .reveal-a { display:flex; flex-direction:column; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:clamp(16px,2.5vh,28px); }
        .a-label { color:var(--text-2); font-weight:700; font-size:15px; }
        .a-text { color:var(--gold); font-weight:800; font-size:clamp(26px,4.4vw,46px); line-height:1.3; text-align:center; }
        .mark-cards { display:flex; gap:16px; }
        .mcard { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; border-radius:var(--r-lg); cursor:pointer; font-family:inherit; transition:transform .08s ease; border:2px solid var(--border); background:var(--surface); color:var(--cream); }
        .mcard:active { transform:scale(.98); }
        .mcard.صح { background:var(--gold); color:var(--on-gold); border-color:var(--gold); }
        .mcard.غلط { background:transparent; border-color:var(--coral); color:var(--coral); }
        .mc-name { font-size:clamp(20px,3vw,32px); font-weight:800; }
        .mc-state { font-size:clamp(16px,2.2vw,22px); font-weight:700; }
        .mc-pts { font-size:clamp(20px,2.6vw,28px); font-weight:800; }
      `}</style>
    </div>
  )
}
