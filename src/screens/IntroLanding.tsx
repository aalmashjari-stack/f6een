import { useRef, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { categoryArt } from '../components/categoryArt'
import css from './IntroLanding.css?inline'

/**
 * صفحة الهبوط — ما يراه الزائر قبل الدخول (علي ٢ نوفمبر ٢٠٢٦: «اعد تصميم
 * هذه الصفحة»، ثمّ «صفحة هبوط كاملة»، واعتُمدت من معاينة).
 *
 * شاشةٌ واحدة لا غير (علي: «لا اريد في صفحة الهبوط سوا هذه الشاشة امسح كل
 * الي تحت»): العنوان والزرّ يميناً، والفيديو في تلفزيون يساراً. سقطت بعدها
 * المراحل والفئات والختام والروابط. النصوص نصوص علي من الشاشة السابقة.
 * والأزرار كلّها تفتح صفحة الدخول نفسها — لا طريق إلى اللعبة بلا حساب.
 */

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
      </main>
      <style>{css}</style>
    </div>
  )
}
