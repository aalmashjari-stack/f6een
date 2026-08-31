import { useEffect } from 'react'
import { BrandLogo } from '../components/BrandLogo'

/* مدّة الشعار. ثانيةٌ وسبعمئة: تكفي لتكتمل حركة الدخول ويستقرّ الشعار لحظةً
   قبل الانتقال، ولا تطول فتصير ضريبةً يدفعها الحكم في كل تشغيل. */
const SPLASH_MS = 1700

/**
 * سطحٌ صامت بلون الهويّة — بديل الشعار في المتصفّح.
 *
 * الانتظار قبل أول شاشة لا يُلغى بإلغاء الشعار: قراءةُ الجلسة من المخزن ليست
 * فوريّة، وبدون حجبٍ تومض شاشة الدخول أمام لاعبٍ مسجَّل أصلاً. فيبقى الحجب
 * ويسقط التعريف.
 *
 * ولا علامةَ تحميل فيه: المدّة أجزاءُ ثانية في الغالب، ودوّارةٌ تظهر وتختفي
 * في تلك المدّة تُقلق أكثر ممّا تطمئن. و`aria-busy` تقول للقارئ الصوتيّ ما
 * لا يقوله الفراغ.
 *
 * وهو `fixed` لا `.screen`: صنف الشاشة يجرّ حركةَ دخولٍ وخطَّي هويّةٍ علويّين
 * (`theme.css`) — ومضةٌ زائدة في لحظةٍ الغرضُ منها ألّا يومض شيء.
 */
export function BootHold() {
  return (
    <div className="boot-hold" aria-busy="true">
      <style>{`
        /* واللون بديلٌ صريح: المتغيّر --n-bg لا يُعرَّف إلا تحت
           html[data-skin='neo']، فبلا البديل يكون السطح شفّافاً في الهويّة
           الورقية — أي لا يحجب شيئاً. */
        .boot-hold { position:fixed; inset:0; background:var(--n-bg, #F0EFF7); }
      `}</style>
    </div>
  )
}

/**
 * شاشة الشعار — أوّل ما يُرى عند تشغيل **التطبيق المثبَّت**، لا الموقع.
 *
 * خلفيّتها من رموز «نيو» (--n-bg) لا من theme.css — الهويّة مثبّتة منذ
 * ٢٧ أغسطس ٢٠٢٦.
 *
 * تنتقل وحدها بعد `SPLASH_MS`، وتنتقل فوراً بأي نقرة: من رآها مرّة لا يُجبَر
 * على انتظارها مرّة أخرى. والمؤقّت يُلغى عند التفكيك حتى لا ينادي `onDone`
 * بعد أن تكون الشاشة قد بُدِّلت أصلاً بالنقر.
 *
 * ومن ينتظر في المتصفّح يرى [BootHold] أعلاه بدلها.
 */
/**
 * شاشة الشعار — أوّل ما يُرى عند تشغيل **التطبيق المثبَّت**. ولا تُصيَّر في
 * الموقع أصلاً: هناك تبدأ `splashDone` منتهيةً — انظر `isNativeApp` في `App`.
 *
 * خلفيّتها من رموز «نيو» (--n-bg) لا من theme.css — الهويّة مثبّتة منذ
 * ٢٧ أغسطس ٢٠٢٦.
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
          background:var(--n-bg);
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
