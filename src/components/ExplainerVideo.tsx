import { useEffect, useState } from 'react'
import { isNativeApp } from '../lib/platform'

/**
 * فيديو شرح اللعبة، بهيئتين (قرار علي ٢٩ سبتمبر ٢٠٢٦):
 * - **الموقع:** ظاهرٌ تحت بطاقات المراحل (`ExplainerInline`) — زائر الموقع
 *   أحوج الناس إلى الشرح. صورةُ غلافٍ من الفيلم وعليها ▶، ويوتيوب لا يُحمَّل
 *   إلّا بالضغط: الإعداد يُفتح كلّ لعبة فلا يثقل، ولا كوكيز قبل الضغط.
 * - **التطبيق:** زرّ «شاهد الشرح» جنب «مراحل اللعبة» يفتح نافذة (`ExplainerVideo`).
 *
 * الفيديو على يوتيوب (رفعه علي). المشغّل من `youtube-nocookie.com` ولا يُركَّب
 * إلّا والنافذة مفتوحة: لا كوكيز ولا طلبَ ليوتيوب لمن لم يضغط.
 *
 * **التطبيق يمرّ بوسيط:** يعمل من `capacitor://localhost` فلا يرسل مُحيلاً،
 * ويوتيوب يرفض المشغّل بلا مُحيل (خطأ 153، مقيس على المحاكي ٢٩ سبتمبر).
 * فيفتح `f6een.com/video.html` وهي تضمّن يوتيوب من نطاقٍ حقيقيّ — ومعرّف
 * الفيديو هناك أيضاً: من غيّر الفيديو غيّره في الموضعين.
 */
const VIDEO_ID = 'I_kr-jRcCBY'
const SRC = isNativeApp
  ? 'https://f6een.com/video.html'
  : `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&playsinline=1&cc_load_policy=0`

/** إطار المشغّل بلغة الكتل — للنافذة وللصفحة معاً. */
const FRAME_CSS = `
        .xv-frame {
          aspect-ratio:16 / 9; border-radius:18px; overflow:hidden; background:#000;
          box-shadow:0 0 0 3px var(--n-ink, #22201C), 7px 8px 0 var(--n-ink, #22201C);
        }
        .xv-frame iframe { display:block; width:100%; height:100%; border:0; }
`

export function ExplainerVideo({ onClose }: { onClose: () => void }) {
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
          <iframe
            src={SRC}
            referrerPolicy="strict-origin-when-cross-origin"
            title="فطين — شرح اللعبة"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
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

/** الموقع: الفيديو في الصفحة نفسها، غلافٌ محلّيّ حتى يُضغط. */
export function ExplainerInline() {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="xi-wrap">
      <div className="xv-frame xi-frame">
        {playing ? (
          <iframe
            src={SRC}
            title="فطين — شرح اللعبة"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button className="xi-poster" onClick={() => setPlaying(true)} aria-label="شغّل فيديو شرح اللعبة">
            <img src="/explainer-poster.jpg" alt="" />
            <span className="xi-play" aria-hidden="true">▶</span>
          </button>
        )}
      </div>

      <style>{`
        .xi-wrap { width:min(100%, 760px); margin-inline:auto; margin-top:clamp(14px,2.4dvh,24px); }
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
