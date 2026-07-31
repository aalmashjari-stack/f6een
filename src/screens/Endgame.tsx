import { useState } from 'react'
import type { GameState } from '../game/session'
import { leader, playerStats } from '../game/session'
import type { Action } from '../game/reducer'
import stickerUrl from '../../assets/sahsahli-sticker-gold.svg'

/**
 * الختام — الشاشة ٨. الفائز، النتيجة، أفضل لاعب، سطر لكل لاعب.
 * زر التبليغ يعيش هنا فقط. الرصيد بخط صغير لا كإعلان.
 */
export function Endgame({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [reportOpen, setReportOpen] = useState(false)
  const win = leader(state.teams)
  const stats = playerStats(state).sort((a, b) => b.correct - a.correct)
  const best = stats[0]?.correct > 0 ? stats[0] : null

  return (
    <div className="screen end">
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
        <div className="final-score tabular">
          {state.teams[0].score} — {state.teams[1].score}
        </div>
      </div>

      {best && (
        <div className="best">
          أفضل لاعب: <b>{best.player.name}</b> · {best.correct} إجابات صحيحة
        </div>
      )}

      <div className="stats">
        {stats.map((s) => (
          <div key={s.player.id} className="stat-row">
            <span className="sr-name">{s.player.name}</span>
            <span className="sr-team">{state.teams[s.teamId].name}</span>
            <span className="sr-correct tabular">صح: {s.correct}</span>
          </div>
        ))}
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
        .brand img { height:clamp(60px,10vh,110px); }
        .winner { display:flex; flex-direction:column; gap:6px; align-items:center; }
        .w-eyebrow { color:var(--text-2); font-weight:700; font-size:clamp(15px,2vw,20px); }
        .w-title { color:var(--gold); font-weight:800; font-size:clamp(40px,8vw,84px); line-height:1.05; }
        .final-score { font-size:clamp(28px,4.4vw,44px); font-weight:800; color:var(--cream); margin-top:6px; }
        .best { color:var(--cream); font-size:clamp(17px,2.4vw,22px); }
        .best b { color:var(--gold); }
        /* لا تمرير داخلي: الصفحة كلها تُمرَّر حتى لا يُقتطع لاعب من القائمة (حتى ١٢ لاعباً). */
        .stats { width:100%; max-width:640px; display:flex; flex-direction:column; gap:8px; flex:none; }
        .stat-row { display:grid; grid-template-columns:1fr 1fr auto; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); padding:12px 18px; }
        .sr-name { font-weight:800; text-align:right; }
        .sr-team { color:var(--text-2); font-size:14px; }
        .sr-correct { color:var(--gold); font-weight:700; }
        .foot { display:flex; align-items:center; gap:10px; color:var(--text-3); font-size:13px; }
        .foot-link { background:none; border:none; color:var(--text-2); font-family:inherit; font-size:13px; cursor:pointer; text-decoration:underline; }
        .report-note { max-width:560px; color:var(--text-2); font-size:13px; line-height:1.6; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); padding:12px 16px; }
      `}</style>
    </div>
  )
}
