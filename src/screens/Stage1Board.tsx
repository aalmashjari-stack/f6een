import type { GameState } from '../game/session'
import { STAGE1_LEVELS, STAGE1_LEVEL_POINTS, cellKey, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { displayName } from '../game/bank'
import { categoryArt } from '../components/categoryArt'
import { play } from '../audio/sfx'
import stage1BoardCss from './Stage1Board.css?inline'

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
    dispatch({ t: 'S1_PICK', category, level, at: Date.now() })
  }

  return (
    <div className="screen">
      {/* شريطُ الجولة سقط كلّه (٦ سبتمبر ٢٠٢٦): عنوانُه «الجولة الجماعية» يقوله
          اللوحُ نفسه — ستُّ فئاتٍ بثلاثة مستويات لا تظهر في مرحلةٍ أخرى؛ ورقاقةُ
          «الدور: فلان» مكرّرةٌ مرّتين حولها (كِكرُ «صاحب الدور» فوق الاسم في
          شريط النتيجة، وسطرُ «يختار فلانٌ الخليّة» تحت اللوح)؛ وعدُّ الأسئلة
          يقولُه اللوحُ بخلاياه الباهتة. والسطرُ المحرَّر يذهب إلى الشبكة:
          قاعدة اللقطة الواحدة تحذف ما يُقرأ مرّةً ولا تصغّره.
          ولا وسمَ في قرص الوسط، فيحمل الشعار (قرار علي ٦ سبتمبر ٢٠٢٦). */}
      <ScoreBar
        onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })}
        teams={state.teams}
        turnTeam={owner}
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

              {/* عددُ الصفوف من `STAGE1_LEVELS` لا من ثابتٍ في CSS: زيادةُ
                  مستوىً كانت تترك الشبكة على ثلاثة فيُقصّ الرابع. */}
              <div className="blevels" style={{ '--rows': STAGE1_LEVELS.length } as React.CSSProperties}>
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

      <style>{stage1BoardCss}</style>
    </div>
  )
}
