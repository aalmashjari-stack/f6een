import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameState } from '../game/session'
import { leader, playerStats } from '../game/session'
import { allQuestions } from '../game/bank'
import { gamesLabel } from '../lib/games'
import type { Action } from '../game/reducer'
import { Confetti } from '../components/Confetti'
import { useCountUp } from '../components/useCountUp'
import { play } from '../audio/sfx'
import { BrandLogo } from '../components/BrandLogo'
import endgameCss from './Endgame.css?inline'
import endgameReportPanelCss from './Endgame.ReportPanel.css?inline'

/** الرقم السالب يحمل إشارته، والموجب يحملها أيضاً ليُقرأ الجدول كسطر مكاسب لا كمجموع. */
function signed(n: number) {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}

/**
 * الختام — الشاشة ٨. الفائز، النتيجة، أفضل لاعب، سطر لكل لاعب.
 * زر التبليغ يعيش هنا فقط. الرصيد بخط صغير لا كإعلان.
 *
 * و`balance` قد يكون `null` — «لم يُقرأ بعد» لا «صفر». حتى ٣٠ أغسطس ٢٠٢٦
 * كان السطر يقول «لديك 3 ألعاب» لكل لاعب مهما كان رصيده: رقمٌ مكتوب باليد
 * في نسخة أولى بقي بعد أن صار الرصيد حقيقياً.
 */
