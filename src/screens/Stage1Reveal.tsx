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
      <div className="reveal-a">
        <span className="a-label">الإجابة</span>
        <span className="a-text">{q.answer}</span>
      </div>

      <div className="eyebrow center">من أصاب؟</div>

      <div className="pick-discs grow">
        <button className="disc owner" onClick={() => dispatch({ t: 'S1_SCORE', outcome: 'owner' })}>
          <span className="pk-role">صاحب الدور</span>
          <span className="pk-name">{state.teams[owner].name}</span>
          <span className="pk-pts tabular">+10</span>
        </button>
        <button className="disc rival" onClick={() => dispatch({ t: 'S1_SCORE', outcome: 'rival' })}>
          <span className="pk-role">الفريق الآخر</span>
          <span className="pk-name">{state.teams[rival].name}</span>
          <span className="pk-pts tabular">+10</span>
        </button>
      </div>

      <button className="action sub" onClick={() => dispatch({ t: 'S1_SCORE', outcome: 'none' })}>
        لا أحد أصاب
      </button>

      <style>{`
        .pick-discs { display:flex; gap:clamp(16px,4vw,48px); align-items:center; justify-content:center; min-height:0; }
        .disc {
          aspect-ratio:1;
          height:min(100%, 34vh, 300px);
          border-radius:50%;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
          padding:6%;
          cursor:pointer; font-family:inherit;
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 68%);
          border:3px solid var(--border);
          color:var(--cream);
          box-shadow:var(--lift);
          transition:transform .18s var(--ease-spring), box-shadow .25s ease;
          animation:pop-in .45s var(--ease-spring) both;
        }
        .disc:active { transform:scale(.96); }
        .disc.owner { border-color:var(--gold); box-shadow:var(--lift), var(--glow-gold); animation-delay:.05s; }
        .disc.rival { border-color:var(--cream); animation-delay:.12s; }
        .pk-role { font-size:clamp(12px,1.5vw,15px); color:var(--text-2); font-weight:700; }
        .pk-name { font-size:clamp(18px,2.8vw,32px); font-weight:800; line-height:1.25; text-align:center; }
        .pk-pts { font-size:clamp(18px,2.4vw,28px); font-weight:800; color:var(--gold); }
      `}</style>
    </div>
  )
}
