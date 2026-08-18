import { useEffect, useRef } from 'react'
import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { CATEGORIES } from '../game/bank'
import { ScoreBar } from '../components/ScoreBar'
import { QuestionView } from '../components/QuestionView'
import { RoundBar } from '../components/RoundBar'

/**
 * فاصل التعادل — سؤال صعب واحد. يُعاد عند بقاء التعادل (لا أحد أصاب).
 */
export function Tiebreak({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const drawnRef = useRef(false)
  useEffect(() => {
    if (!state.currentQuestion && !drawnRef.current) {
      drawnRef.current = true
      const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
      dispatch({ t: 'TIEBREAK_SPIN', category: cat })
    }
    if (state.currentQuestion) drawnRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentQuestion])

  const q = state.currentQuestion
  if (!q) return <div className="screen center-all">…</div>

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label="فاصل التعادل" />
      <RoundBar title="سؤال حاسم" chips={[state.currentCategory, 'صعب']} />

      <div className="q-box grow center-all">
        <div className="s3-inner">
          <QuestionView q={q} />
          {state.s3Revealed && (
            <p className="s3-answer">
              <span className="a-label">الإجابة:</span> {q.answer}
            </p>
          )}
        </div>
      </div>

      {!state.s3Revealed ? (
        <button className="action compact" onClick={() => dispatch({ t: 'S3_REVEAL' })}>
          اكشف الإجابة
        </button>
      ) : (
        <div className="stack gap-s">
          <div className="tb-picks">
            {[0, 1].map((ti) => (
              <button key={ti} className="tb" onClick={() => dispatch({ t: 'TIEBREAK_PICK', team: ti as TeamId })}>
                أصاب {state.teams[ti].name}
              </button>
            ))}
          </div>
          <button className="action sub" onClick={() => dispatch({ t: 'TIEBREAK_PICK', team: 'none' })}>
            لا أحد أصاب — سؤال آخر
          </button>
        </div>
      )}

      <style>{`
        .s3-inner { display:flex; flex-direction:column; gap:20px; align-items:center; }
        .s3-answer { font-size:clamp(20px,3vw,32px); font-weight:800; color:var(--gold); text-align:center; }
        .s3-answer .a-label { color:var(--text-2); font-weight:700; font-size:.7em; }
        .tb-picks { display:flex; gap:14px; }
        .tb { flex:1; border:2px solid var(--gold); background:transparent; color:var(--cream); font-family:inherit; font-weight:800; font-size:clamp(20px,3vw,30px); padding:clamp(18px,3vh,28px); border-radius:var(--r-lg); cursor:pointer; }
        .tb:active { transform:scale(.98); }

        /* جوال أفقي: فجوة ٢٠ بين السؤال والإجابة وحشوة ١٨ في زرَّي الحسم
           تُخرج محتوى البطاقة من حدّها فيطفو السؤال فوق إطارها. */
        @media (max-height:480px) {
          .s3-inner { gap:clamp(6px,2vh,20px); }
          .s3-answer { font-size:clamp(16px, min(3vw,4.5vh), 32px); }
          .tb-picks { gap:8px; }
          .tb { padding:clamp(8px,3vh,28px); font-size:clamp(15px, min(3vw,5vh), 30px); }
        }
      `}</style>
    </div>
  )
}
