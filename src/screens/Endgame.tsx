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

/** تمييز العدد العربي: ١ مفرد، ٢ مثنّى، ٣–١٠ جمع، ١١ فأكثر مفرد منصوب. */
function correctAnswers(n: number) {
  if (n === 1) return 'إجابة صحيحة واحدة'
  if (n === 2) return 'إجابتان صحيحتان'
  if (n <= 10) return `${n} إجابات صحيحة`
  return `${n} إجابة صحيحة`
}

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
  const best = stats[0]?.correct > 0 ? stats[0] : null

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
  const s0 = useCountUp(state.teams[0].score, 1400)
  const s1 = useCountUp(state.teams[1].score, 1400)

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

      <div className="winner">
        <span className="winner-stamp">نتيجة الليلة</span>
        {win === null ? (
          <span className="w-title">تعادل</span>
        ) : (
          <>
            <span className="w-eyebrow">الفائز</span>
            <span className="w-title">{state.teams[win].name}</span>
          </>
        )}
        <div className="final-score">
          <span className="tabular">{s0}</span> — <span className="tabular">{s1}</span>
        </div>
      </div>

      {best && (
        <div className="best">
          أفضل لاعب في الديربي: <b>{best.player.name}</b> · {correctAnswers(best.correct)}
        </div>
      )}

      {/* الكتل الثلاث في صفّ على الشاشة العريضة بدل عمود واحد يمتدّ ثلاثة
          أضعاف ارتفاع الشاشة. الشاشة عريضة والجداول ضيّقة، فالعرض هو
          المتوفّر — وهذا وحده يردّ الختام إلى لقطة واحدة. */}
      <div className="es-grid">
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

      {/* اللاعب لا يُنقَّط بمفرده إلا في الديربي — والعنوان يقول ذلك صراحةً حتى لا
          يُقرأ صفرٌ أمام اسم لاعب اجتهد في المرحلتين الأخريين على أنه حكم عليه. */}
      <div className="es-block">
        <div className="es-title">الديربي · لاعباً لاعباً</div>
        <div className="es-table">
          {stats.map((s, i) => (
            <div key={s.player.id} className="es-row player" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
              <span className="sr-name">{s.player.name}</span>
              <span className="sr-team">{state.teams[s.teamId].name}</span>
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

      {reportOpen && (
        <ReportPanel state={state} dispatch={dispatch} onClose={() => setReportOpen(false)} />
      )}

      <style>{`
        /* لا تمرير — الختام يُقرأ في لقطة واحدة كبقية الشاشات. */
        .end { overflow:hidden; align-items:center; text-align:center; }

        /* الكتل الثلاث صفّاً على العريض، وتنكسر إلى عمود على الضيّق.
           align-items:start حتى لا يتمدّد الجدول القصير ليطاول الطويل. */
        .es-grid {
          /* تأخذ ما تبقّى بعد الفائز والزرّ: بـ0 1 auto كانت تنكمش دون محتواها
             فتفيض كتلُها من صندوقها وتركب على زرّ «لعبة جديدة». */
          min-height:0; flex:1 1 auto;
          /* قياسٌ مشترك مع بطاقة الفائز بدل الامتداد من حافّة إلى حافّة: على
             شاشة ألفَي بكسل كانت الجداول تعبر ١٩٠٠ بكسلاً تحت بطاقةٍ عرضُها
             ٧٦٠، فتُقرأ الشاشة كتلتين لا تجمعهما عين واحدة. */
          width:min(100%, 1400px); margin-inline:auto;
          display:grid; grid-template-columns:1fr;
          gap:clamp(10px, 1.6vw, 26px);
          /* الفائضُ الرأسي يُقسَم فوق الجداول وتحتها بدل أن يتكوّم كلّه فوق
             زرّ «لعبة جديدة» — الكتل تعلو إلى وسط نصيبها فتقف الشاشة متّزنة. */
          align-content:center;
          align-items:start; justify-items:center;
        }
        /* الأعمدة الثلاثة غير متساوية عمداً: جدول اللاعبين أكثفها (اثنا عشر
           سطراً في عمودين) فيأخذ الضعف، وجدول «الحق ما تلحق» سطران فيكفيه
           أقلّها. بأثلاث متساوية كان سطر اللاعب ١٩٥px فيُقصّ الاسم. */
        @media (min-width:900px) {
          .es-grid { grid-template-columns:minmax(0,1fr) minmax(0,.78fr) minmax(0,1.55fr); }
        }
        .brand img {
          width:min(56%, 420px); height:auto; max-height:14vh; object-fit:contain;
          animation:brand-in .7s var(--ease-spring) both;
        }
        @keyframes brand-in {
          from { opacity:0; transform:scale(.86) translateY(-10px); }
          to   { opacity:1; transform:none; }
        }
        .winner { display:flex; flex-direction:column; gap:6px; align-items:center; flex:none; }
        .w-eyebrow {
          color:var(--text-2); font-weight:700; line-height:1.2;
          font-size:clamp(12px,min(1.6vw,2vh),18px);
          animation:rise .5s ease-out .18s both;
        }
        /* أحجام الختام تأخذ أصغر نصيبَي العرض والارتفاع — نفس علّة .q-text:
           بـvw وحده ينفخ الخط على شاشة عريضة ويدفع الجداول خارجها، والختام
           أكثف الشاشات (حتى اثنا عشر لاعباً وأربعة أسطر مراحل). */
        /* اسم الفائز أكبر عنصر في الشاشة، لكنه يُقرأ لمحةً واحدة بينما الجداول
           تحته تُقرأ وتُناقَش. سقفه هنا أقلّ من السابق (٦٤ بدل ٨٤) ونصيبه من
           الارتفاع أقلّ (٦vh بدل ٧٫٤) — الفرق كلّه يذهب إلى الجداول. */
        .w-title {
          color:var(--gold); font-weight:800; font-size:clamp(26px,min(5vw,6vh),64px); line-height:1.05;
          animation:winner-in .8s var(--ease-spring) .26s both;
          text-shadow:0 0 46px rgba(255,189,89,.42);
        }
        /* اسم الفائز يدخل كبيراً ثم يستقرّ — أكبر عنصر في أهم لحظة */
        @keyframes winner-in {
          0%   { opacity:0; transform:scale(1.5); filter:blur(9px); }
          55%  { opacity:1; filter:none; }
          100% { opacity:1; transform:none; filter:none; }
        }
        .final-score {
          font-size:clamp(16px,min(2.6vw,3.2vh),34px); font-weight:800; color:var(--cream); margin-top:clamp(1px,.5vh,6px);
          line-height:1.2;
          animation:rise .5s ease-out .42s both;
        }
        .best { color:var(--cream); font-size:clamp(13px,min(2vw,2.3vh),22px); animation:rise .5s ease-out .46s both; }
        @keyframes rise {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:none; }
        }
        .best b { color:var(--gold); }

        /* لا تمرير داخلي: الصفحة كلها تُمرَّر حتى لا يُقتطع لاعب من القائمة (حتى ١٢ لاعباً). */
        .es-block { width:100%; max-width:680px; min-width:0; flex:none; display:flex; flex-direction:column; gap:8px; animation:rise .5s ease-out .5s both; }
        .es-title { color:var(--text-2); font-weight:700; font-size:clamp(11px,min(1.5vw,1.7vh),17px); text-align:center; }
        .es-table { display:flex; flex-direction:column; gap:6px; width:100%; }
        /* من سبعة لاعبين فصاعداً ينقسم الجدول عمودين: اثنا عشر لاعباً في ستة
           صفوف بدل اثني عشر — وهو أطول جدول في الشاشة. */
        .es-table:has(.es-row.player:nth-child(7)) {
          display:grid; grid-template-columns:1fr 1fr; gap:6px clamp(6px,.8vw,12px);
        }
        .es-row {
          display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px;
          background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md);
          padding:clamp(9px,1.4vh,14px) clamp(12px,2vw,20px);
        }
        .es-label { color:var(--text-2); font-size:clamp(11px,min(1.6vw,1.9vh),19px); font-weight:700; white-space:nowrap; line-height:1.35; }
        .es-label.strong { color:var(--cream); }
        .es-num { font-size:clamp(14px,min(2.1vw,2.5vh),30px); font-weight:800; color:var(--text-2); line-height:1.25; }
        /* الأعلى في المرحلة وحده ذهبي — الفرق يُقرأ بلمحة بلا مقارنة رقمين */
        .es-num.up { color:var(--gold); }
        .es-row.head { background:transparent; border-color:transparent; padding-bottom:0; }
        .es-row.head span { color:var(--text-2); font-weight:700; font-size:clamp(10px,min(1.4vw,1.6vh),17px); }
        .es-row.total { border-color:var(--gold); background:transparent; }
        .es-row.total .es-num { color:var(--gold); font-size:clamp(16px,min(2.5vw,2.9vh),36px); }

        .es-row.s3, .es-row.player { grid-template-columns:1fr auto; }
        .es-row.player { grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto; }
        .es-row.player { animation:rise .45s ease-out both; }
        /* سطر واحد لكل لاعب: العمود ضيّق (نصف الكتلة) والأسماء تطول، فبلا
           هذا يلتفّ السطر إلى ثلاثة ويصير الجدول أطول من الشاشة وحده. */
        .sr-name {
          font-weight:800; text-align:right; font-size:clamp(11px,min(1.5vw,1.8vh),20px);
          min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.35;
        }
        /* اسم الفريق يتقلّص هو أيضاً — عمود auto لا يتنازل من تلقائه، فيدفع
           السطر خارج الكتلة أفقياً على الشاشة الأضيق. */
        .sr-team {
          color:var(--text-3); font-size:clamp(9px,min(1.1vw,1.3vh),14px);
          white-space:nowrap; line-height:1.35;
          min-width:0; overflow:hidden; text-overflow:ellipsis;
        }

        .es-chips { display:flex; gap:5px; flex-wrap:nowrap; justify-content:flex-end; }
        .chip {
          display:inline-flex; align-items:center; gap:4px;
          border:1px solid var(--border); border-radius:999px; padding:2px clamp(6px,.8vw,12px);
          color:var(--text-2); font-size:clamp(9px,min(1.2vw,1.4vh),15px); font-weight:700; white-space:nowrap;
          line-height:1.4;
        }
        .chip .tabular { font-size:1.15em; font-weight:800; }
        .chip.ok { color:var(--gold); border-color:rgba(255,189,89,.45); }
        .chip.no { color:var(--coral); border-color:rgba(228,103,74,.45); }
        .foot { display:flex; align-items:center; gap:10px; color:var(--text-3); font-size:13px; }
        .foot-link { background:none; border:none; color:var(--text-2); font-family:inherit; font-size:13px; cursor:pointer; text-decoration:underline; }
        .report-note { max-width:560px; color:var(--text-2); font-size:13px; line-height:1.6; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); padding:12px 16px; }
      `}</style>
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
      <div
        className="rp"
        role="dialog"
        aria-label="بلّغ عن سؤال"
        onClick={(e) => e.stopPropagation()}
      >
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

      <style>{`
        /* رموز «نيو» صراحةً لا رموز المسرح (--gold و--surface): تلك تُترجَم
           في نيو إلى حبرٍ داكن، فتصير اللوحة نصّاً فاتحاً على أبيض وزرّاً
           أسود بنصٍّ بنّي. جُرِّب فبان. */
        .rp-veil {
          position:fixed; inset:0; z-index:80;
          display:flex; align-items:center; justify-content:center; padding:16px;
          background:rgba(10,8,20,.5);
        }
        .rp {
          display:flex; flex-direction:column; gap:8px;
          width:min(760px, 100%); max-height:min(84vh, 720px);
          padding:16px; overflow:hidden;
          background:var(--n-surface, #fff); color:var(--n-ink, #1A1626);
          border-radius:16px; box-shadow:0 24px 60px rgba(0,0,0,.28);
          text-align:start;
        }
        .rp-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .rp-head b { font-size:17px; font-weight:900; color:var(--n-ink, #1A1626); }
        .rp-x {
          font:inherit; font-size:20px; font-weight:800; line-height:1; cursor:pointer;
          width:32px; height:32px; border:0; border-radius:999px;
          background:var(--n-surface-2, #F8F7FC); color:var(--n-ink-2, #5D5670);
        }
        .rp-sub { margin:0; font-size:13px; font-weight:700; color:var(--n-ink-3, #948CA8); }
        .rp-list {
          list-style:none; margin:4px 0 0; padding:0; overflow:auto;
          display:flex; flex-direction:column; gap:6px;
        }
        .rp-row {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:9px 11px; border-radius:10px; background:var(--n-surface-2, #F8F7FC);
        }
        .rp-q { font-size:14px; font-weight:700; line-height:1.5; color:var(--n-ink, #1A1626); }
        .rp-cat {
          display:block; font-size:11px; font-weight:800; color:var(--n-ink-3, #948CA8);
        }
        .rp-btn {
          flex:0 0 auto; font:inherit; font-weight:800; font-size:13px; cursor:pointer;
          padding:7px 14px; border:0; border-radius:999px;
          background:var(--n-brand, #7A3E9D); color:#fff;
        }
        .rp-btn.done { background:transparent; color:var(--n-ink-3, #948CA8);
          box-shadow:inset 0 0 0 1px currentColor; cursor:default; }
      `}</style>
    </div>
  )
}
