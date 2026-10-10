import type { GameState } from '../game/session'
import { STAGE2_TIMER_MS } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionView } from '../components/QuestionView'
import stage2QuestionCss from './Stage2Question.css?inline'

export function Stage2Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const q = state.currentQuestion!
  const sel = state.s2Sel!
  const left = useCountdown(STAGE2_TIMER_MS, true, () => dispatch({ t: 'S2_TO_REVEAL' }), state.timerEndsAt)
  const nameOf = (team: TeamId) => state.teams[team].players[sel[team]]?.name ?? ''

  return (
    <div className="screen">
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} />

      {/* اسم الفريق فوق اسم المتبارز — كما في شاشة الكشف تماماً. بدونه يقرأ
          المجلس «لاعب ٢ ضد لاعب ٢» ولا يعرف من يمثّل من: الاسم الافتراضي
          مبنيّ على ترتيب اللاعب داخل فريقه، فمتبارزان في نفس الترتيب يحملان
          نفس الاسم. ويقع الالتباس نفسه بأسماء حقيقية متشابهة. */}
      <div className="s2-versus">
        <span className="p right">
          <i className="who">{state.teams[0].name}</i>
          <b>{nameOf(0)}</b>
        </span>
        <span className="vs">ضد</span>
        <span className="p left">
          <i className="who">{state.teams[1].name}</i>
          <b>{nameOf(1)}</b>
        </span>
      </div>

      {/* سطرُ الجولة سقط (قرار علي ٦ سبتمبر ٢٠٢٦، كما سقط من الجولة الجماعية):
          «الديربي» يقوله بطاقةُ اللاعبَين فوقه — اسمان وجهاً لوجه لا يقعان في
          مرحلةٍ أخرى — و«متوسط» مستوىً لا يغيّر شيئاً في يد الحكم.
          وذهبت معهما رقاقةُ «لا تشاور»، وهي القاعدةُ الوحيدة التي كانت مكتوبةً
          على شاشة الديربي. */}

      {/* في سؤال الصورة يتجاور السؤال والمؤقّت أفقياً كما في الجولة الجماعية:
          الوجه هو السؤال، ومسار المؤقّت تحته كان يأكل مئة وستين بكسلاً فتُقصّ
          الصورة والزرّ خارج الشاشة. سؤال النص يحتفظ بترتيبه الرأسي. */}
      <div className={'s2-question-body' + (q.image ? ' photo' : '')}>
        <div className="q-box grow center-all">
          <QuestionView q={q} />
        </div>

        {/* مؤقّت الديربي داخل مسار مستقل: لا يشارك بطاقة السؤال ارتفاعها ولا
            يُترك كعنصر حرّ بين أقسام الصفحة القابلة للتمرير. */}
        <div className="s2-timer-stage">
          <Timer remainingMs={left} totalMs={STAGE2_TIMER_MS} />
        </div>
      </div>

      <div className="stack gap-s">
        <button className="action compact" onClick={() => dispatch({ t: 'S2_TO_REVEAL' })}>
          كشف الإجابة
        </button>
        <div className="action-note">يُكشف تلقائياً عند انتهاء الوقت</div>
      </div>

      <style>{stage2QuestionCss}</style>
    </div>
  )
}
