import { useState } from 'react'
import type { GameState } from '../game/session'
import { STAGE1_CONSULT_MS, STAGE1_QUESTIONS, STAGE1_RIVAL_MS, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionText } from '../components/QuestionText'

type Step = 'consult' | 'rival'

export function Stage1Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [step, setStep] = useState<Step>('consult')
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const rival = (1 - owner) as TeamId
  const ownerTeam = state.teams[owner]
  const rivalTeam = state.teams[rival]
  const q = state.currentQuestion!

  const consultLeft = useCountdown(STAGE1_CONSULT_MS, step === 'consult')
  // الكشف تلقائي عند انتهاء الـ١٥ ث، وللحكم زر يكشف قبلها بلا انتظار.
  const rivalLeft = useCountdown(STAGE1_RIVAL_MS, step === 'rival', () => dispatch({ t: 'S1_TO_REVEAL' }))

  const inConsult = step === 'consult'

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`سؤال ${state.s1Index + 1} / ${STAGE1_QUESTIONS}`} />

      <div className="eyebrow center">
        الجولة الجماعية · {state.currentCategory} · {q.level}
      </div>

      {/* الفريقان ككبسولتين — صاحب الدور ذهبي ممتلئ، الآخر مفرّغ */}
      <div className="s1-teams">
        <div className="tpill owner">
          <span className="role">صاحب الدور</span>
          <span className="tname">{ownerTeam.name}</span>
        </div>
        <div className={'tpill rival' + (step === 'rival' ? ' active' : '')}>
          <span className="role">الفريق الآخر</span>
          <span className="tname">{rivalTeam.name}</span>
        </div>
      </div>

      <div className="q-box">
        <QuestionText>{q.question}</QuestionText>
      </div>

      {/* الحلقة كبيرة في منتصف المساحة الحرّة */}
      <div className="timer-stage grow">
        <Timer
          remainingMs={inConsult ? consultLeft : rivalLeft}
          totalMs={inConsult ? STAGE1_CONSULT_MS : STAGE1_RIVAL_MS}
          size="lg"
        />
        {!inConsult && (
          <div className="rival-hint">مهلة {rivalTeam.name} — بلا تكرار إجابة {ownerTeam.name}</div>
        )}
      </div>

      {inConsult ? (
        <div className="stack gap-s">
          <button className="action" onClick={() => setStep('rival')}>
            انتهى التشاور — إجابة {ownerTeam.name}
          </button>
          <div className="action-note">اترك الوقت ينتهي أو اضغط بعد أن يجيب صاحب الدور</div>
        </div>
      ) : (
        <div className="stack gap-s">
          <button className="action" onClick={() => dispatch({ t: 'S1_TO_REVEAL' })}>
            اكشف الإجابة
          </button>
          <div className="action-note">أو اتركها تُكشف تلقائياً عند انتهاء الوقت</div>
        </div>
      )}

      <style>{`
        .s1-teams { display:flex; gap:14px; flex:none; }
        .tpill {
          flex:1; display:flex; align-items:center; justify-content:center; gap:12px;
          padding:12px 24px; border-radius:999px;
          transition:border-color .3s ease, box-shadow .3s ease, color .3s ease;
        }
        .tpill .role { font-size:13px; font-weight:700; opacity:.75; }
        .tpill .tname { font-size:clamp(17px,2.3vw,25px); font-weight:800; }
        .tpill.owner {
          background:linear-gradient(150deg, #FFCE7B, var(--gold) 60%, #F0A93F);
          color:var(--on-gold); box-shadow:var(--glow-gold);
        }
        .tpill.rival { border:2px solid var(--border); color:var(--text-2); }
        .tpill.rival.active { border-color:var(--coral); color:var(--cream); box-shadow:var(--glow-coral); }

        .timer-stage {
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
          min-height:0;
        }
        /* أرضية للمؤقّت على الجوال الأفقي: بلا هذا ينكمش مكانه إلى ٢٠ بكسل
           فيفيض الرقم فوق بطاقة السؤال والزر — انظر تعليق الحلقة في Timer.tsx. */
        @media (max-height:480px) {
          .timer-stage { min-height:clamp(46px, 17vh, 120px); gap:6px; }
          .rival-hint { font-size:clamp(12px,1.6vw,19px); padding:5px 16px; }
          /* كبسولتا الفريقين والسطر التفسيري يتنازلان لصالح السؤال والمؤقّت:
             هما معرّفان بالمكان (يمين/يسار) لا بالحجم، فتصغيرهما لا يُفقد شيئاً. */
          .s1-teams { gap:8px; }
          .tpill { padding:5px 16px; gap:8px; }
          .tpill .role { font-size:11px; line-height:1.3; }
          .tpill .tname { line-height:1.3; }
        }
        .rival-hint {
          flex:none;
          text-align:center; color:var(--cream); font-weight:700;
          font-size:clamp(14px,1.8vw,19px);
          padding:9px 22px; border-radius:999px;
          border:2px solid var(--coral);
        }
      `}</style>
    </div>
  )
}