export function Endgame({
  state,
  dispatch,
  balance,
}: {
  state: GameState
  dispatch: (a: Action) => void
  balance?: number | null
}) {
  const [reportOpen, setReportOpen] = useState(false)
  const win = leader(state.teams)
  const stats = playerStats(state).sort((a, b) => b.correct - a.correct || a.wrong - b.wrong)

  const sp = state.stagePoints
  const rows = [
    { key: 's1', label: 'الجولة الجماعية', v: sp.s1 },
    { key: 's2', label: 'الديربي', v: sp.s2 },
    { key: 's3', label: 'الحق ما تلحق', v: sp.s3 },
    // سطر الحسم لا يظهر إلا إن وقع تعادل فعلاً — وإلا كان صفراً بلا معنى
    ...(sp.tie[0] || sp.tie[1] ? [{ key: 'tie', label: 'سؤال الحسم', v: sp.tie }] : []),
  ]
  const s3Any = state.s3Counts.correct.concat(state.s3Counts.wrong).some((n) => n > 0)

  // النتيجة تُبنى أمام الجميع بدل أن تُعرض جاهزة — الرقم النهائي هو خاتمة الجلسة.
  const s0 = useCountUp(state.teams[0].score, 1400, 0)
  const s1 = useCountUp(state.teams[1].score, 1400, 0)

  // البشارة مع الكونفيتي، والتعادل لا يُبشَّر به كما لا يُحتفل به.
  // الحارس يمنع تكرارها حين يعيد StrictMode تركيب الشاشة في التطوير.
  const fanfared = useRef(false)
  useEffect(() => {
    if (fanfared.current || win === null) return
    fanfared.current = true
    play('win')
  }, [win])

  return (
    <div className="screen end">
      {/* التعادل لا يُحتفل به */}
      {win !== null && <Confetti />}

      <div className="brand">
        <BrandLogo className="end-logo" />
      </div>

      {/* البطاقة مستطيلة لا عمودية (قرار علي ٦ سبتمبر ٢٠٢٦): الختمُ والاسمُ
          والنتيجةُ في سطر واحد. الشاشة عريضة والبطاقة كانت تصعد أربعة أسطر،
          فما وفّره الاصطفافُ الأفقي يذهب إلى الجداول تحتها. */}
      <div className="winner">
        <span className="winner-stamp">نتيجة الليلة</span>
        <span className="w-copy">
          {win === null ? (
            <span className="w-title">تعادل</span>
          ) : (
            <>
              <span className="w-eyebrow">الفائز</span>
              <span className="w-title">{state.teams[win].name}</span>
            </>
          )}
        </span>
        <div className="final-score">
          <span className="tabular">{s0}</span> — <span className="tabular">{s1}</span>
        </div>
      </div>

      {/* الكتل الثلاث في صفّ على الشاشة العريضة بدل عمود واحد يمتدّ ثلاثة
          أضعاف ارتفاع الشاشة. الشاشة عريضة والجداول ضيّقة، فالعرض هو
          المتوفّر — وهذا وحده يردّ الختام إلى لقطة واحدة. */}
      <div className="es-grid">
        {/* عمودٌ يجمع جدولَ النقاط وعدَّ «الحق ما تلحق» تحته: بثلاث كتلٍ
          متجاورة كانت كتلةُ سطرين تقف بجانب كتلةِ ثمانية، فيبقى تحتها
          ثلثُ الشاشة فارغاً وتتدرّج الحوافّ. بعمودين تستوي الكفّتان:
          خمسةُ أسطرٍ وسطران يميناً، وثمانيةٌ يساراً. */}
        <div className="es-col">
          {/* ——— من أين جاءت النقاط ———
          السؤال الأول بعد «مين فاز» هو «وين خسرنا». الجدول يجيب عنه بثلاثة أسطر:
          كل مرحلة وما كسبه فيها كل فريق. الأرقام هنا تُجمع فتساوي النتيجة النهائية،
          فلا يحتاج القارئ أن يصدّق شيئاً لا يستطيع التحقّق منه بنفسه. */}
          <div className="es-block">
            <div className="es-title">من أين جاءت النقاط</div>
            <div className="es-table">
              <div className="es-row head">
                <span className="tabular">{state.teams[0].name}</span>
                <span className="es-label">المرحلة</span>
                <span className="tabular">{state.teams[1].name}</span>
              </div>
              {rows.map((r) => (
                <div key={r.key} className="es-row">
                  <span className={'es-num tabular' + (r.v[0] > r.v[1] ? ' up' : '')}>{signed(r.v[0])}</span>
                  <span className="es-label">{r.label}</span>
                  <span className={'es-num tabular' + (r.v[1] > r.v[0] ? ' up' : '')}>{signed(r.v[1])}</span>
                </div>
              ))}
              <div className="es-row total">
                <span className="es-num tabular">{state.teams[0].score}</span>
                <span className="es-label">المجموع</span>
                <span className="es-num tabular">{state.teams[1].score}</span>
              </div>
            </div>
          </div>

          {/* الحق ما تلحق تستهلك أكثر من نصف أسئلة الجلسة، ومع ذلك لا يبقى منها على
          الشاشة إلا رقم النقاط. هذه الثلاثة تعيد للفريق صورة دوره: كم لحق وكم فات. */}
          {s3Any && (
            <div className="es-block">
              <div className="es-title">الحق ما تلحق · عدد الأسئلة</div>
              <div className="es-table">
                {[0, 1].map((ti) => (
                  <div key={ti} className="es-row s3">
                    <span className="es-label strong">{state.teams[ti].name}</span>
                    <span className="es-chips">
                      <span className="chip ok">
                        <span className="tabular">{state.s3Counts.correct[ti]}</span> صحيحة
                      </span>
                      <span className="chip no">
                        <span className="tabular">{state.s3Counts.wrong[ti]}</span> خاطئة
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* اللاعب لا يُنقَّط بمفرده إلا في الديربي — والعنوان يقول ذلك صراحةً حتى لا
          يُقرأ صفرٌ أمام اسم لاعب اجتهد في المرحلتين الأخريين على أنه حكم عليه. */}
        <div className="es-block">
          <div className="es-title">الديربي · لاعباً لاعباً</div>
          <div className="es-table">
            {stats.map((s, i) => (
              <div
                key={s.player.id}
                className="es-row player"
                style={{ animationDelay: `${0.5 + i * 0.05}s` }}
              >
                <span className="sr-who">
                  <span className="sr-name">{s.player.name}</span>
                  <span className="sr-team">{state.teams[s.teamId].name}</span>
                </span>
                {/* رمز بدل كلمة في سطر اللاعب وحده: اثنا عشر سطراً في عمودين،
                  و«صح»/«غلط» مكتوبتين تسرقان من الاسم عرضه حتى يُقصّ. اللون
                  يحمل المعنى نفسه (ذهبي/مرجاني)، والعنوان فوق الجدول يفسّره. */}
                <span className="es-chips">
                  <span className="chip ok" title="إجابات صحيحة">
                    <span aria-hidden="true">✓</span>
                    <span className="tabular">{s.correct}</span>
                  </span>
                  <span className="chip no" title="إجابات خاطئة">
                    <span aria-hidden="true">✗</span>
                    <span className="tabular">{s.wrong}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="action" onClick={() => dispatch({ t: 'NEW_GAME' })}>
        لعبة جديدة
      </button>

      <div className="foot">
        <button className="foot-link" onClick={() => setReportOpen(true)}>
          بلّغ عن سؤال
          {state.reportedQuestionIds.length > 0 && ` (${state.reportedQuestionIds.length})`}
        </button>
        {balance !== null && balance !== undefined && (
          <>
            <span className="foot-sep">·</span>
            <span className="foot-balance">لديك {gamesLabel(balance)}</span>
          </>
        )}
      </div>

      {reportOpen && <ReportPanel state={state} dispatch={dispatch} onClose={() => setReportOpen(false)} />}

      <style>{endgameCss}</style>
    </div>
  )
}

/**
 * لوحة التبليغ — أسئلة هذه الجلسة وحدها.
 *
 * **الشاشة خلفها لا تتمدّد.** الختام يُقرأ في لقطة واحدة (`overflow:hidden`)،
 * فاللوحة طبقةٌ فوقه بارتفاع مقيَّد تتمرّر في داخلها — لا قسمٌ يُضاف أسفله
 * فيدفع الجدول خارج الشاشة.
 *
 * والنصّ يُحلّ من البنك كما يراه اللعب — المشحون بعد تركيب طبقة اللوحة عليه:
 * القاعدة تحفظ المعرّف وحده (`admin_reports`)، ونسخُ نصّ السؤال في الحالة
 * يضاعف حجم كل جلسة محفوظة بلا فائدة. ومن البنك المشحون وحده كان سؤالٌ
 * أضافته اللوحة يظهر هنا معرّفاً عارياً (`ADM0012`) لا نصّاً يُعرف.
 */
function ReportPanel({
  state,
  dispatch,
  onClose,
}: {
  state: GameState
  dispatch: (a: Action) => void
  onClose: () => void
}) {
  const bank = useMemo(() => new Map(allQuestions().map((q) => [q.id, q])), [])
  const asked = state.askedQuestionIds

  return (
    <div className="rp-veil" onClick={onClose}>
      <div className="rp" role="dialog" aria-label="بلّغ عن سؤال" onClick={(e) => e.stopPropagation()}>
        <header className="rp-head">
          <b>بلّغ عن سؤال</b>
          <button className="rp-x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </header>

        <p className="rp-sub">اختر السؤال المعطوب — يُحجز فوراً فلا يُسحب حتى تُراجعه الإدارة.</p>

        {asked.length === 0 ? (
          <p className="rp-sub">لا أسئلة في هذه الجلسة.</p>
        ) : (
          <ul className="rp-list">
            {asked.map((id) => {
              const q = bank.get(id)
              const done = state.reportedQuestionIds.includes(id)
              return (
                <li key={id} className="rp-row">
                  <span className="rp-q">
                    <span className="rp-cat">{q?.category ?? '—'}</span>
                    {q?.question ?? id}
                  </span>
                  {/* المبلَّغ عنه لا يُلغى: الإلغاء يفتح باب الضغط المتكرّر
                      على زرٍّ لا أثر ظاهر له، والبلاغ الزائد أرخص من واجهة
                      حالتين. */}
                  <button
                    className={'rp-btn' + (done ? ' done' : '')}
                    disabled={done}
                    onClick={() => dispatch({ t: 'REPORT_QUESTION', id })}
                  >
                    {done ? 'بُلّغ' : 'بلّغ'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <style>{endgameReportPanelCss}</style>
    </div>
  )
}
