import { useEffect, useState } from 'react'
import type { Team, TeamId } from '../game/types'
import { SCORE_FIX_STEP, leader } from '../game/session'
import { useCountUp } from './useCountUp'
import { BrandLogo } from './BrandLogo'

/**
 * شريط النتيجة — حاضر في كل شاشة تقريباً.
 * التغيّر لا يقفز: الرقم يعدّ، والقرص ينبض، وتطير رقاقة +١٠ أو −١٠ فوقه.
 *
 * الضغطة التي تغيّر النقاط تنقل الشاشة في اللحظة نفسها، فيُبنى الشريط من جديد
 * ولا يعرف نقاطه السابقة. لذلك ذاكرة قصيرة خارج دورة حياة المكوّن:
 * إن تغيّرت نقاط الفريق خلال ثانيتين ونصف، يُستأنف العدّ من الرقم القديم.
 * والمهلة تحمي من حالة «لعبة جديدة»: النقاط تعود صفراً بعد وقت طويل فتُعرض بلا حركة.
 */
const RECENT_MS = 2500
const memory = new Map<Team['id'], { score: number; t: number }>()

/**
 * تصحيحُ الحكم — زرّان صغيران بجانب قرص النقاط.
 *
 * الحكم يخطئ في «من أجاب؟» فتذهب النقاط للفريق الغلط، ولم يكن لها ردّ إلى
 * الختام. وهما مكشوفان لا مخبوءان خلف قائمة: الخطأ يُكتشف في ثانية والتصحيح
 * يجب أن يقع في ثانية — والمجلس ينظر.
 *
 * ولا تأكيد قبلهما: الضغطة الخاطئة يردّها الزرُّ المقابل، والرقاقة الطائرة
 * فوق القرص (+10 أو −10) تقول ما وقع فوراً.
 */
function Adjust({ onAdjust }: { onAdjust: (delta: number) => void }) {
  return (
    <span className="pts-adj">
      <button type="button" aria-label={`زيادة ${SCORE_FIX_STEP} نقاط`} onClick={() => onAdjust(SCORE_FIX_STEP)}>
        +
      </button>
      <button type="button" aria-label={`إنقاص ${SCORE_FIX_STEP} نقاط`} onClick={() => onAdjust(-SCORE_FIX_STEP)}>
        −
      </button>
    </span>
  )
}

function TeamCapsule({
  team,
  lead,
  turn,
  onAdjust,
}: {
  team: Team
  lead: boolean
  turn?: boolean
  onAdjust?: (delta: number) => void
}) {
  // يُحسب مرة واحدة عند البناء — قبل أن يكتب التأثير أدناه القيمة الجديدة.
  const [from] = useState(() => {
    const m = memory.get(team.id)
    return m && Date.now() - m.t < RECENT_MS ? m.score : team.score
  })

  const shown = useCountUp(team.score, 650, from)
  const [delta, setDelta] = useState<number | null>(() =>
    from !== team.score ? team.score - from : null,
  )

  useEffect(() => {
    const m = memory.get(team.id)
    if (m && m.score !== team.score && Date.now() - m.t < RECENT_MS) {
      setDelta(team.score - m.score)
    }
    memory.set(team.id, { score: team.score, t: Date.now() })
  }, [team.id, team.score])

  useEffect(() => {
    if (delta === null) return
    const t = window.setTimeout(() => setDelta(null), 1200)
    return () => window.clearTimeout(t)
  }, [delta])

  const kicker = turn ? 'صاحب الدور' : `الفريق ${team.id === 0 ? 'الأول' : 'الثاني'}`

  return (
    <div className={'team team-' + team.id + (lead ? ' lead' : '') + (turn ? ' turn' : '') + (delta !== null ? ' bump' : '')}>
      {/* الكِكر يقول «صاحب الدور» حين يكون الدور له، وإلّا فترتيبُه. ويسقط
          حين يطابق اسمَ الفريق — الاسم الافتراضي هو «الفريق الأول/الثاني»
          نفسه، فيُكتب مرّتين في كبسولة واحدة بلا فائدة. */}
      <span className="team-copy">
        {kicker !== team.name && <span className="team-kicker">{kicker}</span>}
        <span className="name">{team.name}</span>
      </span>
      <span className="pts-group">
        <span className="pts-disc">
          <span className={`pts tabular digits-${Math.min(String(shown).length, 4)}`}>{shown}</span>
          {delta !== null && delta !== 0 && (
            <span key={delta} className={'delta tabular' + (delta < 0 ? ' minus' : '')}>
              {delta > 0 ? `+${delta}` : `${delta}`}
            </span>
          )}
        </span>
        {onAdjust && <Adjust onAdjust={onAdjust} />}
      </span>
    </div>
  )
}

/**
 * `onAdjust` اختياريّ: الشاشة التي لا تمرّره تعرض الشريط كما كان. فشاشةُ
 * الختام وما لا حكمَ فيه تبقى بلا أزرار.
 */
export function ScoreBar({
  teams,
  turnTeam,
  onAdjust,
}: {
  teams: [Team, Team]
  turnTeam?: 0 | 1
  onAdjust?: (team: TeamId, delta: number) => void
}) {
  const lead = leader(teams)
  return (
    <div className="scorebar">
      <TeamCapsule
        team={teams[0]}
        lead={lead === 0}
        turn={turnTeam === 0}
        onAdjust={onAdjust && ((d) => onAdjust(0, d))}
      />
      {/* قرص الوسط شعارٌ في كل شاشة (قرار علي ٦ سبتمبر ٢٠٢٦). كان يحمل وسماً
          نصّياً في كتلةٍ سوداء — «جولة 2 / 4»، «فاصل التعادل» — فحلّ الشعارُ
          محلَّها كلِّها: الناس تألفه بالتكرار، ولا يُبنى ذلك بظهورٍ واحد في
          الافتتاح. ولا كتلةَ خلفه: الاسمُ مرسومٌ بحدّه وظلّه. */}
      <div className="mid mid-brand">
        <BrandLogo className="mid-logo" />
      </div>
      <TeamCapsule
        team={teams[1]}
        lead={lead === 1}
        turn={turnTeam === 1}
        onAdjust={onAdjust && ((d) => onAdjust(1, d))}
      />
    </div>
  )
}
