import familyArt from '../../assets/backgrounds/setup-family.jpg'
import css from './SetupOpener.css?inline'

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

export function SetupOpener({ onStart }: { onStart: () => void }) {
  return (
    <section className="so">
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
