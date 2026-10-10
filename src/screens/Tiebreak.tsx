import { useEffect, useRef } from 'react'
import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { displayName } from '../game/bank'
import { ScoreBar } from '../components/ScoreBar'
import { QuestionView } from '../components/QuestionView'
import { RoundBar } from '../components/RoundBar'
import { AnswerFace } from '../components/AnswerFace'
import { FitAnswer } from '../components/FitAnswer'
import tiebreakCss from './Tiebreak.css?inline'

/**
 * فاصل التعادل — سؤال واحد يُسحب كسؤال الديربي (سهل أو متوسط من فئاته).
 * يُعاد عند بقاء التعادل (لا أحد أصاب).
 */
export function Tiebreak({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const drawnRef = useRef(false)
  useEffect(() => {
    if (!state.currentQuestion && !drawnRef.current) {
      drawnRef.current = true
      dispatch({ t: 'TIEBREAK_SPIN' })
    }
    if (state.currentQuestion) drawnRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentQuestion])

  const q = state.currentQuestion
  if (!q) return <div className="screen center-all">…</div>

  return (
    <div className="screen">
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} />
      <RoundBar
        title="سؤال حاسم"
        chips={[state.currentCategory && displayName(state.currentCategory), q.level]}
      />

      <div className="q-box grow center-all">
        <div className="s3-inner">
          <QuestionView q={q} />
          {/* كبقيّة الكشوف: الوجه إن كان للجواب صورة، والنصّ يُقاس — مخزون
              الديربي فيه «مشاهير» بصورة الجواب وأمثالٌ طويلة. */}
          {state.s3Revealed && (
            <AnswerFace q={q}>
              <FitAnswer as="p" className="s3-answer" fitKey={q.answer}>
                <span className="a-label">الإجابة:</span> {q.answer}
              </FitAnswer>
            </AnswerFace>
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
              <button
                key={ti}
                className="tb"
                onClick={() => dispatch({ t: 'TIEBREAK_PICK', team: ti as TeamId })}
              >
                أصاب {state.teams[ti].name}
              </button>
            ))}
          </div>
          <button className="action sub" onClick={() => dispatch({ t: 'TIEBREAK_PICK', team: 'none' })}>
            لا أحد أصاب — سؤال آخر
          </button>
        </div>
      )}

      <style>{tiebreakCss}</style>
    </div>
  )
}
