import type { GameState } from '../game/session'
import { STAGE1_LEVELS, STAGE1_LEVEL_POINTS, STAGE1_QUESTIONS, cellKey, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { RoundBar } from '../components/RoundBar'
import { displayName } from '../game/bank'
import { categoryArt } from '../components/categoryArt'
import { play } from '../audio/sfx'

/**
 * لوح الجولة الجماعية — الشاشة التي حلّت محلّ العجلة في المرحلة الأولى.
 *
 * ستّ فئات اختارها الفريقان في الإعداد (ثلاث لكل فريق)، ولكل فئة مستوياتها
 * الثلاثة بنقاطها: ١٠ · ٢٠ · ٣٠. **الفريق يبلّغ الحكم أيّ خليّة يريد** والحكم
 * يضغطها — فالقرار للاعبين والضغطة للحكم، وهذا لا يكسر مبدأ «لا سلطة تقديرية
 * للحكم» في القسم ١: الحكم ينفّذ نداءً مسموعاً في المجلس لا يختار عنهم.
 *
 * والخليّة المستهلَكة تبقى ظاهرة باهتة لا تختفي — قاعدة العجلة نفسها
 * (القسم ٧): الشبكة التي تتقلّص بلا تفسير تفتح باب الاتهام بالتلاعب.
 *
 * وتحت كل فئة شارةُ من اختارها: اللوح يقول للمجلس أين رهانُ كل فريق.
 */
export function Stage1Board({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const ownerTeam = state.teams[owner]

  function pick(category: string, level: (typeof STAGE1_LEVELS)[number]) {
    if (state.s1Played.includes(cellKey(category, level))) return
    play('pickLand')
    dispatch({ t: 'S1_PICK', category, level })
  }

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} turnTeam={owner} />

      <RoundBar
        title="الجولة الجماعية"
        chips={[`سؤال ${state.s1Index + 1} / ${STAGE1_QUESTIONS}`, `الدور: ${ownerTeam.name}`]}
      />

      <div className="board-wrap grow">
        <div className="s1-board">
          {state.s1Categories.map((cat) => (
            /* الوحدة صفٌّ داخل إطارٍ واحد: بطاقة الفئة يميناً (RTL يضع الأوّل
               يميناً) وعمود المستويات الثلاثة يسارها — سهل ثم متوسط ثم صعب.
               والإطار ضرورةٌ لا زينة: بدونه يجاور عمودُ فئةٍ بطاقةَ الفئة التي
               تليها فيُقرأ لها، وستُّ وحدات متجاورة تصير شبكةً واحدة ملتبسة.
               ولا لون فريقٍ عليه: الفئات الستّ للّوح لا لأحد (٥ سبتمبر ٢٠٢٦). */
            <div key={cat.name} className="bunit">
              <div
                className="bhead"
                style={
                  categoryArt(cat.name)
                    ? ({ '--art': `url(${categoryArt(cat.name)})` } as React.CSSProperties)
                    : undefined
                }
              >
                {/* لوحةٌ داكنة تحت الاسم — شرط تشغيل لا زينة: رسمات الفئات فاتحة
                    متباينة، والاسمُ عليها بلا حجابٍ يضيع في نصفها (نفس علاج `.cat-name`). */}
                <span className="bh-plate">
                  <span className="bh-name">{displayName(cat.name)}</span>
                </span>
              </div>

              <div className="blevels">
                {STAGE1_LEVELS.map((level) => {
                  const played = state.s1Played.includes(cellKey(cat.name, level))
                  return (
                    <button
                      key={level}
                      className={'bcell' + (played ? ' played' : '')}
                      disabled={played}
                      onClick={() => pick(cat.name, level)}
                    >
                      <span className="bc-points tabular">{STAGE1_LEVEL_POINTS[level]}</span>
                      <span className="bc-level">{level}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-note board-note">يختار {ownerTeam.name} الخليّة، والحكم يضغطها</div>

      <style>{`
        .board-wrap {
          flex:1; min-height:0; display:flex; align-items:center; justify-content:center;
          padding-block:clamp(4px,1vh,12px);
        }
        /* ستّ وحدات في شبكة تملأ ما تركه الصفّ المرن — ثلاثة أعمدة وصفّان على
           الشاشة العريضة. لا ثابتَ بكسليّ يُخمَّن، فلا فيض تحت الشريط. */
        .s1-board {
          --cols:3;
          display:grid;
          grid-template-columns:repeat(var(--cols), 1fr);
          grid-auto-rows:1fr;
          gap:clamp(9px,1.4vw,24px);
          height:100%; width:100%;
          max-width:min(100%, 1500px);
        }
        /* الوحدة: البطاقة يميناً والمستويات يسارها. البطاقة تأخذ نصيب الأسد
           لأنّ الرسمة هي ما يُميّز الفئة من بعيد، والعمود يكفيه عرض رقمه. */
        .bunit {
          display:grid;
          grid-template-columns:1.35fr .95fr;
          gap:clamp(5px,.7vw,11px);
          min-width:0; min-height:0;
          padding:clamp(5px,.9vh,11px);
          border-radius:clamp(13px,2vh,22px);
          border:2px solid var(--border);
          background:var(--surface-2);
        }
        .bunit.team-0 { border-color:var(--gold); }
        .bunit.team-1 { border-color:var(--coral); }

        /* ===== بطاقة الفئة ===== */
        .bhead {
          display:flex; flex-direction:column; justify-content:flex-end;
          min-width:0; min-height:0; overflow:hidden;
          border-radius:clamp(10px,1.6vh,18px);
          --art:none;
          background-image:var(--art);
          background-size:cover;
          background-position:center;
          background-color:var(--surface-2);
          border:1px solid var(--border);
        }
        .bh-plate {
          display:flex; flex-direction:column; align-items:center;
          gap:clamp(1px,.35vh,4px);
          min-width:0;
          padding:clamp(12px,2.4vh,26px) 6px clamp(5px,1vh,11px);
          background:linear-gradient(to top, rgba(14,11,22,.9) 0%, rgba(14,11,22,.62) 45%, rgba(14,11,22,0) 100%);
        }
        .bh-name {
          font-size:clamp(12px, min(1.5vw, 2.6vh), 21px); font-weight:800; line-height:1.15;
          color:var(--cream); text-align:center; max-width:100%;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        /* شارة صاحب الاختيار — الفريقان بلونين ثابتين لا بترتيب الظهور. */
        .bh-owner {
          font-size:clamp(9px, min(1.05vw, 1.8vh), 13px); font-weight:800; line-height:1.2;
          padding:.18em .7em; border-radius:999px;
          max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bh-owner.team-0 { background:var(--gold); color:var(--on-gold); }
        .bh-owner.team-1 { background:var(--coral); color:var(--on-coral); }

        /* ===== عمود المستويات ===== */
        .blevels {
          display:grid; grid-template-rows:repeat(3, 1fr);
          gap:clamp(4px,.6vh,9px);
          min-width:0; min-height:0;
        }
        .bcell {
          display:flex; align-items:center; justify-content:center;
          gap:clamp(4px,.7vw,10px);
          min-width:0; min-height:0;
          font-family:inherit; cursor:pointer;
          border-radius:clamp(9px,1.4vh,15px);
          border:2px solid var(--gold);
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 68%);
          color:var(--gold);
          box-shadow:var(--lift);
          transition:transform .18s var(--ease-spring), box-shadow .25s ease, opacity .25s ease;
        }
        .bc-points { font-size:clamp(15px, min(2vw, 3.6vh), 32px); font-weight:800; line-height:1; }
        .bc-level  { font-size:clamp(9px, min(1.05vw, 1.9vh), 14px); font-weight:700; color:var(--text-2); }
        .bcell:active { transform:scale(.96); }
        .bcell:focus-visible { outline:none; box-shadow:var(--lift), 0 0 0 4px rgba(255,189,89,.5); }
        @media (hover:hover) {
          .bcell:not(.played):hover { transform:translateY(-3px); box-shadow:0 18px 34px rgba(0,0,0,.34), 0 0 28px rgba(255,189,89,.28); }
        }

        /* المستهلَك: ظاهر باهت لا يختفي — قاعدة العجلة نفسها (القسم ٧). */
        .bcell.played {
          cursor:default; opacity:.4; box-shadow:none;
          border-color:var(--border); color:var(--spent-text);
          background:var(--spent);
        }
        .bcell.played .bc-level { color:var(--spent-text); }

        .board-note { flex:none; }

        /* الشاشة الضيّقة: عمودان بدل ثلاثة — ثلاثة أعمدة تجعل رسمةَ الفئة
           أضيق من أن تُعرَف، والارتفاع هنا فائض لا شحيح. */
        @media (max-width:900px) { .s1-board { --cols:2; } }
        @media (max-width:520px) { .s1-board { --cols:1; } }

        /* الجوال الأفقي: ثلاثة أعمدة تبقى (العرض فائض والارتفاع هو الشحيح)،
           والحشوات وحدها تتنازل. **والرسمة تبقى** — الوحدة هنا نحو ١٠٠×١١٠
           بكسل، تسعها؛ وإخفاؤها يترك نصفَ الوحدة صندوقاً أبيض ويجعل شكل
           اللعبة على الجوال غير شكلها على الموقع. الشارة وحدها تسقط: هي
           أصغر ما يُقرأ، ولون إطار الوحدة يقول ما تقوله. */
        @media (max-height:480px) {
          .s1-board { --cols:3; gap:6px; }
          .bunit { grid-template-columns:1.25fr 1fr; gap:4px; padding:3px; border-radius:10px; }
          .bh-plate { padding:clamp(8px,2vh,14px) 3px 3px; }
          .bh-owner { display:none; }
          .blevels { gap:3px; }
          .board-note { display:none; }
        }
      `}</style>
    </div>
  )
}
