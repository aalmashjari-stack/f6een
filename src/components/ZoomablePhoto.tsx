import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import zoomablePhotoFailedCss from './ZoomablePhoto.failed.css?inline'
import zoomablePhotoCss from './ZoomablePhoto.css?inline'

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
        <style>{zoomablePhotoFailedCss}</style>
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
      <span className="photo-tap-hint" onClick={open}>
        اضغط الصورة لتكبيرها
      </span>

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

      <style>{zoomablePhotoCss}</style>
    </>
  )
}
