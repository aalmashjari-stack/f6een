import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * صورة السؤال — تكبر بضغطة.
 *
 * سؤال «من صاحب الصورة؟» الصورةُ فيه هي السؤال نفسه لا زينةً عليه، وسقفُها
 * ٤٨٠px يضيق على مجلسٍ يجلس بعضه بعيداً عن الشاشة. فيضغطها الحكم فتملأ
 * الشاشة، وضغطةٌ أخرى تُرجعها.
 *
 * الوسم `img` يبقى ابناً مباشراً لحاويته ولا يُلَفّ بزرّ: مقاسه محكومٌ
 * بـflex وسقفٍ محسوبين في theme.css (`flex:0 1 auto; max-height:min(100%,480px)`)،
 * وأيُّ غلافٍ بينهما يبطل الحساب فتفيض الصورة على الزرّ تحتها. ولهذا الغلاف
 * `display:contents` والدلالةُ تُعطى بـrole وtabIndex.
 *
 * والدلالة سطرٌ تحت الصورة لا شارةٌ فوقها: الصورة تتوسّط حاويتها بعرضٍ
 * متغيّر (object-fit:contain)، فشارةٌ معلّقة على زاوية الحاوية تطفو بعيداً
 * عن الصورة في الصور الضيّقة. والسطر يخاطب المجلس كما يخاطب الحكم.
 *
 * المؤقّت لا يتوقّف خلف الطبقة — مقصود: ساعة «الحق ما تلحق» لا تتوقّف أبداً
 * (SPEC §٦)، والتكبير ضغطةٌ تكلّف وقتاً كأيّ ضغطةٍ سواها.
 */
export function ZoomablePhoto({ src, className }: { src: string; className: string }) {
  const [zoomed, setZoomed] = useState(false)

  // الهروب يغلق — الشاشة الكبيرة قد تكون موصولةً بلوحة مفاتيح لا بلمس
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])

  const open = () => setZoomed(true)

  return (
    <>
      <img
        className={className + ' photo-tap'}
        src={src}
        alt=""
        role="button"
        tabIndex={0}
        aria-label="اضغط لتكبير الصورة"
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open()
          }
        }}
      />
      <span className="photo-tap-hint" onClick={open}>اضغط الصورة لتكبيرها</span>

      {/* بوّابة إلى body: ‏.screen يفرض سياقَ تكديسٍ خاصاً به
          (`isolation:isolate` في showtime.css)، فأيّ z-index داخله يُقاس
          بأشقّائه لا بالصفحة — وكان شريطُ النتيجة وكبسولتا الفريقين يطفوان
          فوق الطبقة السوداء. الطبقة عند جذر المستند تعلو كلَّ شيء بلا سباق
          أرقام. */}
      {zoomed &&
        createPortal(
          <div
            className="photo-zoom"
            role="dialog"
            aria-modal="true"
            aria-label="الصورة مكبّرة"
            onClick={() => setZoomed(false)}
          >
            <img src={src} alt="" />
            <span className="photo-zoom-hint">اضغط في أي مكان للإغلاق</span>
          </div>,
          document.body,
        )}

      <style>{`
        .photo-tap { cursor:zoom-in; }
        .photo-tap:focus-visible { outline:3px solid currentColor; outline-offset:3px; }
        .photo-tap-hint {
          flex:none; align-self:center; cursor:zoom-in;
          color:var(--text-3);
          font-size:clamp(9px, min(1.2vw,1.7vh), 13px); font-weight:700;
          letter-spacing:.02em;
        }
        .photo-zoom {
          position:fixed; inset:0; z-index:90;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(10px,2vh,20px);
          padding:clamp(10px,2.5vh,30px);
          /* الحواف الآمنة: الطبقة تغطّي الشاشة الفيزيائية كاملةً (viewport-fit=cover)
             فلولاها لمرّ طرفُ الصورة تحت أذن الآيفون في الوضع الأفقي. */
          padding-top:max(env(safe-area-inset-top), clamp(10px,2.5vh,30px));
          padding-right:max(env(safe-area-inset-right), clamp(10px,2.5vh,30px));
          padding-bottom:max(env(safe-area-inset-bottom), clamp(10px,2.5vh,30px));
          padding-left:max(env(safe-area-inset-left), clamp(10px,2.5vh,30px));
          /* شبه معتمة لا ٩٣٪: الواجهة تحتها فاتحة، فسبعةٌ بالمئة منها تكفي
             لتظهر بطاقاتُ النتيجة خلف الصورة وتشتّت النظر عن الوجه. */
          background:rgba(9,9,15,.985);
          -webkit-backdrop-filter:blur(10px);
          backdrop-filter:blur(10px);
          cursor:zoom-out;
          animation:photo-zoom-fade .18s ease-out both;
        }
        .photo-zoom img {
          max-width:100%; max-height:100%; min-height:0;
          object-fit:contain; border-radius:14px;
        }
        /* السطر يعوم فوق الطبقة لا داخل عمودها: لو اقتطع ارتفاعاً لوجب
           إخفاؤه على الجوال الأفقي — وهو أشدُّ المقاسات حاجةً إليه. */
        .photo-zoom-hint {
          position:absolute; z-index:1;
          bottom:max(env(safe-area-inset-bottom), 14px);
          inset-inline:0; text-align:center;
          color:rgba(255,255,255,.62); text-shadow:0 1px 6px rgba(0,0,0,.7);
          font-size:clamp(11px,1.6vh,15px); font-weight:700;
          pointer-events:none;
        }
        @keyframes photo-zoom-fade { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </>
  )
}
