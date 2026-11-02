import { useRef, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { STAGES } from '../game/stages'
import { categoryArt } from '../components/categoryArt'
import css from './IntroLanding.css?inline'

/**
 * صفحة الهبوط — ما يراه الزائر قبل الدخول (علي ٢ نوفمبر ٢٠٢٦: «اعد تصميم
 * هذه الصفحة»، ثمّ «صفحة هبوط كاملة»، واعتُمدت من معاينة).
 *
 * افتتاحيّةٌ تملأ الشاشة (العنوان والزرّ يميناً، والفيديو في تلفزيون يساراً)،
 * ثمّ المراحل بشرحها ظاهراً، ثمّ صفّان من الفئات يجريان، ثمّ ختامٌ بالزرّ.
 * النصوص نصوص علي من الشاشة السابقة و`STAGES`، إلّا سطرَي الفئات والختام.
 * والأزرار كلّها تفتح صفحة الدخول نفسها — لا طريق إلى اللعبة بلا حساب.
 */

const WALL_A = [
  'الكويت',
  'كأس العالم',
  'الزمن الجميل',
  'أعلام دول',
  'سيارات',
  'أنمي',
  'أكلات',
  'مشاهير',
  'ديزني وبيكسار',
]
const WALL_B = [
  'إيموجي',
  'الدوري الإنجليزي',
  'أغاني وطرب',
  'جغرافيا ومعالم',
  'قصص الأنبياء',
  'ألعاب فيديو',
  'موضة وماركات',
  'شعارات',
  'حروف',
]

const SRC = '/explainer-v5.mp4'
const POSTER_AT = 14

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

function LoginIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M3 12h11M10 8l4 4-4 4" />
    </svg>
  )
}

/* رسم كلّ مرحلة بخطّ الحبر نفسه: لوح فئات، لاعبان ضدّ بعض، ساعة. */
function StageArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <svg viewBox="0 0 160 110" aria-hidden="true">
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <rect
              key={c + '-' + r}
              x={14 + c * 46}
              y={14 + r * 44}
              width="38"
              height="36"
              rx="7"
              fill={(c + r) % 2 ? '#7BD3D0' : '#FFCE3C'}
              stroke="#22201C"
              strokeWidth="3"
              opacity={c === 1 && r === 0 ? 0.25 : 1}
            />
          )),
        )}
      </svg>
    )
  if (i === 1)
    return (
      <svg viewBox="0 0 160 110" aria-hidden="true">
        <circle cx="34" cy="40" r="15" fill="#FFCE3C" stroke="#22201C" strokeWidth="3" />
        <path
          d="M10 92c2-18 12-28 24-28s22 10 24 28"
          fill="#FFCE3C"
          stroke="#22201C"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="126" cy="40" r="15" fill="#fff" stroke="#22201C" strokeWidth="3" />
        <path
          d="M102 92c2-18 12-28 24-28s22 10 24 28"
          fill="#fff"
          stroke="#22201C"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="58" y="42" width="44" height="30" rx="15" fill="#E8542F" stroke="#22201C" strokeWidth="3" />
        <text
          x="80"
          y="63"
          textAnchor="middle"
          fontSize="17"
          fontWeight="800"
          fill="#fff"
          fontFamily="Baloo Bhaijaan 2, Cairo"
        >
          ضد
        </text>
      </svg>
    )
  return (
    <svg viewBox="0 0 160 110" aria-hidden="true">
      <rect x="72" y="6" width="16" height="10" rx="3" fill="#22201C" />
      <circle cx="80" cy="60" r="42" fill="#fff" stroke="#22201C" strokeWidth="3" />
      <path
        d="M80 60 L80 18 A42 42 0 0 1 116.4 81 Z"
        fill="#FFB399"
        stroke="#22201C"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="60" r="5" fill="#22201C" />
    </svg>
  )
}

