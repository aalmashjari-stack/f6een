import { useEffect, useState } from 'react'
import type { Team } from '../game/types'
import { leader } from '../game/session'
import { useCountUp } from './useCountUp'

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

function TeamCapsule({ team, lead, turn }: { team: Team; lead: boolean; turn?: boolean }) {
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
      <span className="pts-disc">
        <span className={`pts tabular digits-${Math.min(String(shown).length, 4)}`}>{shown}</span>
        {delta !== null && delta !== 0 && (
          <span key={delta} className={'delta tabular' + (delta < 0 ? ' minus' : '')}>
            {delta > 0 ? `+${delta}` : `${delta}`}
          </span>
        )}
      </span>
    </div>
  )
}

export function ScoreBar({ teams, label, turnTeam }: { teams: [Team, Team]; label?: string; turnTeam?: 0 | 1 }) {
  const lead = leader(teams)
  return (
    <div className="scorebar">
      <TeamCapsule team={teams[0]} lead={lead === 0} turn={turnTeam === 0} />
      <div className="mid">
        <span className="mid-dot" aria-hidden="true" />
        <span>{label ?? 'فطين'}</span>
      </div>
      <TeamCapsule team={teams[1]} lead={lead === 1} turn={turnTeam === 1} />
    </div>
  )
}
