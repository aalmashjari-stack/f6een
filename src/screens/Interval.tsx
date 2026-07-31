import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'

const NEXT: Record<string, { title: string; rule: string }> = {
  'stage2-selection': {
    title: 'راس براس',
    rule: 'قاعدة الصمت: لا تشاور، الزملاء لا يتدخّلون. الصمت مجاني، والتخمين الخاطئ يخصم 10.',
  },
  'stage3-play': {
    title: 'الحق ما تلحق',
    rule: 'الساعة لا تتوقف — 30 ثانية لكل فريق. كل ضغطة تكلّف وقتاً. 5 نقاط لكل إجابة، والتمرير غير محدود.',
  },
}

export function Interval({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const info = NEXT[state.intervalNext] ?? { title: 'المرحلة التالية', rule: '' }
  return (
    <div className="screen center-col">
      <ScoreBar teams={state.teams} />
      <div className="grow center-all">
        <div className="interval-card">
          <div className="il-eyebrow">المرحلة القادمة</div>
          <div className="il-title">{info.title}</div>
          <div className="il-rule">{info.rule}</div>
        </div>
      </div>
      <button className="action" onClick={() => dispatch({ t: 'INTERVAL_CONTINUE' })}>
        ابدأ
      </button>
      <style>{`
        .center-col { display:flex; flex-direction:column; }
        .interval-card { max-width:760px; text-align:center; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:clamp(28px,6vh,60px); display:flex; flex-direction:column; gap:16px; }
        .il-eyebrow { color:var(--text-2); font-weight:700; font-size:clamp(14px,1.8vw,18px); }
        .il-title { color:var(--gold); font-weight:800; font-size:clamp(38px,7vw,72px); line-height:1.1; }
        .il-rule { color:var(--cream); font-size:clamp(17px,2.4vw,24px); line-height:1.7; font-weight:600; }
      `}</style>
    </div>
  )
}
