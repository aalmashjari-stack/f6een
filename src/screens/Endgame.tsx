import { useState } from 'react'
import type { GameState } from '../game/session'
import { leader, playerStats } from '../game/session'
import type { Action } from '../game/reducer'
import { Confetti } from '../components/Confetti'
import { useCountUp } from '../components/useCountUp'
// نسخة داخل التطبيق بمصباح ٥٠٪. الملفان المعتمدان في assets/ يبقيان للمتاجر والطباعة.
import stickerUrl from '../../assets/sahsahli-sticker-hero.svg'

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
 */
export function Endgame({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [reportOpen, setReportOpen] = useState(false)
  const win = leader(state.teams)
  const stats = playerStats(state).sort((a, b) => b.correct - a.correct || a.wrong - b.wrong)
  const best = stats[0]?.correct > 0 ? stats[0] : null

  const sp = state.stagePoints
  const rows = [
    { key: 's1', label: 'الجولة الجماعية', v: sp.s1 },
    { key: 's2', label: 'راس براس', v: sp.s2 },
    { key: 's3', label: 'الحق ما تلحق', v: sp.s3 },
    // سطر الحسم لا يظهر إلا إن وقع تعادل فعلاً — وإلا كان صفراً بلا معنى
    ...(sp.tie[0] || sp.tie[1] ? [{ key: 'tie', label: 'سؤال الحسم', v: sp.tie }] : []),
  ]
  const s3Any = state.s3Counts.correct.concat(state.s3Counts.wrong).some((n) => n > 0)

  // النتيجة تُبنى أمام الجميع بدل أن تُعرض جاهزة — الرقم النهائي هو خاتمة الجلسة.
  const s0 = useCountUp(state.teams[0].score, 1400)
  const s1 = useCountUp(state.teams[1].score, 1400)

  return (
    <div className="screen end">
      {/* التعادل لا يُحتفل به */}
      {win !== null && <Confetti />}

      <div className="brand">
        <img src={stickerUrl} alt="صحصحلي" />
      </div>

      <div className="winner">
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
          أفضل لاعب في راس براس: <b>{best.player.name}</b> · {correctAnswers(best.correct)}
        </div>
      )}

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

      {/* اللاعب لا يُنقَّط بمفرده إلا في راس براس — والعنوان يقول ذلك صراحةً حتى لا
          يُقرأ صفرٌ أمام اسم لاعب اجتهد في المرحلتين الأخريين على أنه حكم عليه. */}
      <div className="es-block">
        <div className="es-title">راس براس · لاعباً لاعباً</div>
        <div className="es-table">
          {stats.map((s, i) => (
            <div key={s.player.id} className="es-row player" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
              <span className="sr-name">{s.player.name}</span>
              <span className="sr-team">{state.teams[s.teamId].name}</span>
              <span className="es-chips">
                <span className="chip ok">
                  <span className="tabular">{s.correct}</span> صح
                </span>
                <span className="chip no">
                  <span className="tabular">{s.wrong}</span> غلط
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="action" onClick={() => dispatch({ t: 'NEW_GAME' })}>
        لعبة جديدة
      </button>

      <div className="foot">
        <button className="foot-link" onClick={() => setReportOpen((v) => !v)}>
          بلّغ عن سؤال
        </button>
        <span className="foot-sep">·</span>
        <span className="foot-balance">لديك 3 ألعاب</span>
      </div>

      {reportOpen && (
        <div className="report-note">
          في النسخة الكاملة يفتح هذا قائمة أسئلة الجلسة لتعليم المعطوب واستبعاده من سحوباتك.
          {state.reportedQuestionIds.length > 0 && ` (بُلّغ عن ${state.reportedQuestionIds.length})`}
        </div>
      )}

      <style>{`
        .end { overflow:auto; align-items:center; text-align:center; }
        .brand img {
          width:min(56%, 420px); height:auto; max-height:14vh; object-fit:contain;
          animation:brand-in .7s var(--ease-spring) both;
        }
        @keyframes brand-in {
          from { opacity:0; transform:scale(.86) translateY(-10px); }
          to   { opacity:1; transform:none; }
        }
        .winner { display:flex; flex-direction:column; gap:6px; align-items:center; }
        .w-eyebrow { color:var(--text-2); font-weight:700; font-size:clamp(15px,2vw,20px); animation:rise .5s ease-out .18s both; }
        .w-title {
          color:var(--gold); font-weight:800; font-size:clamp(40px,8vw,84px); line-height:1.05;
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
          font-size:clamp(28px,4.4vw,44px); font-weight:800; color:var(--cream); margin-top:6px;
          animation:rise .5s ease-out .42s both;
        }
        .best { color:var(--cream); font-size:clamp(17px,2.4vw,22px); animation:rise .5s ease-out .46s both; }
        @keyframes rise {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:none; }
        }
        .best b { color:var(--gold); }

        /* لا تمرير داخلي: الصفحة كلها تُمرَّر حتى لا يُقتطع لاعب من القائمة (حتى ١٢ لاعباً). */
        .es-block { width:100%; max-width:680px; flex:none; display:flex; flex-direction:column; gap:8px; animation:rise .5s ease-out .5s both; }
        .es-title { color:var(--text-2); font-weight:700; font-size:clamp(14px,1.8vw,17px); text-align:center; }
        .es-table { display:flex; flex-direction:column; gap:6px; }
        .es-row {
          display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px;
          background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md);
          padding:clamp(9px,1.4vh,14px) clamp(12px,2vw,20px);
        }
        .es-label { color:var(--text-2); font-size:clamp(14px,1.9vw,19px); font-weight:700; white-space:nowrap; }
        .es-label.strong { color:var(--cream); }
        .es-num { font-size:clamp(19px,2.6vw,30px); font-weight:800; color:var(--text-2); }
        /* الأعلى في المرحلة وحده ذهبي — الفرق يُقرأ بلمحة بلا مقارنة رقمين */
        .es-num.up { color:var(--gold); }
        .es-row.head { background:transparent; border-color:transparent; padding-bottom:0; }
        .es-row.head span { color:var(--text-2); font-weight:700; font-size:clamp(13px,1.7vw,17px); }
        .es-row.total { border-color:var(--gold); background:transparent; }
        .es-row.total .es-num { color:var(--gold); font-size:clamp(22px,3.2vw,36px); }

        .es-row.s3, .es-row.player { grid-template-columns:1fr auto; }
        .es-row.player { grid-template-columns:1fr auto auto; }
        .es-row.player { animation:rise .45s ease-out both; }
        .sr-name { font-weight:800; text-align:right; font-size:clamp(15px,2vw,20px); }
        .sr-team { color:var(--text-3); font-size:clamp(12px,1.5vw,14px); }

        .es-chips { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
        .chip {
          display:inline-flex; align-items:center; gap:5px;
          border:1px solid var(--border); border-radius:999px; padding:4px 12px;
          color:var(--text-2); font-size:clamp(12px,1.6vw,15px); font-weight:700; white-space:nowrap;
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
