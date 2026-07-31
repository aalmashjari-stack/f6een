import { useState } from 'react'
import type { GameState } from '../game/session'
import { STAGE1_CONSULT_MS, STAGE1_QUESTIONS, STAGE1_RIVAL_MS, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'

type Phase = 'consult' | 'rival'

export function Stage1Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [phase, setPhase] = useState<Phase>('consult')
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const rival = (1 - owner) as TeamId
  const ownerTeam = state.teams[owner]
  const rivalTeam = state.teams[rival]
  const q = state.currentQuestion!

  const consultLeft = useCountdown(STAGE1_CONSULT_MS, phase === 'consult')
  const rivalLeft = useCountdown(STAGE1_RIVAL_MS, phase === 'rival', () => dispatch({ t: 'S1_TO_REVEAL' }))

  const inConsult = phase === 'consult'

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`سؤال ${state.s1Index + 1} / ${STAGE1_QUESTIONS}`} />

      <div className="eyebrow center">
        الجولة الجماعية · {state.currentCategory} · {q.level}
      </div>

      {/* بطاقتا الفريقين — صاحب الدور ذهبي ممتلئ، الآخر مفرّغ */}
      <div className="s1-teams">
        <div className="tcard owner">
          <span className="role">صاحب الدور</span>
          <span className="tname">{ownerTeam.name}</span>
        </div>
        <div className={'tcard rival' + (phase === 'rival' ? ' active' : '')}>
          <span className="role">الفريق الآخر</span>
          <span className="tname">{rivalTeam.name}</span>
        </div>
      </div>

      <div className="q-box grow center-all">
        <p className="q-text">{q.question}</p>
      </div>

      <Timer remainingMs={inConsult ? consultLeft : rivalLeft} totalMs={inConsult ? STAGE1_CONSULT_MS : STAGE1_RIVAL_MS} />

      {inConsult ? (
        <div className="stack gap-s">
          <button className="action" onClick={() => setPhase('rival')}>
            انتهى التشاور — إجابة {ownerTeam.name}
          </button>
          <div className="action-note">اترك الوقت ينتهي أو اضغط بعد أن يجيب صاحب الدور</div>
        </div>
      ) : (
        <div className="stack gap-s">
          <div className="waiting">مهلة {rivalTeam.name} — بلا تكرار إجابة {ownerTeam.name}</div>
          <div className="action-note">يُكشف الجواب تلقائياً عند انتهاء الوقت</div>
        </div>
      )}

      <style>{`
        .s1-teams { display:flex; gap:14px; }
        .tcard { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px; border-radius:var(--r-md); }
        .tcard .role { font-size:13px; font-weight:700; }
        .tcard .tname { font-size:clamp(18px,2.4vw,26px); font-weight:800; }
        .tcard.owner { background:var(--gold); color:var(--on-gold); }
        .tcard.owner .role { color:var(--on-gold); opacity:.8; }
        .tcard.rival { border:2px solid var(--border); color:var(--text-2); }
        .tcard.rival.active { border-color:var(--coral); color:var(--cream); }
        .q-box { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:clamp(20px,4vh,44px); }
        .q-text { font-size:clamp(24px,4.4vw,46px); font-weight:800; line-height:1.5; text-align:center; }
        .waiting { text-align:center; background:var(--surface); border:2px solid var(--coral); border-radius:var(--r-lg); padding:22px; font-size:clamp(17px,2.2vw,22px); font-weight:700; }
      `}</style>
    </div>
  )
}
