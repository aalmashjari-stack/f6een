import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../game/bank'
import { CATEGORY_ART } from './categoryArt'
import { play } from '../audio/sfx'

/**
 * اختيار التصنيف — بديل العجلة. بطاقة لكل تصنيف والضوء يلفّ عليها ثم يستقرّ.
 *
 * يحفظ قواعد القسم ٧ كما هي:
 * - المستهلَك يبقى ظاهراً باهتاً لا يختفي (شفافية، ومنع تهمة التلاعب).
 * - السحبة نهائية بلا إعادة.
 * - الانتقال للسؤال تلقائي بعد الاستقرار، بلا ضغطة وبلا شاشة وسيطة.
 *
 * شبكة ببطاقات مصوّرة — قرار علي في ٥ أغسطس ٢٠٢٦: صورة لكل تصنيف،
 * الاسم تحتها، والبطاقات متجاورة بلا تعشيق خلية النحل. النص يبقى أفقياً
 * فيحفظ شرط الوضوح الذي أسقط القرص الدوّار (القسم ١).
 *
 * صارت ٤×٣ في ٧ أغسطس ٢٠٢٦ مع إضافة التصنيفات الثلاثة (٩ ← ١٢). التوسّع
 * أفقيّ لا رأسيّ عمداً: الشاشة عريضة، والصفوف الثلاثة هي ما بُني عليه حساب
 * ارتفاع البطاقة أدناه — فصفٌّ رابع كان يقتضي إعادة الحساب كلّه ويصغّر الصور.
 */

