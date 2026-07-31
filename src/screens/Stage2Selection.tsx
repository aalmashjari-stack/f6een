import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'

/**
 * اختيار لاعبَي راس براس — الشاشة ٤. بلا زر، تنتقل تلقائياً.
 * اختيار عشوائي بحركة تشويق، ضمن الدورة الكاملة (s2Rem).
 * سطر «لم يُختر بعد» يخدم شفافية الدورة بنفس منطق الأقسام الرمادية.
 */
export function Stage2Selection({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const pick = (team: TeamId) => {
    const rem = state.s2Rem[team]
    return rem[Math.floor(Math.random() * rem.length)]
  }
  const targetRef = useRef<[number, number]>([pick(0), pick(1)])
  const [display, setDisplay] = useState<[number, number]>([0, 0])
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let n = 0
    const iv = setInterval(() => {
      setDisplay([
        Math.floor(Math.random() * state.teams[0].players.length),
        Math.floor(Math.random() * state.teams[1].players.length),
      ])
      n++
      if (n > 13) {
        clearInterval(iv)
        setDisplay(targetRef.current)
        setSettled(true)
        setTimeout(() => dispatch({ t: 'S2_SELECT', sel: targetRef.current }), 1100)
      }
    }, 90)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nameOf = (team: TeamId, idx: number) => state.teams[team].players[idx]?.name ?? ''

  return (
    <div className="screen center-col">
      <ScoreBar teams={state.teams} label={`راس براس · جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      <div className="grow center-all">
        <div className={'vs-wrap' + (settled ? ' settled' : '')}>
          <div className="vs-player right">{nameOf(0, display[0])}</div>
          <div className="vs">ضد</div>
          <div className="vs-player left">{nameOf(1, display[1])}</div>
        </div>
      </div>

      <div className="not-picked">
        {[0, 1].map((ti) => {
          const team = ti as TeamId
          const remNames = state.s2Rem[team].map((i) => nameOf(team, i))
          return (
            <div key={ti} className="np-col">
              <div className="np-title">{state.teams[team].name} — لم يُختر بعد</div>
              <div className="np-names">{remNames.join(' · ') || '—'}</div>
            </div>
          )
        })}
      </div>

      <style>{`
        .vs-wrap { display:flex; align-items:center; gap:clamp(16px,5vw,60px); }
        .vs-player { font-size:clamp(30px,6vw,68px); font-weight:800; color:var(--cream); transition:transform .2s; }
        .vs-wrap.settled .vs-player { color:var(--gold); transform:scale(1.06); }
        .vs { color:var(--coral); font-weight:800; font-size:clamp(22px,3.4vw,40px); }
        .not-picked { display:flex; gap:16px; }
        .np-col { flex:1; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); padding:12px 16px; }
        .np-title { color:var(--text-2); font-weight:700; font-size:14px; margin-bottom:4px; }
        .np-names { color:var(--text-3); font-size:15px; }
      `}</style>
    </div>
  )
}
