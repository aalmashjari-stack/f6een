import type { GameState } from '../game/session'
import { stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { charadeUrl } from '../game/charades'
import { ScoreBar } from '../components/ScoreBar'
import { QrCode } from '../components/QrCode'
import stage1CharadeCss from './Stage1Charade.css?inline'

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
  /* النوعُ من `topic` والملصقُ من `answerImage` — يصلان الهاتفَ مع الكلمة (قرار علي ٢٠ سبتمبر ٢٠٢٦) */
  const url = charadeUrl(q.level, q.answer, { kind: q.topic, image: q.answerImage })

  return (
    <div className="screen charade-screen">
      <ScoreBar
        onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })}
        teams={state.teams}
        turnTeam={owner}
      />

      <div className="charade-lead">
        <span className="charade-team">{state.teams[owner].name}</span>
        <span className="charade-ask">اختاروا ممثّلكم — يمسح الرمز بهاتفه ويقرأ ما يمثّله</span>
      </div>

      <div className="charade-qr-wrap grow">
        <QrCode value={url} className="charade-qr" />
      </div>

      <div className="stack gap-s">
        <button
          className="action compact"
          onClick={() => dispatch({ t: 'S1_CHARADE_START', at: Date.now() })}
        >
          ابدأ التمثيل
        </button>
        <div className="action-note">اضغط حين يقول الممثّل: مستعدّ</div>
      </div>

      <style>{stage1CharadeCss}</style>
    </div>
  )
}
