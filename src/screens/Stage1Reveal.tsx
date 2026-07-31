import type { GameState } from '../game/session'
import { stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'

/**
 * كشف وتنقيط الجولة الجماعية — الشاشة ٣.
 * الإجابة أكبر عنصر، والسؤال ينكمش ويبقى. البطاقتان خياران متساويان (لا مؤشر دور).
 * ثلاثة أزرار دائماً (القرار ٥): صاحب الدور أصاب · الآخر أصاب · لا أحد أصاب.
 */
export function Stage1Reveal({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const rival = (1 - owner) as TeamId
  const q = state.currentQuestion!

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} />

      <div className="reveal-q center fade">{q.question}</div>
      <div className="reveal-a center">
        <span className="a-label">الإجابة</span>
        <span className="a-text">{q.answer}</span>
      </div>

      <div className="eyebrow center">من أصاب؟</div>

      <div className="pick-cards grow">
        <button className="pick owner" onClick={() => dispatch({ t: 'S1_SCORE', outcome: 'owner' })}>
          <span className="pk-role">صاحب الدور</span>
          <span className="pk-name">{state.teams[owner].name}</span>
          <span className="pk-pts">+١٠</span>
        </button>
        <button className="pick rival" onClick={() => dispatch({ t: 'S1_SCORE', outcome: 'rival' })}>
          <span className="pk-role">الفريق الآخر</span>
          <span className="pk-name">{state.teams[rival].name}</span>
          <span className="pk-pts">+١٠</span>
        </button>
      </div>

      <button className="action sub" onClick={() => dispatch({ t: 'S1_SCORE', outcome: 'none' })}>
        لا أحد أصاب
      </button>

      <style>{`
        .reveal-q { font-size:clamp(15px,2vw,20px); font-weight:600; }
        .reveal-a { display:flex; flex-direction:column; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:clamp(18px,3vh,32px); }
        .a-label { color:var(--text-2); font-weight:700; font-size:15px; }
        .a-text { color:var(--gold); font-weight:800; font-size:clamp(30px,5vw,52px); line-height:1.3; text-align:center; }
        .pick-cards { display:flex; gap:16px; }
        .pick { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; border-radius:var(--r-lg); cursor:pointer; font-family:inherit; border:2px solid var(--border); background:var(--surface); color:var(--cream); transition:transform .08s ease, border-color .15s; }
        .pick:active { transform:scale(.98); }
        .pick.owner { border-color:var(--gold); }
        .pick.rival { border-color:var(--cream); }
        .pk-role { font-size:15px; color:var(--text-2); font-weight:700; }
        .pk-name { font-size:clamp(22px,3.2vw,34px); font-weight:800; }
        .pk-pts { font-size:clamp(20px,2.6vw,28px); font-weight:800; color:var(--gold); }
      `}</style>
    </div>
  )
}
