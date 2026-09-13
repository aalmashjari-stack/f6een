import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/session'
import { stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ALPHABET, firstLetter } from '../game/letters'
import { ScoreBar } from '../components/ScoreBar'
import { play } from '../audio/sfx'

/**
 * بلاطة الحروف — بين لوح الجولة الجماعية وسؤال فئة «حروف» (قرار علي ١٣
 * سبتمبر ٢٠٢٦). ثمانيةٌ وعشرون حرفاً، وضوءٌ يجري عليها سريعاً ثمّ يتباطأ
 * ويقف على حرفٍ، فيظهر السؤال وجوابُه يبدأ به.
 *
 * **الضوء يقف حيث قرّر المحرّك لا حيث شاء الحظّ:** السؤال سُحب في `S1_PICK`
 * وحرفُه مشتقٌّ من جوابه (`letters.ts`)؛ الشاشة تعرض قرعةً والنتيجة معلومة —
 * وإلّا وقف الضوء على حرفٍ لا سؤال له في هذا المستوى أمام المجلس.
 *
 * بلا زرّ، تنتقل تلقائياً كاختيار لاعبَي الديربي. والمؤقّت لا يبدأ إلّا
 * حين تقف: `S1_LETTER_DONE` يحمل `at` لحظتَها لا لحظة الضغط على الخليّة.
 */
const SLOW_STEPS = 10 // آخر القفزات التي تتباطأ — التباطؤ هو التشويق لا السرعة
const FAST_MS = 38
const SLOWEST_MS = 330
const SETTLE_MS = 1300
/** ألوان البلاطات بالتناوب: أصفر · أبيض · تركواز — ألوان الهويّة نفسها. */
const TONES = ['a', 'w', 'b'] as const

