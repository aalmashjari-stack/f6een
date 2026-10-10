import { useEffect, useRef, useState } from 'react'
import frameCss from './ExplainerVideo.frame.css?inline'
import explainerVideoCss from './ExplainerVideo.css?inline'
import explainerInlineCss from './ExplainerVideo.inline.css?inline'

/**
 * فيديو شرح اللعبة، بهيئتين (قرار علي ٢٩ سبتمبر ٢٠٢٦):
 * - **الموقع:** ظاهرٌ تحت بطاقات المراحل (`ExplainerInline`) — زائر الموقع
 *   أحوج الناس إلى الشرح. غلافٌ أسود وعليه ▶ (علي ٣٠ سبتمبر ٢٠٢٦: «خلّ
 *   الـcover أسود» — كانت لقطةً من الفيلم)، والفيديو لا يُحمَّل إلّا
 *   بالضغط (`preload="none"`): الإعداد يُفتح كلّ لعبة فلا يثقل.
 * - **التطبيق:** زرّ «شاهد الشرح» جنب «مراحل اللعبة» يفتح نافذة (`ExplainerVideo`).
 *
 * **الملفّ منّا لا من يوتيوب** (قرار علي ٣٠ سبتمبر ٢٠٢٦، للجودة): يوتيوب
 * يعيد الضغط ويبدأ بجودةٍ دنيا، والفيلم خطوطُ حبرٍ ونصوص. `public/explainer-v4.mp4`
 * بـ1080p (H.264، CRF 24، نحو 12MB، faststart) — الموقع يخدمه من f6een.com
 * خلف Cloudflare، والتطبيق من حزمته بلا شبكة. ويوتيوب باقٍ للنشر لا للعرض.
 * المصدر في ~/Documents/f6een-explainer-video (film-v4.html: v3 بالخلفيّة الرماديّة).
 * **من استبدله غيّر اسمه** — Cloudflare يُبقي القديم يوماً باسمه.
 */
const SRC = '/explainer-v4.mp4'

/**
 * تشغيلٌ من الشيفرة لحظة التركيب: WKWebView في التطبيق يتجاهل `autoPlay`
 * بالصوت فيبقى زرّ ▶ الأصليّ ينتظر ضغطةً ثانية (مقيس على المحاكي ٣٠ سبتمبر)،
 * أمّا `play()` بعد الضغطة مباشرةً فيعدّها WebKit من فعل اللاعب.
 */
function usePlayNow() {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [])
  return ref
}

export function ExplainerVideo({ onClose }: { onClose: () => void }) {
  const video = usePlayNow()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="xv-veil" onClick={onClose}>
      <div
        className="xv-panel"
        role="dialog"
        aria-label="فيديو شرح اللعبة"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="xv-x" onClick={onClose} aria-label="إغلاق">
          ✕
        </button>
        <div className="xv-frame">
          <video ref={video} src={SRC} autoPlay controls playsInline />
        </div>
      </div>

      <style>{frameCss + explainerVideoCss}</style>
    </div>
  )
}

function PlayingVideo() {
  const video = usePlayNow()
  return <video ref={video} src={SRC} autoPlay controls playsInline />
}

/** الموقع: الفيديو في الصفحة نفسها، غلافٌ حتى يُضغط. */
export function ExplainerInline() {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="xi-wrap">
      <div className="xi-tv">
        <div className="xv-frame xi-frame">
          {playing ? (
            <PlayingVideo />
          ) : (
            <button className="xi-poster" onClick={() => setPlaying(true)} aria-label="شغّل فيديو شرح اللعبة">
              <span className="xi-play" aria-hidden="true">
                ▶
              </span>
            </button>
          )}
        </div>
      </div>

      <style>{frameCss + explainerInlineCss}</style>
    </div>
  )
}