function Hero({ onSignin }: { onSignin: () => void }) {
  const [playing, setPlaying] = useState(false)
  const v = useRef<HTMLVideoElement>(null)
  function play() {
    setPlaying(true)
    const el = v.current
    if (!el) return
    el.currentTime = 0
    el.muted = false
    el.controls = true
    void el.play()
  }
  return (
    <section className="lp-hero">
      <div className="lp-hero-copy">
        <h1 className="lp-title">لعبة ثقافية اجتماعية</h1>
        <p className="lp-sub">هدفها تخلي جمعاتكم اونس و تتكون من 3 مراحل</p>
        <button className="lp-cta" onClick={onSignin}>
          سجل و احصل على لعبة مجانية
          <Arrow />
        </button>
        <ul className="lp-needs" aria-label="كل الي تحتاجه عشان تلعب لعبتنا">
          <li className="t0">فريقين</li>
          <li className="t1">شاشة واحدة</li>
          <li className="t2">حكم</li>
        </ul>
      </div>

      <div className="lp-stage">
        <figure className="lp-tv">
          <div className="lp-screen">
            <video ref={v} src={`${SRC}#t=${POSTER_AT}`} preload="metadata" playsInline muted />
            {!playing && (
              <button className="lp-play" onClick={play} aria-label="شغّل فيديو شرح اللعبة">
                <span className="lp-play-dot" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                  </svg>
                </span>
              </button>
            )}
          </div>
          {!playing && (
            <button className="lp-play-label" onClick={play} tabIndex={-1}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 5.5v13L8 12z" fill="currentColor" />
              </svg>
              شوف الفيديو عشان تفهم اللعبة
            </button>
          )}
        </figure>
        <img className="lp-sticker s1" src={categoryArt('كأس العالم')} alt="" />
        <img className="lp-sticker s2" src={categoryArt('الزمن الجميل')} alt="" />
      </div>
    </section>
  )
}

function Stages() {
  return (
    <section className="lp-section lp-stages-wrap">
      <h2 className="lp-h2">مراحل اللعبة</h2>
      <ol className="lp-stages">
        {STAGES.map((st, i) => (
          <li key={st.name} className={'lp-stage-card tone-' + i}>
            <div className="lp-stage-top">
              <span className="lp-stage-no">{i + 1}</span>
              <StageArt i={i} />
            </div>
            <h3>{st.name}</h3>
            <p>{st.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Row({ cats, rev }: { cats: string[]; rev?: boolean }) {
  const cards = cats.map((c) => (
    <figure className="lp-cat" key={c}>
      <div className="lp-cat-art" style={{ ['--art' as string]: `url("${categoryArt(c)}")` }} />
      <figcaption>{c}</figcaption>
    </figure>
  ))
  return (
    <div className={'lp-row' + (rev ? ' rev' : '')}>
      <div className="lp-track">
        {cards}
        <div className="lp-dup" aria-hidden="true">
          {cards}
        </div>
      </div>
    </div>
  )
}

function Categories() {
  return (
    <section className="lp-section lp-cats-wrap">
      <h2 className="lp-h2">فئات لكل الجمعة</h2>
      <Row cats={WALL_A} />
      <Row cats={WALL_B} rev />
    </section>
  )
}

function Close({ onSignin }: { onSignin: () => void }) {
  return (
    <section className="lp-section">
      <div className="lp-close">
        <BrandLogo className="lp-close-logo" />
        <p className="lp-close-line">جاهزين للجمعة الجاية؟</p>
        <button className="lp-cta" onClick={onSignin}>
          سجل و احصل على لعبة مجانية
          <Arrow />
        </button>
      </div>
    </section>
  )
}

export function IntroLanding({ onSignin }: { onSignin: () => void }) {
  return (
    <div className="lp">
      <header className="lp-bar">
        <BrandLogo className="lp-logo" />
        <button className="lp-login" onClick={onSignin}>
          <LoginIcon />
          تسجيل الدخول
        </button>
      </header>
      <main>
        <Hero onSignin={onSignin} />
        <Stages />
        <Categories />
        <Close onSignin={onSignin} />
      </main>
      <footer className="lp-foot">
        <a href="/privacy.html">سياسة الخصوصية</a>
        <a href="mailto:privacy@f6een.com">privacy@f6een.com</a>
      </footer>
      <style>{css}</style>
    </div>
  )
}