export function CategoryPicker({
  spent,
  onResult,
  eyebrow,
}: {
  spent: string[]
  onResult: (category: string) => void
  eyebrow: React.ReactNode
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

      <div className="grid-wrap grow">
        <div
          className="cat-grid"
          style={
            {
              // نستهدف ثلاثة صفوف دائماً: الأعمدة تكبر مع الفئات فتبقى البطاقة
              // بحجمها ولا تُقصّ الأسماء. ‏١٢ فئة ← ٤ أعمدة (٤×٣ كما أُقرّت)،
              // ‏١٣ ← ٥ أعمدة (٥+٥+٣) بدل صفٍّ رابع فيه بطاقة يتيمة.
              '--cols': Math.ceil(CATEGORIES.length / 3),
              '--rows': Math.ceil(CATEGORIES.length / Math.ceil(CATEGORIES.length / 3)),
            } as React.CSSProperties
          }
        >
          {CATEGORIES.map((cat, i) => {
            const isSpent = spent.includes(cat)
            const isCursor = cursor === i && !landed
            const isLanded = landed === cat
            return (
              <div
                key={cat}
                className={
                  'cat' +
                  (isSpent ? ' spent' : '') +
                  (isCursor ? ' cursor' : '') +
                  (isLanded ? ' landed' : '')
                }
              >
                <span
                  className="cat-img"
                  style={{ '--art': `url(${CATEGORY_ART[cat]})` } as React.CSSProperties}
                />
                <span className="cat-name">{cat}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* حُذف سطر «السحبة نهائية — بلا إعادة» في ٦ أغسطس ٢٠٢٦ بقرار علي.
          القاعدة قائمة في المحرّك: لا زرّ لإعادة السحبة أصلاً. */}
      <div className="stack gap-s">
        <button
          className={'action compact' + (landed ? ' landed' : '')}
          onClick={start}
          disabled={running || landed !== null || available.length === 0}
        >
          {/* «ابدأ» في المرحلتين معاً: لفظ واحد لفعل واحد. الحكم يشغّل ثلاث مراحل،
              واختلاف اللفظ بين شاشتين متطابقتين يجعله يتردّد قبل الضغط. */}
          {landed ? landed : running ? '…' : 'ابدأ'}
        </button>
      </div>

      <style>{`
        .picker { flex:1; min-height:0; display:flex; flex-direction:column; gap:clamp(10px,1.8vh,18px); }

        /* الزر يحمل اسم التصنيف لحظة الاستقرار — وهي أهم لحظة في الشاشة,
           فلا يجوز أن يرثها بهتانُ الزر المعطَّل. */
        .action.landed:disabled { opacity:1; filter:none; box-shadow:var(--lift), var(--glow-gold); }
        .grid-wrap { display:flex; align-items:center; justify-content:center; min-height:0; }

        /* هذه الشاشة وحدها تتنازل عن جزء من هامشها الرأسي: البطاقات التسع
           تتنافس على ارتفاع واحد، وكل بكسل يعود إليها يكبّر الصورة ويقلّل قصّها. */
        .screen:has(.picker) { padding-block: clamp(16px, 3vh, 28px); }

        .cat-grid {
          /* ما فوق الشبكة وتحتها ثابت بالبكسل (الاسم والزر والشريط) ولا يتقلّص
             مع الشاشة، فنسبة vh وحدها تقصّ الصف الأخير على الشاشات القصيرة.
             الارتفاع المتبقّي يُقسم على صفّين ونصف: 2×cw هو ارتفاع صور ٣:٢ الثلاثة.
             و max الخارجي أرضية نجاة: تحت ٤٣٦ بكسل ارتفاعاً كان الطرح يصير سالباً
             فينهار عرض البطاقة إلى صفر وتختفي الشبكة كاملةً — لا تصغر بل تختفي.
             ‏--rows (من JS = ceil(عدد الفئات ∕ ٤)) يجعل الحدّ الرأسي يتكيّف مع
             عدد الصفوف: R صفوفٍ من صور ٣:٢ ارتفاعها (2R∕3)×cw، فالحدّ ×٣∕(٢R).
             كان ثابتاً على ٣ صفوف، فيُقصّ صفٌّ رابع خلف الزر عند زيادة الفئات. */
          --cols: 4; --rows: 3;
          /* عرض العمود محدود بثلاثة: عرض الشاشة مقسوماً على الأعمدة (فلا فيض
             أفقي مهما كثرت)، وارتفاع صفوف الصور، وسقفٌ مطلق. */
          --cw: max(64px, min(
            calc(92vw / var(--cols)),
            calc((100vh - 436px) * 3 / (2 * var(--rows))),
            340px));
          --gap: clamp(8px, .9vw, 11px);
          display:grid;
          grid-template-columns:repeat(var(--cols), var(--cw));
          gap:var(--gap);
        }

        .cat {
          display:flex; flex-direction:column;
          border-radius:18px; overflow:hidden;
          background:linear-gradient(165deg, var(--surface-2), var(--surface));
          box-shadow:0 8px 18px rgba(0,0,0,.3);
          transition:transform .2s var(--ease-spring), box-shadow .25s ease, filter .25s ease, opacity .25s ease;
        }
        .cat.cursor, .cat.landed { z-index:2; }

        /* الصورة تملأ صدر البطاقة، وفوقها طبقة صبغ (--tint) تتبدّل مع الحالة.
           الصبغ الساكن ليليّ خفيف يوحّد الصور مع بقية الشاشة. */
        .cat-img {
          display:block; width:100%;
          /* المصدر مربّع، فكلّما اقترب الإطار من المربّع قلّ المقصوص منه:
             ٣:٢ يُظهر ثلثي الصورة بدل نصفها، والمشهد يُقرأ لا زاويته وحدها. */
          aspect-ratio:3/2;
          --tint:linear-gradient(rgba(11,34,51,.16), rgba(11,34,51,.16));
          background-image:var(--tint), var(--art);
          background-size:cover, cover;
          background-position:center, center;
          background-repeat:no-repeat;
          background-color:var(--surface);
          transition:filter .25s ease;
        }
        .cat-name {
          display:block; text-align:center;
          font-size:clamp(12px, 1.3vw, 17px);
          font-weight:800; line-height:1.2; color:var(--cream);
          /* شريط ضيّق: ما يُوفَّر هنا يذهب إلى الصورة في الصفوف الثلاثة معاً */
          padding:.28em .3em .38em;
          /* سطر واحد دائماً — الالتفاف يرفع ارتفاع الصف فيقصّ الصف الأخير خلف الزر */
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          transition:color .07s linear, background .07s linear;
        }

        /* المستهلَك: ظاهر لكن باهت — لا يختفي. الصورة تفقد لونها معه. */
        .cat.spent { opacity:.55; box-shadow:none; }
        .cat.spent .cat-img { filter:grayscale(1) brightness(.6); }
        .cat.spent .cat-name { color:var(--spent-text); }

        /* الضوء المارّ — يجب أن يُتابَع من آخر المجلس، فالفرق عن البطاقة الساكنة
           غمرة كريمية كاملة لا درجة أفتح بقليل. */
        .cat.cursor { transform:scale(1.07); box-shadow:0 0 30px rgba(245,239,227,.6); }
        .cat.cursor { background:var(--cream); }
        .cat.cursor .cat-img { --tint:linear-gradient(rgba(245,239,227,.55), rgba(245,239,227,.55)); }
        .cat.cursor .cat-name { color:var(--night); }

        /* الاستقرار: البطاقة تلبس الذهبي والصورة تلوح خلف غمرته */
        .cat.landed {
          transform:scale(1.1);
          box-shadow:0 0 26px rgba(255,189,89,.65);
          animation:land .6s var(--ease-spring);
          background:linear-gradient(160deg, #FFCE7B, var(--gold) 60%, #F0A93F);
        }
        .cat.landed .cat-img { --tint:linear-gradient(rgba(255,189,89,.45), rgba(255,189,89,.45)); }
        .cat.landed .cat-name { color:var(--on-gold); }

        @keyframes land {
          0%   { transform:scale(1.05); }
          45%  { transform:scale(1.16); }
          100% { transform:scale(1.1); }
        }

        /* على الجوال يُقلب الترتيب إلى ٣×٤: أربعة أعمدة على شاشة ضيّقة تجعل
           البطاقة أصغر من أن تُقرأ صورتها. والصفوف تصير أربعة فيهبط سقف
           الارتفاع من ٢٠vh إلى ١٥vh حتى لا يخرج الصف الأخير خلف الزر. */
        @media (max-width:560px) {
          .cat-grid { grid-template-columns:repeat(3, var(--cw)); --cw:max(64px, min(30vw, 15vh, 180px)); }
        }

        /* جوال أفقي (~٣٥٠–٤٨٠ بكسل ارتفاعاً): ثلاثة صفوف لا تتّسع مهما صغرت
           البطاقة، فتُقلب الشبكة إلى ٦×٢ — الارتفاع هو الشحيح هنا لا العرض،
           والشاشة تملك عرضاً فائضاً يستوعب ستة أعمدة ببطاقة أكبر لا أصغر.
           الحسبة: الصف = ثلثا العرض (صورة ٣:٢) + ٢٣ لشريط الاسم، وصفّان وفجوة
           يتركان cw = ثلاثة أرباع ما تبقّى. و‏٢٢٤ هو الثابت فوق الشبكة وتحتها
           (الشريط والعنوان والزر والهوامش) بعد أن ضمرت كلها في الاستعلام نفسه. */
        @media (max-height:480px) {
          .cat-grid {
            grid-template-columns:repeat(6, var(--cw));
            --cw:max(56px, min(13vw, calc((100vh - 224px) * 0.75), 150px));
          }
          .picker { gap:clamp(6px,1.2vh,18px); }
          .screen:has(.picker) { padding-block:clamp(8px, 2vh, 28px); }
        }
      `}</style>
    </div>
  )
}
