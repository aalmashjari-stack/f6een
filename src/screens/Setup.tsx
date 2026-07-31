import { useState } from 'react'
import type { SetupInput } from '../game/session'
import type { TeamId } from '../game/types'
import stickerUrl from '../../assets/sahsahli-sticker-gold.svg'

const MIN = 2
const MAX = 6

export function Setup({ onStart }: { onStart: (input: SetupInput) => void }) {
  const [names, setNames] = useState<[string, string]>(['فريق الغوص', 'فريق المرجان'])
  const [players, setPlayers] = useState<[string[], string[]]>([
    ['لاعب ١', 'لاعب ٢'],
    ['لاعب ٣', 'لاعب ٤'],
  ])
  const [starter, setStarter] = useState<TeamId | null>(null)
  const [tossing, setTossing] = useState(false)
  const [tossFace, setTossFace] = useState<TeamId>(0)

  function setPlayer(team: TeamId, i: number, v: string) {
    setPlayers((p) => {
      const copy: [string[], string[]] = [[...p[0]], [...p[1]]]
      copy[team][i] = v
      return copy
    })
  }
  function addPlayer(team: TeamId) {
    setPlayers((p) => {
      if (p[team].length >= MAX) return p
      const copy: [string[], string[]] = [[...p[0]], [...p[1]]]
      copy[team].push(`لاعب ${copy[team].length + 1}`)
      return copy
    })
  }
  function removePlayer(team: TeamId) {
    setPlayers((p) => {
      if (p[team].length <= MIN) return p
      const copy: [string[], string[]] = [[...p[0]], [...p[1]]]
      copy[team].pop()
      return copy
    })
  }

  function toss() {
    setTossing(true)
    setStarter(null)
    let n = 0
    const iv = setInterval(() => {
      setTossFace((f) => (1 - f) as TeamId)
      n++
      if (n > 11) {
        clearInterval(iv)
        const result = (Math.random() < 0.5 ? 0 : 1) as TeamId
        setTossFace(result)
        setStarter(result)
        setTossing(false)
      }
    }, 110)
  }

  const ready = starter !== null && names[0].trim() && names[1].trim()

  return (
    <div className="screen setup">
      <div className="brand">
        <img src={stickerUrl} alt="صحصحلي" />
      </div>

      <div className="teams-grid">
        {[0, 1].map((ti) => {
          const team = ti as TeamId
          return (
            <div key={ti} className={'team-card' + (starter === team ? ' starter' : '')}>
              <input
                className="team-name"
                value={names[team]}
                onChange={(e) => setNames((n) => (team === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
              />
              <div className="players">
                {players[team].map((p, i) => (
                  <input key={i} className="player" value={p} onChange={(e) => setPlayer(team, i, e.target.value)} />
                ))}
              </div>
              <div className="counter">
                <button className="pill" onClick={() => removePlayer(team)} disabled={players[team].length <= MIN}>
                  −
                </button>
                <span>{players[team].length} لاعبين</span>
                <button className="pill" onClick={() => addPlayer(team)} disabled={players[team].length >= MAX}>
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="toss">
        {starter !== null ? (
          <div className="toss-result">
            يبدأ: <b>{names[starter]}</b>
          </div>
        ) : tossing ? (
          <div className="toss-result fade">القرعة… {names[tossFace]}</div>
        ) : (
          <div className="toss-hint">اضغط للقرعة لتحديد الفريق البادئ</div>
        )}
      </div>

      <div className="stack gap-s">
        <button className="action ghost" onClick={toss} disabled={tossing}>
          {starter !== null ? 'إعادة القرعة' : 'قرعة البادئ'}
        </button>
        <button className="action" disabled={!ready} onClick={() => onStart({ teamNames: names, players, startingTeam: starter! })}>
          ابدأ اللعبة
        </button>
      </div>

      <style>{`
        .setup { overflow:auto; }
        .brand { display:flex; justify-content:center; }
        .brand img { height: clamp(70px, 12vh, 130px); }
        .teams-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .team-card { background:var(--surface); border:2px solid var(--border); border-radius:var(--r-lg); padding:16px; display:flex; flex-direction:column; gap:12px; }
        .team-card.starter { border-color:var(--gold); }
        .team-name { background:transparent; border:none; border-bottom:2px solid var(--border); color:var(--gold); font-weight:800; font-size:clamp(18px,2.4vw,24px); font-family:inherit; text-align:center; padding:6px; outline:none; }
        .players { display:flex; flex-direction:column; gap:8px; }
        .player { background:var(--night); border:1px solid var(--border); border-radius:10px; color:var(--cream); font-family:inherit; font-size:16px; padding:10px 12px; outline:none; }
        .player:focus, .team-name:focus { border-color:var(--gold); }
        .counter { display:flex; align-items:center; justify-content:center; gap:14px; color:var(--text-2); font-weight:700; }
        .pill { width:38px; height:38px; border-radius:50%; border:1px solid var(--border); background:var(--night); color:var(--cream); font-size:22px; cursor:pointer; }
        .pill:disabled { opacity:.35; }
        .toss { text-align:center; min-height:32px; }
        .toss-result { font-size:clamp(18px,2.6vw,26px); font-weight:700; }
        .toss-result b { color:var(--gold); }
        .toss-hint { color:var(--text-3); }
        @media (max-width:640px){ .teams-grid{ grid-template-columns:1fr; } }
      `}</style>
    </div>
  )
}
