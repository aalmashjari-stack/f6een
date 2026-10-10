import type { GameState } from '../game/session'
import { STAGE1_CONSULT_MS, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionView } from '../components/QuestionView'
import { STAGE1_CHARADE_MS, isCharadesCategory } from '../game/charades'
import stage1QuestionCharadeCss from './Stage1Question.charade.css?inline'
import stage1QuestionCss from './Stage1Question.css?inline'

/**
 * سؤال الجولة الجماعية.
 *
 * **حُذفت مهلة الفريق الآخر (١٥ ثانية) وقيدُ الاختلاف معها** حين صار اللوح
 * مختاراً بثمانية عشر سؤالاً: الخليّة لصاحب الدور وحده، يصيب فيأخذ نقاطها أو
 * يخطئ فلا شيء لأحد. والمهلة الثانية في كل سؤال من ثمانية عشر كانت تضيف نحو
 * خمس دقائق انتظار إلى مرحلة تضاعف طولُها أصلاً.
 */
export function Stage1Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const q = state.currentQuestion!
  /* فئة «ولا كلمة»: الكلمة في هاتف الممثّل لا على هذه الشاشة — يبقى
     المؤقّتُ وحده كبيراً، ومدّتُه ستّون لا خمسٌ وأربعون (انظر `charades.ts`). */
  const charade = isCharadesCategory(q.category)
  const total = charade ? STAGE1_CHARADE_MS : STAGE1_CONSULT_MS

  // ينتهي الوقت فينتظر التطبيق بلا مؤقّت (الخطوة ٤ في القسم ٤): المتحدّث يجيب
  // شفهياً، والحكم يكشف حين يفرغ.
  const consultLeft = useCountdown(total, true, undefined, state.timerEndsAt)

  if (charade) {
    return (
      <div className="screen">
        <ScoreBar
          onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })}
          teams={state.teams}
          turnTeam={owner}
        />

        <div className="charade-acting">
          <span className="charade-acting-team">{state.teams[owner].name}</span>
          <span className="charade-acting-note">يمثّل — ولا كلمة!</span>
        </div>

        <div className="timer-stage grow">
          <Timer remainingMs={consultLeft} totalMs={total} size="lg" />
        </div>

        <div className="stack gap-s">
          <button className="action compact" onClick={() => dispatch({ t: 'S1_TO_REVEAL' })}>
            اكشف الكلمة
          </button>
          <div className="action-note">اضغط حين يقولها فريقه — أو حين ينتهي الوقت</div>
        </div>

        <style>{stage1QuestionCharadeCss}</style>
      </div>
    )
  }

  return (
    <div className="screen">
      {/* سطرُ السياق كلّه سقط من هذه الشاشة (٦ سبتمبر ٢٠٢٦، كما سقط من اللوح):
          عدّادُ «سؤال ن / ١٨» أخلى قرصَ الوسط للشعار؛ وعنوانُ «الجولة
          الجماعية»؛ وبطاقةُ «صاحب الدور: فلان» — نسخةٌ حرفيّةٌ من كِكر
          الكبسولة المضيئة في شريط النتيجة فوقها؛ ورقائقُ «سينما · صعب ·
          30 نقاط» — الفريقُ نادى بها الخليّةَ قبل ثوانٍ على اللوح، وتعود
          النقاطُ منطوقةً في شاشة الكشف («من أجاب؟ — 30 نقطة»).
          يبقى السؤالُ والمؤقّتُ وحدَهما. والمكانُ المحرَّر يبقى فارغاً:
          لا حجمَ كبر ولا خطَّ تمدّد. */}
      <ScoreBar
        onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })}
        teams={state.teams}
        turnTeam={owner}
      />

      <div className={'s1-question-body' + (q.image ? ' photo' : '')}>
        {/* في سؤال الصورة يتجاور السؤال والمؤقّت أفقياً حتى يبقى الوجه كبيراً
            من غير أن يهبط المؤقّت فوق زر الحكم. سؤال النص يحتفظ بترتيبه الرأسي. */}
        <div className={'q-box s1q' + (q.image ? ' s1q-photo' : '')}>
          <QuestionView q={q} />
        </div>

        <div className={'timer-stage' + (q.image ? '' : ' grow')}>
          <Timer remainingMs={consultLeft} totalMs={total} size={q.image ? 'md' : 'lg'} />
        </div>
      </div>

      {/* زرّ واحد يسمّي الخطوة التالية (القسم ١٠): الحكم يكشف بعد أن تُقال
          الإجابة شفهياً — انتهاء المؤقّت لا يكشف شيئاً بنفسه.
          ولا يسمّي الزرُّ فريقاً بعد اليوم (٥ سبتمبر ٢٠٢٦): «من أجاب؟» سؤالُ
          الشاشة التالية، فتسميةُ صاحب الدور هنا تُجيب عنه قبل أن يُطرح. */}
      <div className="stack gap-s">
        <button className="action compact" onClick={() => dispatch({ t: 'S1_TO_REVEAL' })}>
          اكشف الإجابة
        </button>
        <div className="action-note">اضغط بعد أن يجيب أحد الفريقين</div>
      </div>

      <style>{stage1QuestionCss}</style>
    </div>
  )
}