export function Stage1Letter({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const q = state.currentQuestion!
  const target = firstLetter(q.answer)

  const [lit, setLit] = useState<number>(() => Math.floor(Math.random() * ALPHABET.length))
  const [landed, setLanded] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    /* جوابٌ بلا حرفٍ عربيّ لا يصل إلى هنا (المخفّض يتجاوز الطور)، لكن لو
       وصل فلا تُعلَّق الجلسة على شاشةٍ بلا مخرج. */
    const targetIdx = target ? ALPHABET.indexOf(target) : -1
    if (targetIdx < 0) {
      dispatch({ t: 'S1_LETTER_DONE', at: Date.now() })
      return
    }
    /* دورةٌ كاملة على الأقلّ ثمّ المسافة إلى الحرف — فيمرّ الضوء على
       الأبجديّة كلّها قبل أن يقف، ولا يقف قصيراً على حرفٍ قريب. */
    let idx = lit
    const total = ALPHABET.length + ((targetIdx - idx + ALPHABET.length) % ALPHABET.length)
    let n = 0
    const hop = () => {
      n++
      idx = (idx + 1) % ALPHABET.length
      setLit(idx)
      if (n >= total) {
        setLanded(true)
        play('pickLand')
        timers.current.push(
          window.setTimeout(() => dispatch({ t: 'S1_LETTER_DONE', at: Date.now() }), SETTLE_MS),
        )
        return
      }
      const remaining = total - n
      let delay = FAST_MS
      if (remaining < SLOW_STEPS) {
        const p = (SLOW_STEPS - remaining) / SLOW_STEPS
        delay = FAST_MS + (SLOWEST_MS - FAST_MS) * p * p
        play('pickStep')
      }
      timers.current.push(window.setTimeout(hop, delay))
    }
    timers.current.push(window.setTimeout(hop, 300))
    const t = timers.current
    return () => t.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen">
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} turnTeam={owner} />

      <div className="letters-wrap grow">
        <div className={'letters-grid' + (landed ? ' landed' : '')} dir="rtl">
          {ALPHABET.map((l, i) => (
            /* لونُ البلاطة وميلُها من موضعها لا من الحرف: ثلاثة ألوان تتناوب
               قطريّاً (كرسمة الفئة نفسها) وميلٌ بين ‎-1.8‎ و‎+1.8‎ درجة —
               بلاطاتٌ مرصوفةٌ بيدٍ لا شبكةٌ مطبوعة. */
            <div
              key={l}
              className={'ltile' + (i === lit ? ' lit' : '')}
              data-tone={TONES[((i % 7) * 2 + Math.floor(i / 7)) % TONES.length]}
              style={{ '--tilt': `${(((i * 7) % 5) - 2) * 0.9}deg` } as React.CSSProperties}
            >
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* سطرٌ واحد يقول للمجلس ما يجري — يُقرأ مرّةً في الجلسة ثمّ يُفهم من
          الحركة، فهو بحجم ملاحظة الحكم لا عنوان. */}
      <div className="action-note letters-note">{landed ? 'الجواب يبدأ بحرف' : 'الحرف الأوّل من الجواب…'}</div>

      <style>{`
        /* الغلاف حاويةٌ تُقاس: الشبكة تأخذ من ارتفاعه أو عرضه أيّهما أضيق
           (cqh/cqw) بنسبة 7:4 — لا ثابتَ بكسليّ يُخمَّن للشريط فوقها. */
        .letters-wrap {
          flex:1; min-height:0; display:flex; align-items:center; justify-content:center;
          container-type:size;
          padding-block:clamp(4px,1dvh,12px);
        }
        .letters-grid {
          display:grid;
          grid-template-columns:repeat(7, minmax(0,1fr));
          grid-auto-rows:1fr;
          gap:clamp(6px,1.2vw,16px);
          width:min(100cqw, calc(100cqh * 7 / 4.15));
          aspect-ratio:7 / 4.15;
        }
        .ltile {
          display:flex; align-items:center; justify-content:center;
          min-width:0; min-height:0;
          container-type:inline-size;
          border-radius:clamp(9px,1.4dvh,16px);
          border:2px solid var(--gold);
          background:linear-gradient(165deg, var(--surface-2), var(--surface) 68%);
          color:var(--gold);
          box-shadow:var(--lift);
          transform:rotate(var(--tilt, 0deg));
          /* الحركة على الهيئة وحدها: لونٌ يتدرّج بين قفزتين يترك بلاطاتٍ رماديّة
             نصفَ مضاءة خلف الضوء، والقفز يجب أن يكون حادّاً. */
          transition:transform .1s ease-out, box-shadow .1s ease-out;
        }
        .ltile span {
          font-size:54cqi; font-weight:800; line-height:1;
          /* الحرف مفردٌ بلا كلمة — يُرفع قليلاً فوق خطّ القاعدة ليتوسّط البلاطة */
          transform:translateY(-6%);
        }
        /* الضوء الجاري: البلاطة تقفز قليلاً وتنقلب ألوانها */
        .ltile.lit {
          background:var(--gold); color:var(--on-gold, #1b1508);
          transform:rotate(var(--tilt, 0deg)) scale(1.1) translateY(-3%);
        }
        /* الوقوف: البلاطة تصفع (كصفعة اسم الديربي) وتبقى مرفوعة، وحلقةٌ
           تتمدّد منها وتتلاشى — إشارة «وقع الاختيار» نفسها. */
        .letters-grid.landed .ltile.lit {
          position:relative;
          animation:ltile-slam .55s var(--ease-spring) both;
          background:var(--coral); color:var(--cream); border-color:var(--coral);
        }
        .letters-grid.landed .ltile.lit::after {
          content:''; position:absolute; inset:-6%;
          border-radius:inherit; border:3px solid var(--coral);
          pointer-events:none;
          animation:ltile-ring .8s ease-out both;
        }
        .letters-grid.landed .ltile:not(.lit) { opacity:.42; }
        @keyframes ltile-slam {
          0%   { transform:scale(1.6); }
          60%  { transform:scale(.98) rotate(-3deg); }
          100% { transform:scale(1.18) rotate(-3deg); }
        }
        @keyframes ltile-ring {
          from { transform:scale(1); opacity:.9; }
          to   { transform:scale(1.9); opacity:0; }
        }
        .letters-note { flex:none; }
        /* الميل زينةُ الشاشات الواسعة: يُلغى تحت 480px ارتفاعاً فهناك كلُّ
           بكسل محسوب والبلاطات المائلة تتلامس (قاعدة الهويّة ٤). */
        @media (max-height:480px) {
          .letters-wrap { padding-block:2px; }
          .letters-grid { gap:4px; }
          .ltile { border-radius:8px; --tilt:0deg; }
          .letters-note { display:none; }
        }
      `}</style>
    </div>
  )
}
