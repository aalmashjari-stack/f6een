import { useEffect, useRef, useState } from 'react'

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

/** إطار المشغّل بلغة الكتل — للنافذة وللصفحة معاً. */
const FRAME_CSS = `
        .xv-frame {
          aspect-ratio:16 / 9; border-radius:var(--n-r2); overflow:hidden; background:#000;
          box-shadow:var(--n-e3);
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
          <video ref={video} src={SRC} autoPlay controls playsInline />
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
          box-shadow:var(--n-e1);
        }
      `}</style>
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
            <span className="xi-play" aria-hidden="true">▶</span>
          </button>
        )}
      </div>
      </div>

      <style>{`
        /* نحو 55٪ من عرض الشاشة في الوسط، على مثالٍ أرسله علي («خله بنفس الحجم»،
           ٣٠ سبتمبر ٢٠٢٦) — وبعرض الصفحة في الضيّق، حيث 55٪ تصغر عن القراءة. */
        /* فسحةٌ فوقه وتحته (علي: «نزّل الفيديو، خل المساحة واسعة مو كل شي فوق بعض») */
        .xi-wrap { width:100%; margin-inline:auto; margin-block:clamp(36px,7dvh,72px) clamp(20px,4dvh,44px); }
        @media (min-width:900px) { .xi-wrap { width:min(100%, 55vw); } }
        /* إطارٌ أسود وحده (علي ٣٠ سبتمبر ٢٠٢٦: «شيل اطار التلفزيون وخله اطار
           اسود بس») — بلا قاعدة ولا نقطة كاميرا ولا ظلّ على الأرضيّة. */
        .xi-tv {
          padding:clamp(4px,.6vw,8px);
          border-radius:var(--n-r2); background:#000;
        }
        .xi-tv .xv-frame { border-radius:var(--n-r1); box-shadow:none; }
        ${FRAME_CSS}
        .xi-poster { all:unset; position:relative; display:block; width:100%; height:100%; cursor:pointer; }
        /* زرّ التشغيل بلغة الكتل: دائرةٌ بلون العلامة بحدّ حبرٍ وظلٍّ صلب */
        .xi-play {
          position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
          width:clamp(58px,9vw,84px); height:clamp(58px,9vw,84px); border-radius:50%;
          display:grid; place-items:center; padding-inline-start:.12em;
          font-size:clamp(24px,3.6vw,34px); color:#fff; background:var(--n-brand, #E8542F);
          box-shadow:var(--n-e2);
          transition:transform .16s var(--ease-spring);
        }
        .xi-poster:hover .xi-play { transform:translate(-50%,-50%) scale(1.08); }
        .xi-poster:focus-visible { outline:3px solid var(--n-brand, #E8542F); outline-offset:3px; }
      `}</style>
    </div>
  )
}
