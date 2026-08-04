import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../game/bank'
import { play } from '../audio/sfx'

/**
 * اختيار التصنيف — بديل العجلة. خلية سداسية والضوء يلفّ عليها ثم يستقرّ.
 *
 * يحفظ قواعد القسم ٧ كما هي:
 * - المستهلَك يبقى ظاهراً باهتاً لا يختفي (شفافية، ومنع تهمة التلاعب).
 * - السحبة نهائية بلا إعادة.
 * - الانتقال للسؤال تلقائي بعد الاستقرار، بلا ضغطة وبلا شاشة وسيطة.
 *
 * سبب استبدال القرص: نص التصنيفات في القطاعات السفلية كان مقلوباً وصعب القراءة،
 * و«وضوح النص شرط تشغيل لا تفضيل جمالي» (القسم ١). السداسي يبقي النص أفقياً.
 */

const ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
]

export function CategoryPicker({
  spent,
  onResult,
  eyebrow,
}: {
  spent: string[]
  onResult: (category: string) => void
  eyebrow: string
}) {
  const [cursor, setCursor] = useState<number | null>(null)
  const [landed, setLanded] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  const available = CATEGORIES.filter((c) => !spent.includes(c))

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function start() {
    if (running || landed || available.length === 0) return
    setRunning(true)

    const target = available[Math.floor(Math.random() * available.length)]
    const targetIdx = CATEGORIES.indexOf(target)

    // الضوء يمرّ على المتاح فقط، ويتباطأ تدريجياً حتى يقف على الهدف.
    const availIdx = CATEGORIES.map((c, i) => (spent.includes(c) ? -1 : i)).filter((i) => i >= 0)
    const startPos = Math.floor(Math.random() * availIdx.length)
    const endPos = availIdx.indexOf(targetIdx)
    const laps = 3
    const steps = laps * availIdx.length + ((endPos - startPos + availIdx.length) % availIdx.length)

    let elapsed = 0
    for (let s = 0; s <= steps; s++) {
      const idx = availIdx[(startPos + s) % availIdx.length]
      // نقرة مع كل قفزة — تتباطأ مع الضوء نفسه، فيُسمع اقتراب السحبة من الاستقرار
      timers.current.push(
        window.setTimeout(() => {
          setCursor(idx)
          play('pickStep')
        }, elapsed),
      )
      // تباطؤ تدريجي: الخطوة تطول كلما اقتربنا من النهاية
      const p = s / steps
      elapsed += 48 + 620 * p * p * p
    }

    timers.current.push(
      window.setTimeout(() => {
        setLanded(target)
        setRunning(false)
        play('pickLand')
        timers.current.push(window.setTimeout(() => onResult(target), 950))
      }, elapsed),
    )
  }

  return (
    <div className="picker">
      <div className="eyebrow center">{eyebrow}</div>

      <div className="comb-wrap grow">
        <div className="comb">
          {ROWS.map((row, r) => (
            <div key={r} className={'comb-row' + (r % 2 === 1 ? ' offset' : '')}>
              {row.map((i) => {
                const cat = CATEGORIES[i]
                const isSpent = spent.includes(cat)
                const isCursor = cursor === i && !landed
                const isLanded = landed === cat
                return (
                  <div
                    key={cat}
                    className={
                      'hex' +
                      (isSpent ? ' spent' : '') +
                      (isCursor ? ' cursor' : '') +
                      (isLanded ? ' landed' : '')
                    }
                  >
                    <span className="hex-face">
                      <span className="hex-name">{cat}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="stack gap-s">
        <button
          className={'action' + (landed ? ' landed' : '')}
          onClick={start}
          disabled={running || landed !== null || available.length === 0}
        >
          {/* «ابدأ» في المرحلتين معاً: لفظ واحد لفعل واحد. الحكم يشغّل ثلاث مراحل،
              واختلاف اللفظ بين شاشتين متطابقتين يجعله يتردّد قبل الضغط. */}
          {landed ? landed : running ? '…' : 'ابدأ'}
        </button>
        {/* لا لفظ يوحي بأن الحكم هو من يختار — التطبيق يسحب، ولا سلطة تقديرية للحكم (المبدأ ٣). */}
        <div className="action-note">السحبة نهائية — بلا إعادة</div>
      </div>

      <style>{`
        .picker { flex:1; min-height:0; display:flex; flex-direction:column; gap:clamp(10px,1.8vh,18px); }

        /* الزر يحمل اسم التصنيف لحظة الاستقرار — وهي أهم لحظة في الشاشة،
           فلا يجوز أن يرثها بهتانُ الزر المعطَّل. */
        .action.landed:disabled { opacity:1; filter:none; box-shadow:var(--lift), var(--glow-gold); }
        .comb-wrap { display:flex; align-items:center; justify-content:center; min-height:0; }

        .comb {
          --hw: min(23vw, 20vh, 210px);   /* عرض السداسي */
          --hh: calc(var(--hw) * 1.1547); /* ارتفاع السداسي المنتظم */
          --gap: clamp(6px, 1vw, 14px);
          display:flex; flex-direction:column; align-items:center;
        }
        .comb-row { display:flex; gap:var(--gap); }
        /* تداخل رأسي بمقدار ربع الارتفاع ليشتبك الصفّان كخلية نحل */
        .comb-row + .comb-row { margin-top: calc(var(--hh) * -0.25 + var(--gap) * 0.5); }
        /* إزاحة الصف الأوسط بنصف خلية */
        .comb-row.offset { margin-inline-start: calc(var(--hw) * 0.5 + var(--gap) * 0.5); }

        /* الصفوف متداخلة رأسياً، فالسداسي المكبَّر يُغطّى بالصف الذي تحته
           ما لم يُرفع فوقه — تظهر قمّته مقصوصة كأنها عطب. */
        .hex {
          position:relative;
          width:var(--hw); height:var(--hh);
          display:grid; place-items:center;
          transition:transform .2s var(--ease-spring), filter .25s ease;
          filter:drop-shadow(0 8px 18px rgba(0,0,0,.3));
        }
        .hex.cursor, .hex.landed { z-index:2; }

        /* الوجه سداسي مدوّر الزوايا — قرار علي في ٥ أغسطس ٢٠٢٦ من أربعة أشكال
           عُرضت عليه: الزوايا الحادّة كانت وحدها الشكل الحادّ في شاشة كل ما فيها
           مدوّر (البطاقات والكبسولات والأزرار).

           قناع SVG لا clip-path: الأخير لا يدوّر الزوايا. المسار محسوب على صندوق
           100×115.47 (نسبة السداسي المنتظم) بنصف قطر ١٥، و preserveAspectRatio='none'
           مع mask-size:100% 100% يمدّه على الخلية — والخلية محفوظة النسبة
           (--hh = --hw × 1.1547) فالتدوير لا يتشوّه مهما تغيّر المقاس.

           الحدود لا تعمل مع القناع كما لا تعمل مع clip-path، فالحالة تُقرأ من
           اللون والحجم والتوهّج. */
        .hex-face {
          width:100%; height:100%;
          display:grid; place-items:center;
          padding:0 18%;
          -webkit-mask-image:url("data:image/svg+xml,<svg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20115.47'%20preserveAspectRatio='none'><path%20d='M37.01%2C7.50%20Q50.00%2C0.00%2062.99%2C7.50%20L87.01%2C21.37%20Q100.00%2C28.87%20100.00%2C43.87%20L100.00%2C71.60%20Q100.00%2C86.60%2087.01%2C94.10%20L62.99%2C107.97%20Q50.00%2C115.47%2037.01%2C107.97%20L12.99%2C94.10%20Q0.00%2C86.60%200.00%2C71.60%20L0.00%2C43.87%20Q0.00%2C28.87%2012.99%2C21.37%20Z'%20fill='%23000'/></svg>");
          mask-image:url("data:image/svg+xml,<svg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20115.47'%20preserveAspectRatio='none'><path%20d='M37.01%2C7.50%20Q50.00%2C0.00%2062.99%2C7.50%20L87.01%2C21.37%20Q100.00%2C28.87%20100.00%2C43.87%20L100.00%2C71.60%20Q100.00%2C86.60%2087.01%2C94.10%20L62.99%2C107.97%20Q50.00%2C115.47%2037.01%2C107.97%20L12.99%2C94.10%20Q0.00%2C86.60%200.00%2C71.60%20L0.00%2C43.87%20Q0.00%2C28.87%2012.99%2C21.37%20Z'%20fill='%23000'/></svg>");
          -webkit-mask-size:100% 100%; mask-size:100% 100%;
          -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;
          background:linear-gradient(160deg, var(--surface-2), var(--surface) 68%);
          /* أقصر من أسرع قفزة للضوء (٤٨ms) وإلا لم يبلغ لونَه كاملاً فبدا باهتاً */
          transition:background .07s linear;
        }
        .hex-name {
          font-size:clamp(13px, 1.75vw, 21px);
          font-weight:800; text-align:center; line-height:1.35; color:var(--cream);
          transition:color .07s linear;
        }

        /* المستهلَك: ظاهر لكن باهت — لا يختفي */
        .hex.spent { filter:none; opacity:.55; }
        .hex.spent .hex-face { background:var(--spent); }
        .hex.spent .hex-name { color:var(--spent-text); }

        /* الضوء المارّ — يجب أن يُتابَع من آخر المجلس، فالفرق عن الخلية الساكنة
           لون كامل لا درجة أفتح بقليل. */
        .hex.cursor { transform:scale(1.09); filter:drop-shadow(0 0 30px rgba(245,239,227,.75)); }
        .hex.cursor .hex-face { background:var(--cream); }
        .hex.cursor .hex-name { color:var(--night); }

        /* الاستقرار */
        .hex.landed {
          transform:scale(1.12);
          filter:drop-shadow(0 0 26px rgba(255,189,89,.65));
          animation:land .6s var(--ease-spring);
        }
        .hex.landed .hex-face { background:linear-gradient(160deg, #FFCE7B, var(--gold) 60%, #F0A93F); }
        .hex.landed .hex-name { color:var(--on-gold); }

        @keyframes land {
          0%   { transform:scale(1.07); }
          45%  { transform:scale(1.2); }
          100% { transform:scale(1.12); }
        }

        @media (max-width:560px) { .comb { --hw:min(29vw, 17vh, 150px); } }
      `}</style>
    </div>
  )
}
