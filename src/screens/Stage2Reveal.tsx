import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { Mark, TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'

/**
 * تنقيط راس براس — الشاشة ٥.
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
    <div className="screen">
      <ScoreBar teams={state.teams} label={`راس براس · جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      <div className="reveal-q center fade">{q.question}</div>
      <div className="reveal-a">
        <span className="a-label">الإجابة</span>
        <span className="a-text">{q.answer}</span>
      </div>

      <div className="eyebrow center">
        من بادر بالإجابة أولاً هو وحده الذي يُنقَّط — والآخر يبقى بلا شيء
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
                      onClick={() =>
                        dispatch({ t: 'S2_SET_MARK', who: team, mark: on ? 'صمت' : m })
                      }
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

      <button className="action" onClick={() => dispatch({ t: 'S2_NEXT_ROUND' })}>
        الجولة التالية
      </button>

      <style>{`
        .mark-cards { display:flex; gap:16px; }
        .mcard {
          flex:1; min-width:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(8px,1.6vh,18px);
          padding:clamp(12px,2.2vh,26px);
          border-radius:var(--r-lg); border:2px solid var(--border); background:var(--surface);
          color:var(--cream);
          transition:border-color .18s ease, box-shadow .18s ease;
        }
        /* البطاقة تحمل أثر الاختيار ليُقرأ من آخر المجلس بلمحة، والمربع يحمل التفصيل */
        .mcard.صح { border-color:var(--gold); box-shadow:var(--glow-gold); }
        .mcard.غلط { border-color:var(--coral); box-shadow:var(--glow-coral); }

        .mc-team { font-size:clamp(13px,1.7vw,18px); font-weight:700; color:var(--text-2); }
        .mc-name { font-size:clamp(24px,3.6vw,44px); font-weight:800; line-height:1.15; text-align:center; overflow-wrap:anywhere; }

        .mc-choices { display:flex; gap:clamp(8px,1.2vw,14px); width:100%; }
        .choice {
          flex:1; min-width:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
          padding:clamp(10px,1.8vh,20px) 6px;
          border-radius:var(--r-md); border:2px solid var(--border);
          background:transparent; color:var(--text-2);
          font-family:inherit; cursor:pointer;
          transition:transform .08s ease, background .16s ease, color .16s ease, border-color .16s ease, opacity .16s ease;
        }
        .choice:active { transform:scale(.97); }
        .c-label { font-size:clamp(12px,1.5vw,18px); font-weight:700; }
        .c-pts { font-size:clamp(20px,2.8vw,34px); font-weight:800; }

        /* المختار يمتلئ، وغير المختار يخفت — الفرق لون كامل لا درجة أفتح بقليل */
        .choice.ok.on { background:var(--gold); border-color:var(--gold); color:var(--on-gold); }
        .choice.no.on { background:rgba(228,103,74,.16); border-color:var(--coral); color:var(--coral); }
        .mcard.صح .choice.no, .mcard.غلط .choice.ok { opacity:.4; }

        @media (max-width:560px) {
          .mark-cards { gap:10px; }
          .mcard { padding:10px 8px; }
        }
      `}</style>
    </div>
  )
}
