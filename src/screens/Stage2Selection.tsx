import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pickDerbyPair, type GameState } from '../game/session'
import type { Action } from '../game/reducer'
import type { TeamId } from '../game/types'
import { ScoreBar } from '../components/ScoreBar'
import stage2SelectionCss from './Stage2Selection.css?inline'

/**
 * اختيار لاعبَي الديربي — الشاشة ٤. بلا زر، تنتقل تلقائياً.
 * اختيار عشوائي بحركة تشويق، ضمن الدورة الكاملة (s2Rem) ومن المواجهات التي لم
 * تقع بعد (s2Pairs) — القاعدة في `pickDerbyPair` لا هنا.
 *
 * **حُذف لوحُ «لم يُختر بعد» في ٤ سبتمبر ٢٠٢٦** بقرار علي. كان يعرض من بقي
 * دورُه في كلّ فريق خدمةً لشفافية الدورة — والدورةُ يحرسها المحرّك لا
 * الشاشة (s2Rem)، والاسمان هما موضوع الشاشة.
 */
export function Stage2Selection({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const timers = useRef<number[]>([])
  const targetRef = useRef<[number, number]>(pickDerbyPair(state))
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
      /* الحجم المثاليّ يُقرأ من المسبار لا يُعاد حسابه هنا. الحلقة التي كان
         يُخشى منها تقع لو قرأنا حجم الاسم *بعد* أن نكتبه؛ أمّا المسبار فحجمه
         من CSS ولا نكتب فيه شيئاً. وبهذا تصير الصيغة في مكان واحد: من غيّر
         حجم الأسماء في CSS — ومنها هويّة نيو — تبعه القياس تلقائياً. */
      const base = parseFloat(getComputedStyle(probe).fontSize)
      if (!base) return
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
          window.setTimeout(() => dispatch({ t: 'S2_SELECT', sel: targetRef.current, at: Date.now() }), 1500),
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
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} />

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

      <style>{stage2SelectionCss}</style>
    </div>
  )
}
