import { useEffect } from 'react'
import { BrandLogo } from '../components/BrandLogo'

/* مدّة الشعار. ثانيةٌ وسبعمئة: تكفي لتكتمل حركة الدخول ويستقرّ الشعار لحظةً
   قبل الانتقال، ولا تطول فتصير ضريبةً يدفعها الحكم في كل تشغيل. */
const SPLASH_MS = 1700

/**
 * شاشة الشعار — أوّل ما يُرى عند تشغيل التطبيق.
 *
 * تنتقل وحدها بعد `SPLASH_MS`، وتنتقل فوراً بأي نقرة: من رآها مرّة لا يُجبَر
 * على انتظارها مرّة أخرى. والمؤقّت يُلغى عند التفكيك حتى لا ينادي `onDone`
 * بعد أن تكون الشاشة قد بُدِّلت أصلاً بالنقر.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, SPLASH_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="screen splash" onClick={onDone} role="presentation">
      <BrandLogo className="splash-logo" />

      <style>{`
        .splash {
          display:grid; place-items:center;
          min-height:100%;
          cursor:pointer;
        }
        /* الشعار يكبر قليلاً ويستقرّ — لا دوران ولا قفز: هويّة تُقدَّم
           لا حركة تُستعرض. */
        .splash-logo {
          font-size:clamp(56px, 13vw, 132px);
          animation:splash-in .75s var(--ease-spring) both;
        }
        @keyframes splash-in {
          from { opacity:0; transform:scale(.86); }
          to   { opacity:1; transform:scale(1); }
        }
        /* من أطفأ الحركة في نظامه يرى الشعار ثابتاً — والمؤقّت كما هو. */
        @media (prefers-reduced-motion:reduce) {
          .splash-logo { animation:none; }
        }
      `}</style>
    </div>
  )
}
