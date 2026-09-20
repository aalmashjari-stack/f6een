import type { GameState } from '../game/session'
import { stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { charadeUrl } from '../game/charades'
import { ScoreBar } from '../components/ScoreBar'
import { QrCode } from '../components/QrCode'

/**
 * رمز «ولا كلمة» — بين لوح الجولة الجماعية والتمثيل (قرار علي ٢٠ سبتمبر
 * ٢٠٢٦، SPEC §٤). الشاشة الكبيرة لا تعرض الكلمة: ممثّلُ صاحب الدور يمسح
 * الرمز بهاتفه فيراها وحده، وفريقُه يخمّن من حركته.
 *
 * **بلا مؤقّت عمداً**: اختيارُ الممثّل والمسحُ وفتحُ الرابط لا يُحاسَب
 * عليها الفريق. والحكم يضغط «ابدأ» حين يقول الممثّل «مستعدّ» — كما لا يبدأ
 * مؤقّت «حروف» إلّا بعد وقوف البلاطة.
 *
 * والرمز أكبرُ ما في الشاشة: يُمسح من تلفزيونٍ على بُعد ثلاثة أمتار
 * وأربعة، وحجمُ الوحدة هو ما يقرّر ذلك لا حجمُ الرمز وحده — انظر `QrCode`.
 */
export function Stage1Charade({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const q = state.currentQuestion!
  const url = charadeUrl(q.level, q.answer)

  return (
    <div className="screen charade-screen">
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} turnTeam={owner} />

      <div className="charade-lead">
        <span className="charade-team">{state.teams[owner].name}</span>
        <span className="charade-ask">اختاروا ممثّلكم — يمسح الرمز بهاتفه ويقرأ ما يمثّله</span>
      </div>

      <div className="charade-qr-wrap grow">
        <QrCode value={url} className="charade-qr" />
      </div>

      <div className="stack gap-s">
        <button className="action compact" onClick={() => dispatch({ t: 'S1_CHARADE_START', at: Date.now() })}>
          ابدأ التمثيل
        </button>
        <div className="action-note">اضغط حين يقول الممثّل: مستعدّ</div>
      </div>

      <style>{`
        .charade-lead {
          flex:none; display:flex; flex-direction:column; align-items:center; gap:clamp(2px,.6dvh,6px);
          text-align:center; margin-top:clamp(4px,1.6dvh,18px);
        }
        .charade-team {
          color:var(--gold); font-weight:800;
          font-size:clamp(18px, min(3vw, 4.4dvh), 34px); line-height:1.2;
        }
        .charade-ask {
          color:var(--text-2); font-weight:600;
          font-size:clamp(13px, min(1.8vw, 2.8dvh), 22px); line-height:1.35;
        }
        /* الغلاف حاويةٌ تُقاس: الرمز مربّعٌ يأخذ أضيقَ بُعدَيها كاملاً —
           لا سقفَ بالبكسل؛ على التلفزيون كلُّ سنتيمترٍ فيه مسافةُ مسحٍ إضافيّة. */
        .charade-qr-wrap {
          flex:1; min-height:0; display:flex; align-items:center; justify-content:center;
          container-type:size;
          padding-block:clamp(2px,.8dvh,10px);
        }
        .charade-qr {
          width:min(100cqw, 100cqh); height:min(100cqw, 100cqh);
          display:block;
          border-radius:clamp(8px,1.2dvh,14px);
          box-shadow:var(--lift);
        }
        @media (max-height:480px) {
          .charade-lead { margin-top:0; gap:0; }
          .charade-ask { display:none; }
          .charade-screen .action-note { display:none; }
        }
      `}</style>
    </div>
  )
}
