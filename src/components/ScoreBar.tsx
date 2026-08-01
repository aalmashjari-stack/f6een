import type { Team } from '../game/types'
import { leader } from '../game/session'

export function ScoreBar({ teams, label }: { teams: [Team, Team]; label?: string }) {
  const lead = leader(teams)
  const capsule = (i: 0 | 1) => (
    <div key={teams[i].id} className={'team' + (lead === i ? ' lead' : '')}>
      <span className="name">{teams[i].name}</span>
      <span className="pts-disc">
        <span className="pts tabular">{teams[i].score}</span>
      </span>
    </div>
  )
  return (
    <div className="scorebar">
      {capsule(0)}
      {label && <div className="mid">{label}</div>}
      {capsule(1)}
    </div>
  )
}
