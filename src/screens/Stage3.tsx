import type { GameState } from '../game/session'
import { STAGE3_POINTS, STAGE3_TIMER_MS } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionView } from '../components/QuestionView'
import { AnswerFace } from '../components/AnswerFace'
import { FitAnswer } from '../components/FitAnswer'
import stage3Css from './Stage3.css?inline'

/**
 * الحق ما تلحق — الشاشة ٦. المؤقت مرجاني (العداء مع الوقت).
 * الساعة لا تتوقف أبداً؛ الكشف والحكم يُحسبان منها. الكشف بضغطة الحكم قبل الحكم (القرار ٧).
 * زرّان: ✓ +٥ · ✗ — كلاهما يحرق السؤال ويتقدّم.
 */
export function Stage3({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  // مفتاح الدور يجبر إعادة تركيب الساعة عند تبدّل الفريق
  return <Stage3Turn key={state.s3Team} state={state} dispatch={dispatch} />
}

function Stage3Turn({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  /* البدء حالةٌ في الجلسة لا في الشاشة: الموعد محفوظ، فإعادة التحميل تكمل
     العدّ ولا تعيده. */
  const started = state.timerEndsAt !== null
  const team = state.teams[state.s3Team]
  const q = state.s3Queue[state.s3Pos]
  const left = useCountdown(
    STAGE3_TIMER_MS,
    started,
    () => dispatch({ t: 'S3_END_TURN', team: state.s3Team }),
    state.timerEndsAt,
  )

  if (!started) {
    return (
      <div className="screen center-col">
        <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} />
        <div className="grow center-all">
          {/* رقم الفريق على البطاقة — لتلبس لونَه كما تفعل بقيّة الشاشات،
              فالهويّة اللونيّة لا تنقطع في المرحلة الحاسمة. */}
          <div className={'s3-ready team-' + state.s3Team}>
            <div className="s3r-eyebrow">الحق ما تلحق</div>
            <div className="s3r-team">دور {team.name}</div>
            <div className="s3-ready-rules">
              <span>
                <b className="tabular">{STAGE3_TIMER_MS / 1000}</b> ثانية دون توقف
              </span>
              <span>
                <b className="tabular">{`+${STAGE3_POINTS}`}</b> لكل إجابة صحيحة
              </span>
            </div>
          </div>
        </div>
        <button className="action coral" onClick={() => dispatch({ t: 'S3_START', at: Date.now() })}>
          ابدأ الآن
        </button>
        <Stage3Styles />
      </div>
    )
  }

  return (
    <div className="screen">
      {/* صاحبُ الدور يضيء كبسولتَه بدل أن يُكتب اسمه في قرص الوسط: القرصُ صار
          شعاراً (٦ سبتمبر ٢٠٢٦)، والوسمُ كان يحمل «الحق ما تلحق · فلان» —
          وهو الموضعُ الوحيد الذي يقول لمن الساعةُ تجري في هذه الشاشة. */}
      <ScoreBar
        onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })}
        teams={state.teams}
        turnTeam={state.s3Team}
      />

      <Timer remainingMs={left} totalMs={STAGE3_TIMER_MS} coral />

      <div className="s3-q grow center-all">
        {q ? (
          <div className="s3-inner">
            <QuestionView q={q} />
            {state.s3Revealed && (
              <AnswerFace q={q}>
                <FitAnswer as="p" className="s3-answer" fitKey={q.answer}>
                  <span className="a-label">الإجابة:</span> {q.answer}
                </FitAnswer>
              </AnswerFace>
            )}
          </div>
        ) : (
          <p className="q-text fade">نفد الطابور</p>
        )}
      </div>

      {!state.s3Revealed ? (
        <button className="action compact" onClick={() => dispatch({ t: 'S3_REVEAL' })} disabled={!q}>
          اكشف الإجابة
        </button>
      ) : (
        /* حُذف زر «تمرير»: أثره وأثر ✗ واحد — يحرق السؤال ويتقدّم بلا نقطة.
           زر ثالث بلا نتيجة مختلفة يسرق وقتاً من ساعة لا تتوقف. */
        <div className="s3-verdicts">
          <button className="v correct" onClick={() => dispatch({ t: 'S3_JUDGE', verdict: 'correct' })}>
            ✓<span className="v-pts tabular">{`+${STAGE3_POINTS}`}</span>
          </button>
          <button className="v wrong" onClick={() => dispatch({ t: 'S3_JUDGE', verdict: 'wrong' })}>
            ✗
          </button>
        </div>
      )}

      <Stage3Styles />
    </div>
  )
}

/** أنماط المرحلة الثالثة — تُستخدم في فرعَي الشاشة (الاستعداد واللعب) معاً. */
function Stage3Styles() {
  return <style>{stage3Css}</style>
}
