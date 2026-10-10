import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { Mark, TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import { play } from '../audio/sfx'
import { questionSizeSuffix } from '../components/QuestionText'
import { FitAnswer } from '../components/FitAnswer'
import { AnswerFace } from '../components/AnswerFace'
import { celebSrc } from '../game/celebs'
import stage2RevealCss from './Stage2Reveal.css?inline'

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
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} />

      {q.image ? (
        <img
          className="reveal-photo"
          src={celebSrc(q.image)}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className={'reveal-q center fade' + questionSizeSuffix(q.question)}>{q.question}</div>
      )}
      <div className="reveal-a">
        <span className="a-label">الإجابة</span>
        {/* الوجه يجاور الاسم — السؤال نصٌّ قائمٌ فوقهما، بخلاف `q.image`
            التي تحلّ محلّ النصّ. */}
        <AnswerFace q={q}>
          <FitAnswer as="span" className="a-text">
            {q.answer}
          </FitAnswer>
        </AnswerFace>
      </div>

      <div className="mark-cards grow">
        {[0, 1].map((ti) => {
          const team = ti as TeamId
          const mark = state.s2Marks[team]
          return (
            <div key={ti} className={'mcard team-' + team + ' ' + mark}>
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

      <style>{stage2RevealCss}</style>
    </div>
  )
}
