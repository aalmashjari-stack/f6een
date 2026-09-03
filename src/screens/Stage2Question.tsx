import type { GameState } from '../game/session'
import { STAGE2_TIMER_MS } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionView } from '../components/QuestionView'
import { RoundBar } from '../components/RoundBar'

export function Stage2Question({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const q = state.currentQuestion!
  const sel = state.s2Sel!
  const left = useCountdown(STAGE2_TIMER_MS, true, () => dispatch({ t: 'S2_TO_REVEAL' }))
  const nameOf = (team: TeamId) => state.teams[team].players[sel[team]]?.name ?? ''

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

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

      <RoundBar title="الديربي" chips={['متوسط', 'لا تشاور']} />

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

      <style>{`
        .s2-versus { display:flex; align-items:center; justify-content:center; gap:clamp(12px,3vw,32px); }
        .s2-versus .p {
          font-size:clamp(20px,3vw,32px); font-weight:800;
          display:flex; flex-direction:column; align-items:center;
          line-height:1.12; min-width:0;
        }
        .s2-versus .p b { font-weight:800; }
        .s2-versus .who {
          font-size:clamp(11px,min(1.5vw,1.9vh),16px);
          font-weight:700; font-style:normal; opacity:.82;
        }
        .s2-versus .vs { color:var(--coral); font-weight:800; font-size:clamp(16px,2vw,22px); }
        /* display:contents يحفظ تخطيط سؤال النص كما كان: البطاقة والمؤقّت
           ابنان مباشران للشاشة. في سؤال الصورة وحده يصير الغلاف صفّاً. */
        .s2-question-body { display:contents; }
        .s2-question-body.photo {
          display:flex; flex:1 1 0; min-height:0;
          align-items:stretch; justify-content:center;
          gap:clamp(22px,3vw,42px);
        }
        /* البطاقة تحتضن الصورة بدل أن تتمدّد على المسار كلّه. بـflex:1 1 0
           كانت تأخذ ١٠٠٨ بكسلاً لصورة عرضها ٤٤٠ — صندوقٌ أبيض ثلثاه فراغ،
           والمؤقّت منفيٌّ عند الحافة اليسرى في عمودٍ لا يخصّه. الآن يُقرأ
           الاثنان كتلةً واحدةً في وسط الشاشة. (الصور كلّها مربّعة — تحقّقتُ
           من الـ٢٢٣ — فلا تتمدّد البطاقة على صورةٍ عريضة، وmax-width يحرسها
           إن دخلت واحدة.) */
        body .screen .s2-question-body.photo .q-box { flex:0 1 auto; min-width:0; }
        body .screen .s2-question-body.photo .q-photo-wrap { width:auto; min-width:0; }

        .s2-question-body.photo .s2-timer-stage {
          flex:0 0 clamp(150px,19vw,230px);
          align-self:center;
          min-height:0;
          padding-block:0;
        }
        .s2-timer-stage {
          flex:none;
          min-height:clamp(132px,22vh,220px);
          display:grid;
          place-items:center;
          padding-block:clamp(12px,2.4vh,26px);
          scroll-margin-block:clamp(28px,5vh,56px);
        }
        .screen .s2-timer-stage .ring-timer {
          flex:none;
          margin:0;
          max-height:none;
        }
        /* شاشة قصيرة: العمود يطلب ٦٤٣ بكسلاً في ٦٠٠. كل عنصر يتنازل إلا مسار
           المؤقّت — flex:none وأرضية ١٣٢ — فتقع الأربعون الزائدة على ما تحته
           ويخرج الزرّ وسطرُه عن الشاشة. فليتنازل هو أيضاً. وصار هذا آمناً بعد
           أن أخذ رقمُ المؤقّت يقيس نفسه على بطاقته (fitText في Timer.tsx):
           تصغر البطاقة ويصغر معها فلا يخرج. وسؤال الصورة لا يمسّه هذا — قاعدته
           أخصّ (‎.s2-question-body.photo‎) فتغلبه. */
        /* الجوال الأفقي: الشاشة ٣٩٠ ممتلئة تماماً، ولا يبقى للسؤال إلا ١٥٤ —
           يأكل السطرُ السائل «من صاحب الصورة؟» أربعين منها، أكثر من نصف الوجه
           (٧٦). والوجه هو السؤال: إن لم يُعرَف لم يُجَب. السطر يصغر ولا يُحذف
           لأنه السؤال نفسه لا تلميحاً عليه — وهذا ضبطُ الجولة الجماعية نفسه
           (Stage1Question.tsx) لم يكن قد وصل الديربي. */
        @media (max-height:480px) {
          body .screen:has(.q-photo-wrap) .q-prompt {
            font-size:clamp(14px,4vh,18px);
            line-height:1.2;
          }
          body .screen:has(.q-photo-wrap) .s2-question-body.photo .q-box { padding-block:4px; }
          body .screen:has(.q-photo-wrap) .q-photo-wrap { gap:3px; }
        }

        @media (max-height:700px) {
          .s2-timer-stage {
            flex:0 1 auto;
            min-height:0;
            padding-block:clamp(4px,1vh,12px);
          }
          .screen .s2-timer-stage .ring-timer { flex:0 1 auto; max-height:100%; }
        }
      `}</style>
    </div>
  )
}
