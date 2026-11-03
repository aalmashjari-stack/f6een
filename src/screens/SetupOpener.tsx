import { useLayoutEffect, useRef } from 'react'
import familyArt from '../../assets/backgrounds/setup-family.jpg'
import css from './SetupOpener.css?inline'
import { isNativeApp } from '../lib/platform'

/**
 * افتتاحيّة الإعداد تحت البانر (علي ٢ نوفمبر ٢٠٢٦: «نفس الثيم… تحت البانر
 * بصورتين لفئتين مختلفتين»، واختار «افتتاحيّة مثل الهبوط» بلا نصّ، والزرّ
 * «ينزل للفرق»).
 *
 * الخطوات الثلاث و«ابدأ» يميناً، وصورةٌ مائيّة لعائلةٍ تلعب فطين يساراً (علي ٣ نوفمبر
 * ٢٠٢٦: «ضعها على اليسار وعلى اليمين اكتب…»). في العرض وحده: الجوال
 * الطوليّ يبدأ بالفرق مباشرة.
 */

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

/* أيقونة كلّ خطوة — فريقان، شبكة فئات، بريق — خطوطٌ بلون الحبر على بلاطةٍ
   ملوّنة (علي: «ابدع شوي»). */
const ICONS = [
  <>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16.5" cy="9" r="2.5" />
    <path d="M2.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 14.2c.8-.5 1.6-.7 2.5-.7 2.8 0 5 2.2 5 5" />
  </>,
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </>,
  <>
    <path d="M12 3l2.1 5.4L19.5 10.5l-5.4 2.1L12 18l-2.1-5.4L4.5 10.5l5.4-2.1z" />
    <path d="M19 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </>,
]

// صياغة علي حرفيّاً (٣ نوفمبر ٢٠٢٦)، والأرقام لاتينيّة كسائر الواجهة.
const STEPS = ['ادخل بيانات الفريقين', 'اختر الفئات لكل فريق', 'استمتع']

/* الافتتاحيّة تملأ الشاشة حتى حافّتها السفلى فلا يطلّ ما تحتها (علي ٣ نوفمبر ٢٠٢٦:
   «البطاقة الي تحت لاتخليها تطلع بالشاشة»). تُقاس لا تُقدَّر: ارتفاع الرأس فوقها
   يختلف بين الأجهزة، فتطول بقدر ما يلزم ليبدأ ما بعدها عند حافّة النافذة.
   في الموقع على الشاشات الكبيرة وحدها (علي: «هذا بالموقع بس لاتغير شي في
   الجوال»): لا في التطبيق، ولا في جوالٍ طوليّ أو أفقيّ (ارتفاعه دون 600). */
const BIG = '(min-width: 641px) and (min-height: 600px)'

/** أقرب سلفٍ يتمرّر — في الإعداد `.setup-scroll` لا النافذة. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(p).overflowY)) return p
  }
  return null
}

function useFillViewport() {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.minHeight = ''
      if (isNativeApp || !matchMedia(BIG).matches) return
      const next = el.nextElementSibling
      if (!next) return
      /* المواضع كما لو كان كلّ شيءٍ في أعلاه: يُضاف ما تمرّر داخل الحاوية وفي
         النافذة معاً، وإلّا كبرت الافتتاحيّة بقدر ما نزل اللاعب حين تتغيّر النافذة. */
      const box = scrollParent(el)
      const scrolled = scrollY + (box?.scrollTop ?? 0)
      const bottom = box ? Math.min(innerHeight, box.getBoundingClientRect().bottom + scrollY) : innerHeight
      // هامشٌ صغير: ظلّ الكبسولة التالية وحدّها يطلّان فوق صندوقها.
      const short = bottom + 12 - (next.getBoundingClientRect().top + scrolled)
      if (short > 0) el.style.minHeight = `${el.offsetHeight + short}px`
    }
    fit()
    /* الصورة تغيّر الارتفاع حين تصل، والخطوط حين تُستبدل (قد يطول الرأس فوقها
       بعد القياس الأوّل)، والنافذة حين تتغيّر. */
    let alive = true
    void document.fonts?.ready.then(() => alive && fit())
    const img = el.querySelector('img')
    img?.addEventListener('load', fit)
    addEventListener('resize', fit)
    return () => {
      alive = false
      img?.removeEventListener('load', fit)
      removeEventListener('resize', fit)
    }
  }, [])
  return ref
}

export function SetupOpener({ onStart }: { onStart: () => void }) {
  const ref = useFillViewport()
  return (
    <section className="so" ref={ref}>
      <div className="so-side">
        <ol className="so-steps">
          {STEPS.map((step, i) => (
            <li key={step} className={`so-step s${i + 1}`}>
              <span className="so-tile" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[i]}
                </svg>
                <span className="so-no">{i + 1}</span>
              </span>
              {step}
            </li>
          ))}
        </ol>
        <button className="so-cta" onClick={onStart}>
          ابدأ
          <Arrow />
        </button>
      </div>
      {/* عائلةٌ أمام التلفزيون وعليه لوح اللعبة الحقيقيّ (لقطةٌ مركَّبة في الشاشة)،
          بالأسلوب المائيّ لرسوم الفئات — علي ٣ نوفمبر ٢٠٢٦: «خلها منطقية والشاشة
          تحتوي على صورة من اللعبة». مولَّدة بـFigma AI. */}
      <img className="so-family" src={familyArt} alt="عائلة تلعب فطين في المجلس" />
      <style>{css}</style>
    </section>
  )
}
