import type { GameState } from '../game/session'
import type { TeamId } from '../game/types'
import { stage1Owner, STAGE1_LEVEL_POINTS } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { questionSizeSuffix } from '../components/QuestionText'
import { FitAnswer } from '../components/FitAnswer'
import { celebSrc } from '../game/celebs'

/**
 * كشف وتنقيط الجولة الجماعية — الشاشة ٣.
 *
 * ثلاثة قيود من SPEC (القسم ١٠) تحكم هذه الشاشة:
 * الإجابة أكبر عنصر · السؤال ينكمش ويبهت لكنه يبقى · البطاقتان **متساويتان في
 * البروز** لأنهما خياران لا مؤشر دور · و«لا أحد أصاب» خيار ثالث أصغر.
 *
 * السؤال والإجابة في بطاقة واحدة لا بطاقتين: هما جملة واحدة يقرؤها المجلس
 * دفعةً واحدة، وفصلهما كان يترك السؤالَ سطراً يتيماً فوق صندوق نصفه فارغ.
 *
 * وتحت كل خيار نتيجةُ صاحب الدور قبل الضغطة وبعدها (٥٠ ← ٨٠): الانتقال يقول
 * للحكم أثرَ ضغطته قبل أن يضغط — وهو ما يتردّد فيه فعلاً حين يصيح المجلس.
 *
 * **صارت حكماً على صاحب الدور وحده** بعد إلغاء قيد الاختلاف: الخليّة له،
 * فالخياران «أصاب» و«أخطأ» لا ثلاثةُ نتائج بين فريقين. ولغةُ اللونين هي لغة
 * تنقيط الديربي نفسها (القسم ١٠): الصح ذهبيّ ممتلئ، والغلط بإطار مرجاني.
 */
