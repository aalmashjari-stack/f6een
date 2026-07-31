import type { Team } from '../game/types'
import { leader } from '../game/session'

export function ScoreBar({ teams, label }: { teams: [Team, Team]; label?: string }) {
  const lead = leader(teams)
  return (
    <div className="scorebar">
      {[0, 1].map((i) => {
        const t = teams[i]
        return (
          <div key={t.id} className={'team' + (lead === i ? ' lead' : '')}>
            <span className="name">{t.name}</span>
            <span className="pts tabular">{t.score}</span>
          </div>
        )
      })}
      {label && <div className="mid">{label}</div>}
    </div>
  )
}
