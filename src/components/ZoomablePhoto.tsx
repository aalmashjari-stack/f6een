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
 *
 * **والصورة التي لا تصل تُقال لا تُكسر** (علي ٥ أكتوبر ٢٠٢٦، من تدقيق التجربة):
 * الصور المرفوعة من اللوحة روابط بعيدة، وانقطاعٌ لحظيّ كان يترك أيقونةً مكسورة
 * مكان السؤال نفسه في جلسةٍ مدفوعة — ولا تخطّي (SPEC §١). فتُعاد مرّةً وحدها
 * بعد ثانية ونصف، ثمّ تحلّ محلّها بطاقةٌ بزرّ إعادةٍ يضغطه الحكم.
 */
const RETRY_MS = 1500

/** رابطٌ يتجاوز ذاكرة المتصفّح للمحاولة التالية — ورابط data: لا يُمسّ. */
function retrySrc(src: string, attempt: number): string {
  if (attempt === 0 || src.startsWith('data:')) return src
  return src + (src.includes('?') ? '&' : '?') + 'r=' + attempt
}

export function ZoomablePhoto({ src, className }: { src: string; className: string }) {
  const [zoomed, setZoomed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  /* سؤالٌ جديد يبدأ نظيفاً: المكوّن قد يبقى مركَّباً بين سؤالين. */
  useEffect(() => {
    setAttempt(0)
    setFailed(false)
  }, [src])

  function onError() {
    if (attempt === 0) window.setTimeout(() => setAttempt(1), RETRY_MS)
    else setFailed(true)
  }

  function retry() {
    setFailed(false)
    setAttempt((a) => a + 1)
  }

  // الهروب يغلق — الشاشة الكبيرة قد تكون موصولةً بلوحة مفاتيح لا بلمس
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])

  const open = () => setZoomed(true)

  if (failed)
    return (
      <div className={className + ' photo-failed'} role="alert">
        <span className="photo-failed-text">تعذّر تحميل الصورة</span>
        <button type="button" className="photo-failed-retry" onClick={retry}>
          أعد المحاولة
        </button>
        <style>{`
          .photo-failed {
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:clamp(8px,1.6dvh,16px); min-height:clamp(120px,30dvh,320px); width:min(100%,560px);
            align-self:center; border-radius:18px; padding:16px;
            background:var(--n-surface-2, #F6F5F2); border:2px dashed var(--n-ink-3, #8A8578);
          }
          .photo-failed-text { font-weight:800; font-size:clamp(16px,min(2.4vw,3.6dvh),28px); color:var(--n-ink, #22201C); }
          .photo-failed-retry {
            font:inherit; font-weight:800; cursor:pointer; border:0; border-radius:999px;
            min-height:44px; padding:0 22px; font-size:clamp(15px,min(1.8vw,2.8dvh),20px);
            background:var(--n-ink, #22201C); color:#fff;
          }
        `}</style>
      </div>
    )

  return (
    <>
      <img
        className={className + ' photo-tap'}
        src={retrySrc(src, attempt)}
        onError={onError}
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
            {/* زرُّ إغلاقٍ ظاهر إلى جانب «اضغط في أي مكان»: السطرُ يُقرأ،
                والزرُّ يُرى من آخر المجلس ويُصاب بالإبهام من أوّل مرّة
                (طلب علي ٨ سبتمبر ٢٠٢٦). و`stopPropagation` ليست لازمةً
                للإغلاق — الطبقة تغلق على أيّ حال — لكنّها تمنع ضغطتين
                محسوبتين على حدثٍ واحد. */}
            <button
              type="button"
              className="photo-zoom-x"
              aria-label="إغلاق الصورة"
              onClick={(e) => {
                e.stopPropagation()
                setZoomed(false)
              }}
            >
              ✕
            </button>
            <img src={retrySrc(src, attempt)} alt="" />
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
          font-size:clamp(9px, min(1.2vw,1.7dvh), 13px); font-weight:700;
          letter-spacing:.02em;
        }
        .photo-zoom {
          position:fixed; inset:0; z-index:90;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(10px,2dvh,20px);
          padding:clamp(10px,2.5dvh,30px);
          /* الحواف الآمنة: الطبقة تغطّي الشاشة الفيزيائية كاملةً (viewport-fit=cover)
             فلولاها لمرّ طرفُ الصورة تحت أذن الآيفون في الوضع الأفقي. */
          padding-top:max(env(safe-area-inset-top), clamp(10px,2.5dvh,30px));
          padding-right:max(env(safe-area-inset-right), clamp(10px,2.5dvh,30px));
          padding-bottom:max(env(safe-area-inset-bottom), clamp(10px,2.5dvh,30px));
          padding-left:max(env(safe-area-inset-left), clamp(10px,2.5dvh,30px));
          /* شبه معتمة لا ٩٣٪: الواجهة تحتها فاتحة، فسبعةٌ بالمئة منها تكفي
             لتظهر بطاقاتُ النتيجة خلف الصورة وتشتّت النظر عن الوجه. */
          background:rgba(9,9,15,.985);
          -webkit-backdrop-filter:blur(10px);
          backdrop-filter:blur(10px);
          cursor:zoom-out;
          animation:photo-zoom-fade .18s ease-out both;
        }
        .photo-zoom-x {
          position:absolute; z-index:2;
          top:max(env(safe-area-inset-top), 14px);
          inset-inline-end:max(env(safe-area-inset-right), 14px);
          width:clamp(44px, 6dvh, 64px); height:clamp(44px, 6dvh, 64px);
          display:grid; place-items:center;
          font-size:clamp(20px, 3dvh, 30px); line-height:1;
          color:#fff; background:rgba(255,255,255,.14);
          border:2px solid rgba(255,255,255,.5); border-radius:50%;
          cursor:pointer; padding:0;
        }
        .photo-zoom-x:hover { background:rgba(255,255,255,.26); }
        .photo-zoom-x:focus-visible { outline:3px solid #fff; outline-offset:3px; }
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
          font-size:clamp(11px,1.6dvh,15px); font-weight:700;
          pointer-events:none;
        }
        @keyframes photo-zoom-fade { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </>
  )
}
