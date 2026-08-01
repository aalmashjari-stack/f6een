import { useState } from 'react'
import type { GameState } from '../game/session'
import { STAGE3_TIMER_MS } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'

/**
 * الحق ما تلحق — الشاشة ٦. المؤقت مرجاني (العداء مع الوقت).
 * الساعة لا تتوقف أبداً؛ الكشف والحكم يُحسبان منها. الكشف بضغطة الحكم قبل الحكم (القرار ٧).
 * ✓ +٥ · تمرير · ✗ — الكل يحرق السؤال ويتقدّم.
 */
export function Stage3({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  // مفتاح الدور يجبر إعادة تركيب الساعة عند تبدّل الفريق
  return <Stage3Turn key={state.s3Team} state={state} dispatch={dispatch} />
}

function Stage3Turn({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [started, setStarted] = useState(false)
  const team = state.teams[state.s3Team]
  const q = state.s3Queue[state.s3Pos]
  const left = useCountdown(STAGE3_TIMER_MS, started, () => dispatch({ t: 'S3_END_TURN' }))

  if (!started) {
    return (
      <div className="screen center-col">
        <ScoreBar teams={state.teams} />
        <div className="grow center-all">
          <div className="s3-ready">
            <div className="s3r-eyebrow">الحق ما تلحق</div>
            <div className="s3r-team">دور {team.name}</div>
            <div className="s3r-note">30 ثانية · الساعة لا تتوقف بعد الضغط</div>
          </div>
        </div>
        <button className="action coral" onClick={() => setStarted(true)}>
          ابدأ الساعة
        </button>
        <Stage3Styles />
      </div>
    )
  }

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`الحق ما تلحق · ${team.name}`} />

      <Timer remainingMs={left} totalMs={STAGE3_TIMER_MS} coral />

      <div className="s3-q grow center-all">
        {q ? (
          <div className="s3-inner">
            <p className="q-text">{q.question}</p>
            {state.s3Revealed && (
              <p className="s3-answer">
                <span className="a-label">الإجابة:</span> {q.answer}
              </p>
            )}
          </div>
        ) : (
          <p className="q-text fade">نفد الطابور</p>
        )}
      </div>

      {!state.s3Revealed ? (
        <button className="action" onClick={() => dispatch({ t: 'S3_REVEAL' })} disabled={!q}>
          اكشف الإجابة
        </button>
      ) : (
        <div className="s3-verdicts">
          <button className="v correct" onClick={() => dispatch({ t: 'S3_JUDGE', verdict: 'correct' })}>
            ✓<span className="v-pts tabular">+5</span>
          </button>
          <button className="v wrong" onClick={() => dispatch({ t: 'S3_JUDGE', verdict: 'wrong' })}>
            ✗
          </button>
          <button className="v pass" onClick={() => dispatch({ t: 'S3_JUDGE', verdict: 'pass' })}>
            تمرير
          </button>
        </div>
      )}

      <Stage3Styles />
    </div>
  )
}

/** أنماط المرحلة الثالثة — تُستخدم في فرعَي الشاشة (الاستعداد واللعب) معاً. */
function Stage3Styles() {
  return (
    <style>{`
        .center-col { display:flex; flex-direction:column; }
        .s3-ready { text-align:center; display:flex; flex-direction:column; gap:12px; }
        .s3r-eyebrow { color:var(--coral); font-weight:800; font-size:clamp(16px,2.2vw,22px); }
        .s3r-team { color:var(--cream); font-weight:800; font-size:clamp(34px,6vw,64px); }
        .s3r-note { color:var(--text-2); font-size:clamp(15px,2vw,20px); }
        .s3-q {
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 60%);
          border:1px solid var(--border);
          border-radius:clamp(30px, 6vh, 64px);
          padding:clamp(22px,4vh,48px) clamp(28px,5vw,64px);
          box-shadow:var(--lift);
        }
        .s3-inner { display:flex; flex-direction:column; gap:20px; align-items:center; }
        /* أكبر من السؤال: الساعة لا تتوقف، والحكم يقرأ الإجابة في لمحة لا في قراءة. */
        .s3-answer { font-size:clamp(30px,5vw,54px); font-weight:800; color:var(--gold); text-align:center; line-height:1.25; }
        .s3-answer .a-label { color:var(--text-2); font-weight:700; font-size:.7em; }
        .s3-verdicts { display:flex; gap:14px; align-items:stretch; }
        .v { border:none; cursor:pointer; font-family:inherit; font-weight:800; border-radius:var(--r-lg); display:flex; align-items:center; justify-content:center; gap:10px; transition:transform .08s ease; }
        .v:active { transform:scale(.97); }
        .v.correct { flex:2; background:var(--gold); color:var(--on-gold); font-size:clamp(30px,5vw,52px); padding:clamp(20px,3.5vh,34px); }
        .v.correct .v-pts { font-size:.5em; }
        .v.wrong { flex:2; background:var(--coral); color:var(--on-coral); font-size:clamp(30px,5vw,52px); padding:clamp(20px,3.5vh,34px); }
        .v.pass { flex:1; background:transparent; border:2px solid var(--border); color:var(--text-2); font-size:clamp(16px,2vw,20px); opacity:.75; }
      `}</style>
  )
}