export function Stage1Reveal({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const q = state.currentQuestion!
  const points = STAGE1_LEVEL_POINTS[q.level]

  /* الخياران اسما الفريقين لا «أصاب/أخطأ» (قرار علي ٥ سبتمبر ٢٠٢٦): النقاط
     لمن أجاب أيّاً كان، فالخليّة لم تعد لصاحب الدور وحده. وتحت كل اسم نتيجةُ
     فريقه قبل الضغطة وبعدها. */
  const picks = state.teams.map((t, i) => ({
    team: i as TeamId,
    label: t.name,
    from: t.score,
    to: t.score + points,
  }))

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} turnTeam={owner} />

      <div className="rv-card">
        {q.image ? (
          <img className="rv-photo" src={celebSrc(q.image)} alt="" />
        ) : (
          <div className={'rv-q' + questionSizeSuffix(q.question)}>{q.question}</div>
        )}
        <span className="rv-rule" aria-hidden="true" />
        <FitAnswer className="rv-a">{q.answer}</FitAnswer>
      </div>

      {/* حُذف شريط «قرار الحكم» في ٢٥ أغسطس ٢٠٢٦ بقرار علي: «مسوية زحمة
          عالفاضي». وهو كذلك — «من أصاب؟» فوقه يوجّه السؤال إلى الحكم،
          والبطاقتان تحته هما القرار نفسه. */}
      {/* «نقطة» لا «نقاط» مع العشرين والثلاثين (تصحيح علي)، و«نقاط» مع العشر:
          العربية تجمع من ثلاثة إلى عشرة وتُفرد بعدها. */}
      <div className="eyebrow center rv-ask">
        من أجاب؟ — {points} {points > 10 ? 'نقطة' : 'نقاط'}
      </div>

      <div className="pick-cards grow">
        {picks.map(({ team, label, from, to }) => (
          <button
            key={team}
            className={'pick pick-team team-' + team}
            onClick={() => dispatch({ t: 'S1_SCORE', team })}
          >
            <span className="pk-name">{label}</span>
            <span className="pk-delta">
              <span className="pk-from tabular">{from}</span>
              <span className="pk-arrow" aria-hidden="true">←</span>
              <span className="pk-to tabular">{to}</span>
            </span>
          </button>
        ))}
      </div>

      {/* «لا أحد أجاب» لا «أصاب» (تصحيح علي): السؤال «من أجاب؟» فيكون بابُ
          الخروج من جنسه. عاد بعد أن ذهب في ٣ سبتمبر: بالخيارين السابقين كان «أخطأ» يكفي، وبثلاثة
          نتائج لا بدّ من بابٍ لِمن لم يُصب أحدٌ عنده. وهو أصغر لأنّه الأندر. */}
      <button className="pick-none" onClick={() => dispatch({ t: 'S1_SCORE', team: null })}>
        لا أحد أجاب
      </button>

      <style>{`
        /* ===== بطاقة الكشف: السؤال والإجابة معاً ===== */
        .rv-card {
          /* تنكمش مع الشاشة بدل أن تصمد بمقاس محتواها: في سؤال الصورة كانت
             الصورةُ داخلها تدفع بطاقتَي «من أصاب؟» خارج الشاشة. */
          position:relative; overflow:hidden; flex:0 1 auto; min-height:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(8px,1.6vh,16px);
          padding:clamp(14px,3.2vh,36px) clamp(24px,5vw,64px);
          border-radius:clamp(24px, 5vh, 52px);
          border:1px solid var(--gold);
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 60%);
          box-shadow:var(--lift), var(--glow-gold);
          animation:pop-in .45s var(--ease-spring) both, rv-glow 1.1s ease-out both;
        }
        /* السؤال باهت ومنكمش لكنه حاضر — المجلس ينسى ما سُئل لحظةَ ظهور الإجابة.
           درجتا الهبوط الإضافيتان (.long/.xlong) نفس عتبات QuestionText.tsx:
           سؤال «من أنا؟» الطويل يفيض على هذه البطاقة الأصغر بالمقاس الثابت
           نفسه الذي كان يفيض به على بطاقة السؤال الحيّ قبل أن تُبنى تلك. */
        .rv-q {
          color:var(--text-2); font-weight:600; text-align:center;
          font-size:clamp(14px, min(2vw, 2.8vh), 22px); line-height:1.4;
        }
        .rv-q.long  { font-size:clamp(12px, min(1.7vw, 2.4vh), 18px); }
        .rv-q.xlong { font-size:clamp(11px, min(1.5vw, 2.1vh), 15px); line-height:1.35; }
        .rv-rule { width:clamp(40px,6vw,72px); height:1px; background:rgba(255,189,89,.32); }
        .rv-a {
          color:var(--gold); font-weight:800; text-align:center;
          font-size:clamp(28px, min(5.6vw, 9vh), 60px); line-height:1.2;
          overflow-wrap:anywhere;
          animation:pop-in .5s var(--ease-spring) .1s both;
        }
        /* ذروة السؤال: توهّج يشتدّ ثم يهدأ، ولمعة ذهبية تمرّ مرة واحدة */
        @keyframes rv-glow {
          0%   { box-shadow:var(--lift), 0 0 0 rgba(255,189,89,0); }
          35%  { box-shadow:var(--lift), 0 0 90px rgba(255,189,89,.6); }
          100% { box-shadow:var(--lift), var(--glow-gold); }
        }
        .rv-card::after {
          content:''; position:absolute; top:0; bottom:0; width:40%;
          background:linear-gradient(100deg, transparent, rgba(255,189,89,.28), transparent);
          transform:skewX(-18deg); pointer-events:none;
          animation:rv-sweep 1s ease-out .12s both;
        }
        @keyframes rv-sweep {
          from { inset-inline-start:-50%; }
          to   { inset-inline-start:120%; }
        }

        /* «من أجاب؟» سؤالٌ موجَّه إلى الحكم لا لافتةُ سياق، فيخرج من هيئة
           eyebrow الصغيرة الخافتة: يكبر ويشتدّ لونه وينزل عن بطاقة الإجابة
           مسافةً تفصله عنها (ملاحظتا علي ٥ سبتمبر ٢٠٢٦). */
        .rv-ask {
          margin-block-start:clamp(18px,4.5vh,46px);
          font-size:clamp(17px,2.6vw,28px);
          font-weight:900;
          letter-spacing:0;
          color:var(--cream);
        }

        /* ===== البطاقتان ===== */
        /* أرضية ارتفاع: على شاشة عريضة قصيرة كان الصفّ ينكمش إلى صفر فتخرج
           البطاقتان من مكانهما وتركبان على «من أصاب؟». */
        .pick-cards {
          /* center بعد أن ذهب زرّ «لا أحد أصاب» من تحت الصفّ (٣ سبتمبر ٢٠٢٦):
             الصفّ يرث ارتفاعه فتُترك البطاقتان معلّقتين في أعلاه وتحتهما فراغ
             ميّت. والحلقة التي فرضت stretch سابقاً لا تعود: سببها كان ارتفاعاً
             مئوياً على .pick، وسقفُها اليوم بـvh لا بنسبة. */
          display:flex; gap:clamp(12px,3vw,40px); align-items:center; justify-content:center;
          flex:1 1 auto; min-height:clamp(78px, 20vh, 220px);
        }
        /* البطاقتان حكمان لا فريقان، فتلبسان لغة تنقيط الديربي: الصحّ ذهبيّ
           ممتلئ والغلط بإطار مرجانيّ. وتساوي البروز الذي فرضه SPEC كان لأنهما
           كانتا فريقين — والفريق لا يُلوَّن قبل الحكم، أمّا الحكم فيُلوَّن. */
        .pick {
          position:relative; overflow:hidden; isolation:isolate;
          flex:1 1 0; min-height:0; max-width:min(38vw, 400px);
          /* سقف الارتفاع: بلا هذا تتمدّد البطاقة على كل ما تبقّى من الشاشة
             الطويلة (stretch يملأ الصفّ كاملاً)، فيسبح محتواها في فراغ
             ويضيع تجاورُها مع الاسم. */
          max-height:clamp(110px, 28vh, 240px);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(4px,1.2vh,12px);
          padding:clamp(10px,2.4vh,26px) clamp(12px,2vw,28px);
          border-radius:clamp(16px, 3vh, 28px);
          cursor:pointer; font-family:inherit;
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 68%);
          border:2px solid var(--cream);
          color:var(--cream);
          box-shadow:var(--lift);
          transition:transform .2s var(--ease-spring), box-shadow .25s ease;
          animation:pop-in .45s var(--ease-spring) both;
        }
        .pick:first-child { animation-delay:.05s; }
        .pick:last-child  { animation-delay:.12s; }
        /* بريق علوي خفيف — ضوء المسرح يسقط على أعلى البطاقة فلا تبدو ورقة مسطّحة */
        .pick::before {
          content:''; position:absolute; inset:0; z-index:-1; pointer-events:none;
          background:radial-gradient(120% 70% at 50% -12%, rgba(255,255,255,.13), transparent 62%);
        }
        .pick:active { transform:scale(.97); }
        .pick:focus-visible { outline:none; box-shadow:var(--lift), 0 0 0 4px rgba(255,189,89,.5); }
        @media (hover:hover) {
          .pick:hover { transform:translateY(-6px); box-shadow:0 26px 54px rgba(0,0,0,.4), 0 0 46px rgba(245,239,227,.22); }
        }

        /* كل مقاس يأخذ أصغر نصيبيه من العرض والارتفاع — علاج .q-text نفسه:
           بـ vw وحده يتضخّم الخط على شاشة عريضة قصيرة فيفيض على حدود البطاقة. */
        .pk-role {
          font-size:clamp(11px, min(1.4vw, 2.4vh), 15px); color:var(--text-2);
          font-weight:700; letter-spacing:.06em; line-height:1.3;
        }
        .pk-name {
          font-size:clamp(18px, min(3.4vw, 5.6vh), 40px); font-weight:800; line-height:1.15;
          text-align:center; max-width:100%; overflow-wrap:anywhere;
        }
        /* النتيجة قبل الضغطة وبعدها — الجديد وحده ذهبيّ */
        .pk-delta {
          display:flex; align-items:center; gap:clamp(5px,.8vw,10px);
          font-size:clamp(13px, min(2vw, 3.2vh), 24px); font-weight:800; line-height:1.2;
        }
        .pk-from  { color:var(--text-3); }
        .pk-arrow { color:var(--text-3); font-weight:600; }
        .pk-to    { color:var(--gold); }

        /* البطاقتان فريقان لا حكمان، فتتساويان في البروز (SPEC ١٠) وتأخذ كلٌّ
           لونَ فريقها كما في شريط النتيجة — فيربط الحكمُ الاسمَ بصاحبه بلمحة. */
        .pick-team.team-0 { border-color:var(--gold); }
        .pick-team.team-0 .pk-to { color:var(--gold); }
        .pick-team.team-1 { border-color:var(--cream); }
        .pick-team.team-1 .pk-to { color:var(--cream); }

        /* «لا أحد أجاب» دون البطاقتين في البروز — لأنّه الأندر — لكنّه قرارٌ
           يُضغط لا حاشية، فيكبر ويشتدّ حدُّه عمّا كان (ملاحظة علي). */
        .pick-none {
          align-self:center; margin-top:clamp(10px,2.2vh,22px);
          padding:clamp(9px,1.8vh,16px) clamp(26px,4.5vw,48px);
          border-radius:999px; cursor:pointer; font-family:inherit;
          font-size:clamp(14px,1.9vw,21px); font-weight:900;
          background:transparent; border:2.5px solid var(--text-2); color:var(--cream);
        }
        .pick-none:active { transform:scale(.97); }
        .pick-none:focus-visible { outline:none; border-color:var(--gold); color:var(--cream); }
        @media (hover:hover) { .pick-none:hover { border-color:var(--cream); color:var(--cream); } }


        /* أضيق الشاشات: الحشوة وحدها هي ما يمكن التنازل عنه داخل البطاقة.
           والأرضية الدنيا لصفّ البطاقتين تتنازل هي الأخرى أربعة بكسل — وهي
           بالضبط ما كان يفيض به أطول سؤال «من أنا؟» رغم انكماشه إلى xlong. */
        @media (max-height:360px) {
          /* أرضية ١١٠ في max-height الأصلي وُضعت لشاشة أطول؛ هنا هي القيد
             الفعلي الذي يمنع .pick من التقلّص فعلاً — align-items:stretch
             يملأ البطاقةَ حتى هذا السقف بصرف النظر عمّا وفّرته حشوةٌ أضيق. */
          .pick { padding:4px 10px; gap:1px; max-height:76px; }
          .rv-card { gap:2px; padding-block:5px; }
          .rv-q.xlong { font-size:10px; }
          /* flex-grow معطَّل هنا خصيصاً: عند التدفّق كان الصفّ يكبر إلى حجم
             ثابت أكبر ممّا تحتاجه بطاقتاه — يتّضح فقط حين يضيق كل شيء حوله
             ولا يبقى فائضٌ يمتصّه — فيدفع الزرّ تحته خارج الشاشة رغم أن كل
             عنصر آخر انكمش. بلا نموّ، الصفّ يأخذ ارتفاع بطاقتيه فعلاً لا أكثر. */
          .pick-cards { flex:0 1 auto; min-height:0; gap:8px; }
          .eyebrow { line-height:1.15; }
        }

        @media (prefers-reduced-motion:reduce) {
          .rv-card, .rv-card::after, .rv-a, .pick { animation:none; }
          .pick { transition:none; }
          .pick:hover { transform:none; }
        }
      `}</style>
    </div>
  )
}
