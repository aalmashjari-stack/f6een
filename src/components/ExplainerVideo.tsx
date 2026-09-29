import { useEffect } from 'react'
import { isNativeApp } from '../lib/platform'

/**
 * فيديو شرح اللعبة — زرٌّ جنب «مراحل اللعبة» يفتحه في نافذةٍ فوق الإعداد
 * (قرار علي ٢٩ سبتمبر ٢٠٢٦: «زر يفتح الفيديو»، لا داخل «شرح اللعبة» ولا
 * ظاهراً في الصفحة — الإعداد يُفتح كلّ لعبة، والفيديو لمن يطلبه).
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
        .xv-frame {
          aspect-ratio:16 / 9; border-radius:18px; overflow:hidden; background:#000;
          box-shadow:0 0 0 3px var(--n-ink, #22201C), 7px 8px 0 var(--n-ink, #22201C);
        }
        .xv-frame iframe { display:block; width:100%; height:100%; border:0; }
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
