import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { Mark, TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { play } from '../audio/sfx'
import { questionSizeSuffix } from '../components/QuestionText'
import { FitAnswer } from '../components/FitAnswer'
import { celebSrc } from '../game/celebs'

/**
 * تنقيط الديربي — الشاشة ٥.
 *
 * لكل لاعب مربعان صريحان: «إجابة صحيحة +20» و«إجابة خاطئة −10».
 * الضغط على المربع المضيء نفسه يلغيه ويرجع اللاعب إلى الصمت (0) — وهو الحالة الابتدائية.
 * لاعب واحد على الأكثر يحمل علامة: تعليم أحدهما يُفرِّغ الآخر (القسم ٥).
 *
 * لماذا مربعان بدل بطاقة تدوّر حالتها: التدوير يخفي الخيارات خلف الضغطات
 * (صمت ← صح ← غلط)، فالحكم يضغط مرّتين ليصل إلى «غلط» وقد يتجاوزها فيلفّ من جديد.
 * الخياران ظاهران معاً = ضغطة واحدة، ولا حاجة لحفظ ترتيب الدورة.
 */

const PTS: Record<Exclude<Mark, 'صمت'>, string> = { صح: '+20', غلط: '−10' }
const LABEL: Record<Exclude<Mark, 'صمت'>, string> = {
  صح: 'إجابة صحيحة',
  غلط: 'إجابة خاطئة',
}

export function Stage2Reveal({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const q = state.currentQuestion!
  const sel = state.s2Sel!
  const nameOf = (team: TeamId) => state.teams[team].players[sel[team]]?.name ?? ''

  return (
    <div className="screen s2-reveal-screen">
      <ScoreBar teams={state.teams} label={`جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      {q.image ? (
        <img className="reveal-photo" src={celebSrc(q.image)} alt="" />
      ) : (
        <div className={'reveal-q center fade' + questionSizeSuffix(q.question)}>{q.question}</div>
      )}
      <div className="reveal-a">
        <span className="a-label">الإجابة</span>
        <FitAnswer as="span" className="a-text">{q.answer}</FitAnswer>
      </div>

      <div className="eyebrow center">
        من بادر بالإجابة أولاً هو وحده الذي يُنقَّط — والآخر يبقى بلا شيء. وفي حال لم يُجب أحد انتقل إلى الجولة التالية
      </div>

      <div className="mark-cards grow">
        {[0, 1].map((ti) => {
          const team = ti as TeamId
          const mark = state.s2Marks[team]
          return (
            <div key={ti} className={'mcard ' + mark}>
              <span className="mc-team">{state.teams[team].name}</span>
              <span className="mc-name">{nameOf(team)}</span>

              <div className="mc-choices">
                {(['صح', 'غلط'] as const).map((m) => {
                  const on = mark === m
                  return (
                    <button
                      key={m}
                      className={'choice ' + (m === 'صح' ? 'ok' : 'no') + (on ? ' on' : '')}
                      aria-pressed={on}
                      // الضغط على المضيء يُلغيه: التراجع بضغطة واحدة بلا دورة كاملة
                      onClick={() => {
                        // التراجع لا صوت له — الصوت إعلانُ نتيجة، وإلغاؤها ليس نتيجة
                        if (!on) play(m === 'صح' ? 'correct' : 'wrong')
                        dispatch({ t: 'S2_SET_MARK', who: team, mark: on ? 'صمت' : m })
                      }}
                    >
                      <span className="c-label">{LABEL[m]}</span>
                      <span className="c-pts tabular">{PTS[m]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <button className="action compact" onClick={() => dispatch({ t: 'S2_NEXT_ROUND' })}>
        الجولة التالية
      </button>

      <style>{`
        body .screen.s2-reveal-screen:not(.setup):not(.end) {
          padding-block:clamp(14px,2vh,24px);
          gap:clamp(12px,1.8vh,20px);
        }
        .s2-reveal-screen .reveal-a {
          align-self:center;
          width:min(94%,1120px);
          padding-block:clamp(12px,2vh,22px);
        }

        /* بطاقتا القرار تأخذان ارتفاعاً حقيقياً. استعمال grow وحده يجعل
           ارتفاع الحاوية صفراً عندما تزحم الشاشة، فتفيض البطاقتان خلف الزر. */
        .s2-reveal-screen .mark-cards {
          flex:none;
          min-height:clamp(205px,28vh,280px);
          display:flex;
          gap:clamp(20px,2.6vw,34px);
        }
        .s2-reveal-screen > .action {
          flex:none;
          margin-top:clamp(4px,.8vh,10px);
        }

        /* ارتفاع البطاقة هو ما يتبقّى من الشاشة، أما مقاسات ما فيها فكانت محسوبة
           على العرض وحده (vw) — فعلى شاشة عريضة قصيرة يتضخّم المحتوى ولا تكبر
           البطاقة، فيخرج المربعان من الحاشية ويلتصقان بالإطار. وعلى البطاقة
           المختارة يصير الذهبي على الذهبي كتلة واحدة فلا يُقرأ أين المربع.
           الحل: كل مقاس رأسيّ يأخذ أصغر القيمتين — نصيبه من العرض ونصيبه من
           الارتفاع (min(…vw, …vh)) — فيضمر مع الشاشة القصيرة قبل أن يفيض. */
        .mcard {
          flex:1; min-width:0; min-height:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(6px,1.2vh,14px);
          padding:clamp(10px,1.8vh,22px);
          border-radius:var(--r-lg); border:2px solid var(--border); background:var(--surface);
          color:var(--cream);
          transition:border-color .18s ease, box-shadow .18s ease;
        }
        /* البطاقة تحمل أثر الاختيار ليُقرأ من آخر المجلس بلمحة، والمربع يحمل التفصيل */
        .mcard.صح { border-color:var(--gold); box-shadow:var(--glow-gold); }
        .mcard.غلط { border-color:var(--coral); box-shadow:var(--glow-coral); }

        .mc-team { font-size:clamp(12px, min(1.7vw, 2.4vh), 18px); font-weight:700; color:var(--text-2); }
        .mc-name {
          font-size:clamp(22px, min(3.6vw, 4.6vh), 44px);
          font-weight:800; line-height:1.15; text-align:center; overflow-wrap:anywhere;
        }

        .mc-choices { display:flex; gap:clamp(8px,1.2vw,14px); width:100%; flex:none; }
        .choice {
          flex:1; min-width:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
          padding:clamp(8px, 1.5vh, 18px) 6px;
          border-radius:var(--r-md); border:2px solid var(--border);
          background:transparent; color:var(--text-2);
          font-family:inherit; cursor:pointer;
          transition:transform .08s ease, background .16s ease, color .16s ease, border-color .16s ease, opacity .16s ease;
        }
        .choice:active { transform:scale(.97); }
        .c-label { font-size:clamp(11px, min(1.5vw, 2vh), 18px); font-weight:700; line-height:1.35; }
        .c-pts { font-size:clamp(18px, min(2.8vw, 3.6vh), 34px); font-weight:800; line-height:1.15; }

        /* المختار يمتلئ، وغير المختار يخفت — الفرق لون كامل لا درجة أفتح بقليل */
        .choice.ok.on { background:var(--gold); border-color:var(--gold); color:var(--on-gold); }
        .choice.no.on { background:rgba(228,103,74,.16); border-color:var(--coral); color:var(--coral); }
        .mcard.صح .choice.no, .mcard.غلط .choice.ok { opacity:.4; }

        @media (max-width:560px) {
          .s2-reveal-screen .mark-cards { gap:14px; }
          .mcard { padding:10px 8px; }
        }

        /* الشاشة القصيرة كانت تدفع «الجولة التالية» خارجها: ٦٠٥ بكسلاً مطلوبة
           في ٦٠٠ على 1024×600، و٥١٠ في ٣٩٠ على الجوال الأفقي. الصلبُ فيها
           شيئان: أرضية بطاقتَي القرار (٢٠٥) وسطرُ قاعدة المبادرة. السطر يُقرأ
           مرّة واحدة في أول جولة ثم يعرفه المجلس، فيذهب كاملاً — حذفٌ لا
           تصغير — وتتنازل الأرضية معه. البطاقتان لا تنهاران: مقاسات ما فيهما
           محسوبة أصلاً بـmin(vw,vh) فتضمر قبل أن تفيض. */
        @media (max-height:700px) {
          .s2-reveal-screen .eyebrow { display:none; }
          .s2-reveal-screen .mark-cards { min-height:clamp(150px,26vh,205px); }
        }

        /* المقاسات أعلاه تضمر مع الارتفاع، أمّا أرضياتها (١٠ للبطاقة و٨ للمربع)
           فبقيت ثابتة — وهي وحدها ما يفيض على ٣٢٠ بكسل، فيطفو اسم الفريق فوق
           حاشية البطاقة. */
        @media (max-height:480px) {
          /* الجوال الأفقي: بعد أن ذهب سطرُ القاعدة وتنازلت أرضية البطاقتين
             بقي ٢٨ بكسلاً زائدة، مصدرها الحشوة (١٤×٢) والفجوات (١٢×٤).
             الفراغ أوّل ما يتنازل — قبل الحرف — فتنزل أرضيتاهما إلى سبعة. */
          body .screen.s2-reveal-screen:not(.setup):not(.end) {
            padding-block:clamp(4px,2vh,24px);
            gap:clamp(6px,1.8vh,20px);
          }
          .s2-reveal-screen .reveal-a {
            width:min(96%,960px);
            padding-block:clamp(4px,1.2vh,16px);
          }
          /* «الإجابة» عنوانٌ يُقرأ مرّة، والنصّ الكبير تحت السؤال لا يُشتبه
             فيه. يذهب هنا وحده ليتّسع لإجابةٍ طويلة («أبو عبيدة عامر بن عبد
             الله بن الجراح») والزرِّ تحتها — كانت تدفعه خارج الشاشة. */
          .s2-reveal-screen .a-label { display:none; }
          .s2-reveal-screen > .action { margin-top:0; }
          .s2-reveal-screen .mark-cards { min-height:clamp(96px,24vh,190px); }
          .mcard { padding:clamp(6px,1.8vh,22px); gap:clamp(3px,1.2vh,14px); }
          .choice { padding:clamp(4px,1.5vh,18px) 6px; }
        }
      `}</style>
    </div>
  )
}
