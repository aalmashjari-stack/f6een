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
  auto,
}: {
  spent: string[]
  onResult: (category: string) => void
  eyebrow: React.ReactNode
  /**
   * تبدأ السحبةُ وحدها بلا ضغطة — الديربي وحده (قرار علي في ٢٤ أغسطس ٢٠٢٦).
   * هناك يعود الحكم إلى الفئات بعد كل تنقيط، أربع مرّات أو أكثر في المرحلة،
   * فالضغطة تتكرّر بلا أن تحمل قراراً: السحبةُ عشوائية والحكم لا يملك منها
   * شيئاً. أمّا الجولة الجماعية فسحبةٌ واحدة لكل سؤال ويسبقها انتقالُ الدور
   * بين الفريقين، فتبقى الضغطة فاصلاً يلتقط المجلسُ فيه أنفاسه.
   */
  auto?: boolean
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

    // الضوء ينطّ على المتاح عشوائياً، ويتباطأ تدريجياً حتى يقف على الهدف.
    const availIdx = CATEGORIES.map((c, i) => (spent.includes(c) ? -1 : i)).filter((i) => i >= 0)
    const laps = 2
    const steps = laps * availIdx.length

    /**
     * مدّة السحبة مطبَّعة لا محسوبة من مجموع القفزات.
     *
     * كانت كل قفزة تأخذ زمنها الخاص فيتضاعف المجموع مع عدد الفئات: عشرٌ وسبعة
     * أعشار الثانية والشبكة كاملة، واثنتان وستّة أعشار حين لا يبقى إلا ثلاث.
     * فالسحبة الأولى ثقيلة والأخيرة خاطفة — وفي الديربي تتكرّر أربع مرّات أو
     * أكثر. قُلّصت وقُرّبت في ٢٤ أغسطس ٢٠٢٦ بطلب علي.
     *
     * الوزن يحمل شكلَ التباطؤ (تكعيبي، من واحد إلى أربعة عشر كما كان)، ثم
     * تُقسَم المدّةُ على مجموع الأوزان — فيبقى إحساسُ العجلة الواقفة ويتحرّر
     * الزمنُ من عدد القفزات. والحدّان يمنعان الخطف حين تقلّ الفئات والثقل
     * حين تكتمل.
     */
    const weight = (s: number) => 1 + 13 * Math.pow(s / steps, 3)
    let totalWeight = 0
    for (let s = 0; s <= steps; s++) totalWeight += weight(s)
    const spinMs = Math.min(2800, Math.max(1400, 90 * steps))

    /**
     * الضوء ينطّ عشوائياً لا يمشي بالترتيب (طلب علي في ٢٤ أغسطس ٢٠٢٦): المشي
     * المرتّب يكشف الهدفَ قبل بلوغه — من رأى الضوء يتباطأ عرف أين سيقف من
     * بطاقتين أو ثلاث. والنطّ يُبقي الجواب مجهولاً حتى آخر قفزة.
     *
     * قيدان يحفظان أن تُرى كلُّ قفزة: لا تكرار للبطاقة السابقة وإلا بدا الضوء
     * واقفاً، ولا يمسّ الهدفَ في القفزة قبل الأخيرة وإلا بدت اللحظة الحاسمة
     * سكوناً لا استقراراً.
     */
    const pick = (prev: number, isLast: boolean) => {
      if (availIdx.length === 1) return availIdx[0]
      const pool = availIdx.filter((i) => i !== prev && !(isLast && i === targetIdx))
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : availIdx[0]
    }

    let elapsed = 0
    let prev = -1
    for (let s = 0; s <= steps; s++) {
      const idx = s === steps ? targetIdx : pick(prev, s === steps - 1)
      prev = idx
      // نقرة مع كل قفزة — تتباطأ مع الضوء نفسه، فيُسمع اقتراب السحبة من الاستقرار
      timers.current.push(
        window.setTimeout(() => {
          setCursor(idx)
          play('pickStep')
        }, elapsed),
      )
      elapsed += (weight(s) / totalWeight) * spinMs
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

  /**
   * السحبة التلقائية تتأخّر لحظةً بعد الرسم: لو انطلق الضوءُ مع ظهور الشبكة
   * لبدا وكأن الشاشة سبقت المجلس، ولم يلحق أحدٌ أن يرى ما الفئات المتاحة قبل
   * أن تُختار واحدة.
   *
   * ومؤقّتُها خارج timers وله تنظيفُه: تشغيل الأثر مرّتين في التطوير يمسح ما
   * في timers بينهما، فلو كان فيها لَما بقي منه شيء ولم تبدأ السحبة أبداً.
   * وبهذا التنظيف يحيا مؤقّتٌ واحد لا أكثر، ويحرس start نفسَه بـrunning.
   */
  useEffect(() => {
    if (!auto || available.length === 0) return
    const t = window.setTimeout(start, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

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
                <span className="cat-index tabular">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className="cat-img"
                  // فئة بلا صورة بعد: نترك --art معطّلاً بدل url(undefined) — وإلا
                  // طلب المتصفّح مساراً وهمياً وفشل. الصبغة فوق --surface تكفي
                  // ريثما تصل الصورة، فتبقى البطاقة قابلة للّعب لا مكسورة.
                  style={
                    CATEGORY_ART[cat]
                      ? ({ '--art': `url(${CATEGORY_ART[cat]})` } as React.CSSProperties)
                      : undefined
                  }
                />
                <span className="cat-name">{cat}</span>
                <span className="cat-status">{isSpent ? 'خرجت' : isLanded ? 'اختيرت' : 'متاحة'}</span>
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
          disabled={auto || running || landed !== null || available.length === 0}
        >
          {/* «ابدأ» في المرحلتين معاً: لفظ واحد لفعل واحد. الحكم يشغّل ثلاث مراحل،
              واختلاف اللفظ بين شاشتين متطابقتين يجعله يتردّد قبل الضغط.
              وفي الديربي لا فعل — الشريطُ يبقى مكانه ليحمل اسم الفئة لحظة
              الاستقرار (أهمّ ما في الشاشة)، ولئلّا يقفز ما تحته حين يختفي. */}
          {landed ? landed : running ? '…' : auto ? 'تُسحب الفئة…' : 'ابدأ'}
        </button>
      </div>

      <style>{`
        .picker { flex:1; min-height:0; display:flex; flex-direction:column; gap:clamp(8px,1.6vh,20px); }

        /* الزر يحمل اسم التصنيف لحظة الاستقرار — وهي أهم لحظة في الشاشة,
           فلا يجوز أن يرثها بهتانُ الزر المعطَّل. */
        .action.landed:disabled { opacity:1; filter:none; box-shadow:var(--lift), var(--glow-gold); }
        .grid-wrap {
          flex:1; min-height:0; display:flex; align-items:center; justify-content:center;
          padding-block:clamp(4px,1vh,12px);
        }

        /* هذه الشاشة وحدها تتنازل عن جزء من هامشها الرأسي: البطاقات التسع
           تتنافس على ارتفاع واحد، وكل بكسل يعود إليها يكبّر الصورة ويقلّل قصّها. */
        .screen:has(.picker) {
          padding-block:clamp(12px,2.4vh,28px);
          overflow:hidden;
        }

        /* الشبكة تملأ ما تركه لها الصفّ المرن (.grid-wrap) بالضبط: أعمدة وصفوف
           متساوية بـ1fr، فلا ثابتَ بكسليٍّ يُخمَّن ولا فيضَ مهما تغيّر الارتفاع.
           كانت --cw تُحسب بطرح ثابت (٤٣٦px) من 100vh — والثابت أصغر من الكروم
           الفعلي، فيفيض الصف الأخير خلف الزر على شاشة ٧٢٠. الآن الارتفاع
           مقيسٌ لا مُخمَّن، والعرض محدود بنسبة البطاقة فلا تتمدّد بشعاً. */
        .cat-grid {
          --cols: 4; --rows: 3;
          --gap:clamp(10px,1.1vw,24px);
          display:grid;
          grid-template-columns:repeat(var(--cols), 1fr);
          grid-template-rows:repeat(var(--rows), 1fr);
          gap:var(--gap);
          /* الارتفاع هو المرجع والعرض يتبعه بالنسبة: البطاقة صورةٌ ٣:٢ وتحتها
             شريط اسم، فنصيبها الرأسي ≈٢٫٤ مقابل ٣ عرضاً. وحين يضيق العرض
             يغلب max-width فتتقلّص البطاقات بدل أن تفيض أفقياً. */
          height:100%;
          aspect-ratio:calc(var(--cols) * 3) / calc(var(--rows) * 2.4);
          max-width:100%;
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
          /* تملأ ما بقي من البطاقة بعد شريط الاسم بدل أن تفرض ارتفاعاً بنسبة
             ثابتة: الصفّ صار 1fr مقيساً، فلو بقيت aspect-ratio لتجاوز مجموعُ
             البطاقات ارتفاعَ الشبكة وعاد الفيض من باب آخر. و cover يحفظ
             تناسب الصورة ويقصّ الفائض كما كان. */
          flex:1; min-height:0;
          --tint:linear-gradient(rgba(11,34,51,.16), rgba(11,34,51,.16));
          /* قيمة أوّلية تصمد لو لم تُمرَّر صورة: بدونها يصير var(--art) غير صالح
             فيسقط الإعلان كلّه ومعه الصبغة، لا الصورة وحدها. */
          --art:none;
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
           البطاقة أصغر من أن تُقرأ صورتها. الأعمدة والصفوف وحدها تتبدّل،
           والنسبة تتبعهما تلقائياً. */
        /* ‏!important لأن الأعمدة والصفوف تُكتب inline من JS (تتبع عدد الفئات)،
           والـinline يغلب الورقة مهما خصّصنا المحدّد. */
        @media (max-width:560px) {
          .cat-grid { --cols:3 !important; --rows:4 !important; }
        }

        /* جوال أفقي (~٣٥٠–٤٨٠ بكسل ارتفاعاً): ثلاثة صفوف لا تتّسع مهما صغرت
           البطاقة، فتُقلب الشبكة إلى ٦×٢ — الارتفاع هو الشحيح هنا لا العرض،
           والشاشة تملك عرضاً فائضاً يستوعب ستة أعمدة ببطاقة أكبر لا أصغر.
           صفّان بستّة أعمدة، والمقاس يتبع الارتفاع المقيس كما في الحالة العامة. */
        @media (max-height:480px) {
          .cat-grid { --cols:6 !important; --rows:2 !important; }
          .picker { gap:clamp(6px,1.2vh,18px); }
          .screen:has(.picker) { padding-block:clamp(8px, 2vh, 28px); }
        }
      `}</style>
    </div>
  )
}
