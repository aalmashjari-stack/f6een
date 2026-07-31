import { useState } from 'react'
import type { SetupInput } from '../game/session'
import type { TeamId } from '../game/types'
import { ar } from '../util/num'
import stickerUrl from '../../assets/sahsahli-sticker-gold.svg'

const MIN = 2
const MAX = 6

/** أسماء بديلة تُستخدم فقط إن ترك الحقل فارغاً — الحقول تبدأ فارغة بنصّ إرشادي. */
const FALLBACK_TEAM = ['الفريق الأول', 'الفريق الثاني']

export function Setup({ onStart }: { onStart: (input: SetupInput) => void }) {
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [players, setPlayers] = useState<[string[], string[]]>([
    ['', ''],
    ['', ''],
  ])
  const [starter, setStarter] = useState<TeamId | null>(null)
  const [tossing, setTossing] = useState(false)
  const [tossFace, setTossFace] = useState<TeamId>(0)

  const teamLabel = (t: TeamId) => names[t].trim() || FALLBACK_TEAM[t]

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
      copy[team].push('')
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

  function start() {
    if (starter === null) return
    onStart({
      teamNames: [teamLabel(0), teamLabel(1)],
      players: [
        players[0].map((p, i) => p.trim() || `لاعب ${ar(i + 1)}`),
        players[1].map((p, i) => p.trim() || `لاعب ${ar(i + 1)}`),
      ],
      startingTeam: starter,
    })
  }

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
                placeholder="اكتب اسم فريقك"
                onChange={(e) => setNames((n) => (team === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
              />
              <div className="players">
                {players[team].map((p, i) => (
                  <input
                    key={i}
                    className="player"
                    value={p}
                    placeholder={`اسم اللاعب ${ar(i + 1)}`}
                    onChange={(e) => setPlayer(team, i, e.target.value)}
                  />
                ))}
              </div>
              <div className="counter">
                <button className="pill" onClick={() => removePlayer(team)} disabled={players[team].length <= MIN}>
                  −
                </button>
                <span>{ar(players[team].length)} لاعبين</span>
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
            يبدأ: <b>{teamLabel(starter)}</b>
          </div>
        ) : tossing ? (
          <div className="toss-result fade">القرعة… {teamLabel(tossFace)}</div>
        ) : (
          <div className="toss-hint">اضغط للقرعة لتحديد الفريق البادئ</div>
        )}
      </div>

      <div className="stack gap-s">
        <button className="action ghost" onClick={toss} disabled={tossing}>
          {starter !== null ? 'إعادة القرعة' : 'قرعة البدء'}
        </button>
        <button className="action" disabled={starter === null} onClick={start}>
          ابدأ اللعبة
        </button>
      </div>

      <style>{`
        .setup { overflow:auto; }
        .brand { display:flex; justify-content:center; flex:none; }
        .brand img {
          height:clamp(120px, 22vh, 260px);
          filter:drop-shadow(0 10px 30px rgba(0,0,0,.4));
          animation:brand-in .7s var(--ease-spring) both;
        }
        @keyframes brand-in {
          from { opacity:0; transform:scale(.86) translateY(-10px); }
          to   { opacity:1; transform:none; }
        }

        .teams-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; flex:none; }
        .team-card {
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 65%);
          border:2px solid var(--border);
          border-radius:clamp(26px, 4.5vh, 46px);
          padding:18px; display:flex; flex-direction:column; gap:12px;
          box-shadow:var(--lift);
          transition:border-color .3s ease, box-shadow .3s ease;
        }
        .team-card.starter { border-color:var(--gold); box-shadow:var(--lift), var(--glow-gold); }

        .team-name {
          background:transparent; border:none; border-bottom:2px solid var(--border);
          color:var(--gold); font-weight:800; font-size:clamp(18px,2.4vw,24px);
          font-family:inherit; text-align:center; padding:8px; outline:none;
        }
        .team-name::placeholder { color:var(--text-3); font-weight:700; }

        .players { display:flex; flex-direction:column; gap:8px; }
        .player {
          background:rgba(15,44,66,.6); border:1px solid var(--border);
          border-radius:999px; color:var(--cream); font-family:inherit;
          font-size:16px; padding:12px 20px; outline:none; text-align:center;
          transition:border-color .2s ease, background .2s ease;
        }
        .player::placeholder { color:var(--text-3); }
        .player:focus, .team-name:focus { border-color:var(--gold); }
        .player:focus { background:rgba(15,44,66,.9); }

        .counter { display:flex; align-items:center; justify-content:center; gap:16px; color:var(--text-2); font-weight:700; }
        .pill {
          width:40px; height:40px; border-radius:50%; border:1px solid var(--border);
          background:rgba(15,44,66,.6); color:var(--cream); font-size:22px; cursor:pointer;
          transition:transform .15s var(--ease-spring), border-color .2s ease;
        }
        .pill:active { transform:scale(.9); }
        .pill:disabled { opacity:.3; }

        .toss { text-align:center; min-height:32px; flex:none; }
        .toss-result { font-size:clamp(18px,2.6vw,26px); font-weight:700; }
        .toss-result b { color:var(--gold); }
        .toss-hint { color:var(--text-3); }

        @media (max-width:640px){ .teams-grid{ grid-template-columns:1fr; } }
      `}</style>
    </div>
  )
}
