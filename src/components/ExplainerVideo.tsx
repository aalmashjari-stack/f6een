import { useEffect, useRef, useState } from 'react'

/**
 * فيديو شرح اللعبة، بهيئتين (قرار علي ٢٩ سبتمبر ٢٠٢٦):
 * - **الموقع:** ظاهرٌ تحت بطاقات المراحل (`ExplainerInline`) — زائر الموقع
 *   أحوج الناس إلى الشرح. صورةُ غلافٍ وعليها ▶، والفيديو لا يُحمَّل إلّا
 *   بالضغط (`preload="none"`): الإعداد يُفتح كلّ لعبة فلا يثقل.
 * - **التطبيق:** زرّ «شاهد الشرح» جنب «مراحل اللعبة» يفتح نافذة (`ExplainerVideo`).
 *
 * **الملفّ منّا لا من يوتيوب** (قرار علي ٣٠ سبتمبر ٢٠٢٦، للجودة): يوتيوب
 * يعيد الضغط ويبدأ بجودةٍ دنيا، والفيلم خطوطُ حبرٍ ونصوص. `public/explainer.mp4`
 * بـ1080p (H.264، CRF 24، نحو 12MB، faststart) — الموقع يخدمه من f6een.com
 * خلف Cloudflare، والتطبيق من حزمته بلا شبكة. ويوتيوب باقٍ للنشر لا للعرض.
 * المصدر في ~/Documents/f6een-explainer-video (film.html).
 */
const SRC = '/explainer.mp4'
const POSTER = '/explainer-poster.jpg'

/** إطار المشغّل بلغة الكتل — للنافذة وللصفحة معاً. */
const FRAME_CSS = `
        .xv-frame {
          aspect-ratio:16 / 9; border-radius:18px; overflow:hidden; background:#000;
          box-shadow:0 0 0 3px var(--n-ink, #22201C), 7px 8px 0 var(--n-ink, #22201C);
        }
        .xv-frame video { display:block; width:100%; height:100%; background:#000; }
`

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
      <div className="xv-panel" role="dialog" aria-label="فيديو شرح اللعبة" onClick={(e) => e.stopPropagation()}>
        <button className="xv-x" onClick={onClose} aria-label="إغلاق">✕</button>
        <div className="xv-frame">
          <video ref={video} src={SRC} poster={POSTER} autoPlay controls playsInline />
        </div>
      </div>

      <style>{`
        .xv-veil {
          position:fixed; inset:0; z-index:60;
          display:flex; align-items:center; justify-content:center;
          padding:clamp(12px,3dvh,40px) clamp(12px,3vw,40px);
          background:rgba(20,16,10,.62);
        }
        /* الإطار بنسبة الفيديو ويتّسع لأكبر ما تسمح به الشاشة في الاتّجاهين */
        .xv-panel {
          position:relative;
          width:min(1100px, 100%, calc((100dvh - 2 * clamp(12px,3dvh,40px) - 56px) * 16 / 9));
          margin-top:52px; /* مكان ✕ فوقه */
        }
        ${FRAME_CSS}
        .xv-x {
          /* فوق الإطار من داخل حدّه: على حافّته كان يخرج من الشاشة في الجوال الطوليّ */
          position:absolute; top:-52px; inset-inline-end:0; z-index:1;
          font:inherit; font-weight:800; cursor:pointer;
          width:40px; height:40px; border:0; border-radius:50%;
          background:var(--n-surface, #fff); color:var(--n-ink, #22201C);
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 3px 4px 0 var(--n-ink, #22201C);
        }
      `}</style>
    </div>
  )
}

function PlayingVideo() {
  const video = usePlayNow()
  return <video ref={video} src={SRC} poster={POSTER} autoPlay controls playsInline />
}

/** الموقع: الفيديو في الصفحة نفسها، غلافٌ حتى يُضغط. */
export function ExplainerInline() {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="xi-wrap">
      <div className="xv-frame xi-frame">
        {playing ? (
          <PlayingVideo />
        ) : (
          <button className="xi-poster" onClick={() => setPlaying(true)} aria-label="شغّل فيديو شرح اللعبة">
            <img src={POSTER} alt="" />
            <span className="xi-play" aria-hidden="true">▶</span>
          </button>
        )}
      </div>

      <style>{`
        /* نحو 55٪ من عرض الشاشة في الوسط، على مثالٍ أرسله علي («خله بنفس الحجم»،
           ٣٠ سبتمبر ٢٠٢٦) — وبعرض الصفحة في الضيّق، حيث 55٪ تصغر عن القراءة. */
        .xi-wrap { width:100%; margin-inline:auto; margin-top:clamp(14px,2.4dvh,24px); }
        @media (min-width:900px) { .xi-wrap { width:min(100%, 55vw); } }
        ${FRAME_CSS}
        .xi-poster { all:unset; position:relative; display:block; width:100%; height:100%; cursor:pointer; }
        .xi-poster img { display:block; width:100%; height:100%; object-fit:cover; }
        /* زرّ التشغيل بلغة الكتل: دائرةٌ بلون العلامة بحدّ حبرٍ وظلٍّ صلب */
        .xi-play {
          position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
          width:clamp(58px,9vw,84px); height:clamp(58px,9vw,84px); border-radius:50%;
          display:grid; place-items:center; padding-inline-start:.12em;
          font-size:clamp(24px,3.6vw,34px); color:#fff; background:var(--n-brand, #E8542F);
          box-shadow:0 0 0 3px var(--n-ink, #22201C), 5px 6px 0 var(--n-ink, #22201C);
          transition:transform .16s var(--ease-spring);
        }
        .xi-poster:hover .xi-play { transform:translate(-50%,-50%) scale(1.08); }
        .xi-poster:focus-visible { outline:3px solid var(--n-brand, #E8542F); outline-offset:3px; }
      `}</style>
    </div>
  )
}
