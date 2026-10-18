import { useEffect, useRef, useState } from 'react'
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
      <button
        type="button"
        aria-label={`زيادة ${SCORE_FIX_STEP} نقاط`}
        onClick={() => onAdjust(SCORE_FIX_STEP)}
      >
        +
      </button>
      <button
        type="button"
        aria-label={`إنقاص ${SCORE_FIX_STEP} نقاط`}
        onClick={() => onAdjust(-SCORE_FIX_STEP)}
      >
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
  const [delta, setDelta] = useState<number | null>(() => (from !== team.score ? team.score - from : null))

  /* المهلة لحالة إعادة البناء وحدها (ذاكرةٌ من شاشةٍ سابقة قد تكون قديمة).
     أمّا التغيّر والمكوّن حيّ — تصحيحُ الحكم على شاشة الكشف — فيُرقَّق دائماً:
     كان يُشترط له قربُ زمن البناء، فتصحيحٌ بعد ثلاث ثوانٍ يعدّ بلا رقاقة،
     فيُظنّ أنّه لم يقع ويُضغط ثانيةً (مراجعة ٢٥ سبتمبر ٢٠٢٦). */
  const mounted = useRef(false)
  useEffect(() => {
    const m = memory.get(team.id)
    if (m && m.score !== team.score && (mounted.current || Date.now() - m.t < RECENT_MS)) {
      setDelta(team.score - m.score)
    }
    mounted.current = true
    memory.set(team.id, { score: team.score, t: Date.now() })
  }, [team.id, team.score])

  useEffect(() => {
    if (delta === null) return
    const t = window.setTimeout(() => setDelta(null), 1200)
    return () => window.clearTimeout(t)
  }, [delta])

  return (
    <div
      className={
        'team team-' +
        team.id +
        (lead ? ' lead' : '') +
        (turn ? ' turn' : '') +
        (delta !== null ? ' bump' : '')
      }
    >
      {/* علامة ✓ على حافّة كبسولة صاحب الدور — تُرى من آخر المجلس حيث لا
          يُقرأ سطرٌ صغير، وهي إشارة الدور الوحيدة. */}
      {turn && (
        <span className="turn-check" role="img" aria-label="صاحب الدور">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      {/* الاسم وحده في وسط الكبسولة بلا سطرٍ فوقه — «صاحب الدور» و«الفريق
          الثاني» شِيلا (طلب علي ١٧ أكتوبر)؛ والدور تقوله علامة ✓. */}
      <span className="team-copy">
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
      {/* قرص الوسط فارغٌ بمقاس الشعار (طلب علي ١٧ أكتوبر): الشعار يُرسم
          مخفيّاً ليحفظ عرضه، فيبقى الشريط كما كان والوسط فراغاً. */}
      <div className="mid mid-brand" aria-hidden="true" style={{ visibility: 'hidden' }}>
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
