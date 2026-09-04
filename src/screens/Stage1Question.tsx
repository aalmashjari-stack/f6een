import type { GameState } from '../game/session'
import { STAGE1_CONSULT_MS, STAGE1_LEVEL_POINTS, STAGE1_QUESTIONS, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { Timer } from '../components/Timer'
import { useCountdown } from '../components/useCountdown'
import { QuestionView } from '../components/QuestionView'
import { RoundBar } from '../components/RoundBar'
import { displayName } from '../game/bank'

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
  const ownerTeam = state.teams[owner]
  const q = state.currentQuestion!
  const points = STAGE1_LEVEL_POINTS[q.level]

  // ينتهي الوقت فينتظر التطبيق بلا مؤقّت (الخطوة ٤ في القسم ٤): المتحدّث يجيب
  // شفهياً، والحكم يكشف حين يفرغ.
  const consultLeft = useCountdown(STAGE1_CONSULT_MS, true)

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} label={`سؤال ${state.s1Index + 1} / ${STAGE1_QUESTIONS}`} turnTeam={owner} />

      <RoundBar
        title="الجولة الجماعية"
        chips={[state.currentCategory && displayName(state.currentCategory), q.level, `${points} نقاط`]}
      />

      {/* صاحب الدور وحده — الخليّة له، ولا مهلة للفريق الآخر بعده */}
      <div className="s1-teams">
        <div className="tpill owner">
          <span className="role">صاحب الدور</span>
          <span className="tname">{ownerTeam.name}</span>
        </div>
      </div>

      <div className={'s1-question-body' + (q.image ? ' photo' : '')}>
        {/* في سؤال الصورة يتجاور السؤال والمؤقّت أفقياً حتى يبقى الوجه كبيراً
            من غير أن يهبط المؤقّت فوق زر الحكم. سؤال النص يحتفظ بترتيبه الرأسي. */}
        <div className={'q-box s1q' + (q.image ? ' s1q-photo' : '')}>
          <QuestionView q={q} />
        </div>

        <div className={'timer-stage' + (q.image ? '' : ' grow')}>
          <Timer remainingMs={consultLeft} totalMs={STAGE1_CONSULT_MS} size={q.image ? 'md' : 'lg'} />
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

      <style>{`
        /* بطاقة السؤال هنا وحدها لا تنمو مع المؤقّت (المؤقّت هو النامي في هذه
           الشاشة)، فبلا سقفٍ يزحمه السؤالُ الطويل حين يلتفّ سطرين. السقف يمنح
           QuestionText هدفاً رأسياً يهبط إليه، ويضمن للمؤقّت نصيبه ثابتاً مهما
           طال السؤال. overflow مخبأ حارسٌ أخير لو بلغ الخطُّ أرضيّته. */
        .q-box.s1q {
          display:flex; align-items:center; justify-content:center;
          /* flex:none حتى تحضن البطاقةُ محتواها ما دام دون السقف — بلا هذا
             يقلّصها العمودُ تحت مقاس السؤال القصير فيهبط خطُّه بلا داعٍ. */
          flex:none; min-height:0;
          /* سقفٌ يحدّ حصّة السؤال من الشاشة فيبقى للمؤقّت نصيبه مهما طال: السؤال
             القصير سطرٌ واحد دون السقف يبقى بمقاسه، والطويل يبلغ السقف فيهبط
             خطُّه (QuestionText) ليسعه بدل أن يزحم المؤقّت تحته. */
          max-height:clamp(110px, 24vh, 200px);
          padding-block:clamp(14px, 2.6vh, 28px);
          overflow:hidden;
        }
        @media (max-height:480px) {
          .q-box.s1q { max-height:clamp(84px, 34vh, 170px); padding-block:clamp(8px, 2vh, 18px); }
          body .screen:has(.s1q-photo) .rd,
          body .screen:has(.s1q-photo) .action-note { display:none; }
          body .screen:has(.s1q-photo) .q-box.s1q-photo { padding-block:4px; }
          body .screen:has(.s1q-photo) .q-photo-wrap { gap:3px; }
          body .screen:has(.s1q-photo) .q-prompt {
            font-size:clamp(14px,4vh,18px);
            line-height:1.2;
          }
        }
        /* سؤال الصورة يقلب الأولوية: البطاقة تنمو (الصورة هي البطل) بلا سقفٍ
           يخنقها، والمؤقّت يتراجع تحتها (بلا grow، ومقاسه md). */
        .q-box.s1q.s1q-photo {
          flex:1 1 0; max-height:none; padding-block:clamp(10px, 2vh, 20px);
        }

        /* display:contents يحفظ تخطيط سؤال النص القديم. في سؤال الصورة يتحول
           الغلاف إلى صف: البطاقة تأخذ المساحة المرنة والمؤقّت يحتفظ بعرضه. */
        .s1-question-body { display:contents; }
        .s1-question-body.photo {
          display:flex; flex:1 1 0; min-height:0;
          align-items:stretch; justify-content:center;
          gap:clamp(22px,3vw,42px);
        }
        /* القيمتان تُعادان في showtime.css بأولوية أعلى — وهناك شرحُ لماذا
           تحتضن البطاقةُ الصورةَ بدل أن تتمدّد. تبقيان هنا متطابقتين معها
           كي لا يضلّ من قرأ الملف وحده. */
        .s1-question-body.photo .q-box.s1q-photo {
          flex:0 1 auto; min-width:0; min-height:0;
        }
        .s1-question-body.photo .q-photo-wrap { height:100%; width:auto; min-width:0; }
        .s1-question-body.photo .timer-stage {
          flex:0 0 clamp(150px,19vw,230px);
          align-self:center;
          padding-block:0;
        }

        /* شاشة التلفاز القصيرة والعريضة (مثل ١٤٦١×٦٦٩): نقل المؤقّت إلى الجانب
           يحلّ نصف المشكلة، وهذا الضغط الخفيف يعيد المساحة المحرّرة إلى الوجه. */
        @media (max-height:800px) {
          body .screen:has(.s1q-photo) {
            padding-block:clamp(14px,2.2vh,24px);
            gap:clamp(10px,1.8vh,16px);
          }
          body .screen:has(.s1q-photo) .tpill { padding-block:7px; }
          body .screen:has(.s1q-photo) .q-box.s1q-photo { padding-block:8px; }
          body .screen:has(.s1q-photo) .q-photo-wrap { gap:6px; }
          body .screen:has(.s1q-photo) > .stack.gap-s { gap:6px; }
          body .screen:has(.s1q-photo) .action.compact { padding-block:8px; }
          body .screen:has(.s1q-photo) .action-note { line-height:1.25; }
        }

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

        .timer-stage {
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
          min-height:0;
        }
        /* أرضية للمؤقّت على الجوال الأفقي: بلا هذا ينكمش مكانه إلى ٢٠ بكسل
           فيفيض الرقم فوق بطاقة السؤال والزر — انظر تعليق الحلقة في Timer.tsx. */
        @media (max-height:480px) {
          .timer-stage { min-height:clamp(46px, 17vh, 120px); gap:6px; }
          /* المؤقّت لا يتنازل عن ارتفاعه لغيره: رقمه مقيسٌ على بطاقته، فإن
             سُحبت من تحته فاض الرقم عنها. */
          body .screen .timer-stage .ring-timer { flex:none; }
          /* كبسولتا الفريقين والسطر التفسيري يتنازلان لصالح السؤال والمؤقّت:
             هما معرّفان بالمكان (يمين/يسار) لا بالحجم، فتصغيرهما لا يُفقد شيئاً. */
          .s1-teams { gap:8px; }
          .tpill { padding:5px 16px; gap:8px; }
          .tpill .role { font-size:11px; line-height:1.3; }
          .tpill .tname { line-height:1.3; }
          .s1-question-body.photo { gap:clamp(12px,2vw,22px); }
          .s1-question-body.photo .timer-stage { flex-basis:120px; }
        }
      `}</style>
    </div>
  )
}
