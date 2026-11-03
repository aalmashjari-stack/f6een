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

// صياغة علي حرفيّاً (٣ نوفمبر ٢٠٢٦)، والأرقام لاتينيّة كسائر الواجهة.
const STEPS = ['ادخل بيانات الفريقين', 'اختر الفئات لكل فريق', 'استمتع']

export function SetupOpener({ onStart }: { onStart: () => void }) {
  return (
    <section className="so">
      <div className="so-side">
        <ol className="so-steps">
          {STEPS.map((step, i) => (
            <li key={step} className={`so-step s${i + 1}`}>
              <span className="so-no">{i + 1}</span>
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
