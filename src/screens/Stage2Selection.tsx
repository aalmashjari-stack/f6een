import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const timers = useRef<number[]>([])
  const targetRef = useRef<[number, number]>([pick(0), pick(1)])
  const [display, setDisplay] = useState<[number, number]>([0, 0])
  const [spin, setSpin] = useState(0)
  const [settled, setSettled] = useState(false)

  /* ——— ملاءمة الاسم الطويل ———
     خانة الاسم تقصّ ما يخرج منها ليعمل انزلاق البكرة، فالاسم الطويل كان يُبتر.
     الحل: قياس أطول اسم في اللعبة مرة واحدة وتصغير الخط ليتّسع له.
     القياس على الأطول لا على المعروض الآن، وإلا رقص حجم الخط مع كل دورة للبكرة. */
  const slotRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [fontPx, setFontPx] = useState<number | null>(null)

  /* أطول *كلمة* لا أطول اسم: الاسم المركّب يلتفّ إلى سطرين، فالذي يجب أن يتّسع
     في سطر واحد هو أطول كلمة فيه وحدها. */
  const longest = [...state.teams[0].players, ...state.teams[1].players]
    .flatMap((p) => p.name.split(/\s+/))
    .reduce((a, b) => (b.length > a.length ? b : a), '')

  useLayoutEffect(() => {
    const slot = slotRef.current
    const probe = probeRef.current
    if (!slot || !probe) return

    const fit = () => {
      const avail = slot.clientWidth * 0.94
      const w = probe.offsetWidth // قياس فعلي بنفس الخط والوزن — لا تقدير
      if (!avail || !w) return
      // نفس قيمة clamp في CSS أدناه؛ تُحسب هنا لأن قراءة المقاس بعد تطبيقه تُنتج حلقة.
      const base = Math.min(68, Math.max(30, window.innerWidth * 0.06))
      // حدّ أدنى للقراءة من آخر المجلس — دونه يتكفّل الالتفاف في CSS بالباقي.
      setFontPx(w > avail ? Math.max(18, (base * avail) / w) : base)
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [longest])

  useEffect(() => {
    let n = 0
    // بكرة تتباطأ بدل وتيرة واحدة — التباطؤ هو ما يصنع التشويق، لا السرعة.
    const tick = () => {
      setDisplay([
        Math.floor(Math.random() * state.teams[0].players.length),
        Math.floor(Math.random() * state.teams[1].players.length),
      ])
      setSpin((s) => s + 1)
      n++
      if (n > 15) {
        setDisplay(targetRef.current)
        setSpin((s) => s + 1)
        setSettled(true)
        timers.current.push(
          window.setTimeout(() => dispatch({ t: 'S2_SELECT', sel: targetRef.current }), 1500),
        )
        return
      }
      const p = n / 16
      timers.current.push(window.setTimeout(tick, 70 + 460 * p * p * p))
    }
    timers.current.push(window.setTimeout(tick, 260))
    const t = timers.current
    return () => t.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nameOf = (team: TeamId, idx: number) => state.teams[team].players[idx]?.name ?? ''

  return (
    <div className="screen center-col">
      <ScoreBar teams={state.teams} label={`راس براس · جولة ${state.s2Index + 1} / ${state.s2Rounds}`} />

      <div className="grow center-all">
        <div
          className={'vs-wrap' + (settled ? ' settled' : '')}
          style={fontPx ? ({ ['--vs-size']: `${fontPx}px` } as React.CSSProperties) : undefined}
        >
          <div className="vs-slot" ref={slotRef}>
            {/* مسطرة مخفية بأطول اسم، بالمقاس الأساسي — تُقاس ولا تُرى ولا تشغل مكاناً */}
            <span className="vs-probe" ref={probeRef} aria-hidden="true">
              {longest}
            </span>
            <span key={`r${spin}`} className="vs-player">
              {nameOf(0, display[0])}
            </span>
          </div>
          <div className="vs">
            <span className="vs-word">ضد</span>
            <span className="vs-ring" aria-hidden="true" />
          </div>
          <div className="vs-slot">
            <span key={`l${spin}`} className="vs-player">
              {nameOf(1, display[1])}
            </span>
          </div>
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
        /* العرض الكامل شرط: بلا width تتقلّص الحاوية على محتواها فتضيق خانتا الاسمين
           ويُقصّ الاسم الطويل مهما صغّرنا الخط. */
        .vs-wrap {
          display:flex; align-items:center; justify-content:center;
          width:100%; gap:clamp(12px,3vw,48px);
        }

        /* خانة ثابتة العرض: بدونها يتراقص «ضد» يميناً وشمالاً مع كل اسم بطول مختلف. */
        .vs-slot {
          position:relative;
          flex:1 1 0; min-width:0; display:flex; justify-content:center;
          overflow:hidden; padding:.18em 0;
        }

        .vs-probe {
          position:absolute; top:0; inset-inline-start:0;
          visibility:hidden; pointer-events:none; white-space:nowrap;
          font-size:clamp(30px,6vw,68px); font-weight:800;
        }
        .vs-player {
          display:block; text-align:center; line-height:1.15;
          /* شبكة أمان: اسم من كلمة واحدة أطول من الخانة حتى بعد بلوغ حدّ التصغير
             يلتفّ بدل أن يُبتر. البتر يخفي حرفاً من اسم لاعب — والالتفاف لا يخفي شيئاً. */
          overflow-wrap:anywhere;
          /* البديل هو قيمة clamp نفسها المحسوبة في fit() أعلاه، لتُستخدم قبل أول قياس */
          font-size:var(--vs-size, clamp(30px,6vw,68px));
          font-weight:800; color:var(--cream);
          animation:reel-step .16s ease-out;
        }
        /* الاسم يهبط من فوق كبكرة تدور */
        @keyframes reel-step {
          from { transform:translateY(-70%); opacity:.15; filter:blur(4px); }
          to   { transform:none; opacity:1; filter:none; }
        }
        .vs-wrap.settled .vs-player {
          color:var(--gold);
          animation:slam .5s var(--ease-spring);
          text-shadow:0 0 34px rgba(255,189,89,.5);
        }
        @keyframes slam {
          0%   { transform:scale(1.5); opacity:.2; filter:blur(6px); }
          60%  { transform:scale(.97); opacity:1; filter:none; }
          100% { transform:scale(1.06); }
        }

        .vs { position:relative; display:grid; place-items:center; flex:none; }
        .vs-word { color:var(--coral); font-weight:800; font-size:clamp(22px,3.4vw,40px); }
        .vs-wrap.settled .vs-word { animation:clash .55s var(--ease-spring); }
        @keyframes clash {
          0%   { transform:scale(1); }
          35%  { transform:scale(1.55); }
          100% { transform:scale(1); }
        }
        /* حلقة تتمدّد وتتلاشى لحظة الاستقرار — إشارة «وقع الاختيار» */
        .vs-ring {
          position:absolute; width:2.2em; height:2.2em; border-radius:50%;
          border:2px solid var(--coral); opacity:0; pointer-events:none;
        }
        .vs-wrap.settled .vs-ring { animation:ring-out .75s ease-out; }
        @keyframes ring-out {
          from { transform:scale(.5); opacity:.85; }
          to   { transform:scale(3.4); opacity:0; }
        }
        @media (max-width:560px) { .vs-wrap { gap:12px; } }
        .not-picked { display:flex; gap:16px; }
        .np-col { flex:1; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); padding:12px 16px; }
        .np-title { color:var(--text-2); font-weight:700; font-size:14px; margin-bottom:4px; }
        .np-names { color:var(--text-3); font-size:15px; }
      `}</style>
    </div>
  )
}
