import { useEffect } from 'react'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { isNativeApp } from '../lib/platform'

/**
 * يمنع نوم الشاشة أثناء اللعب.
 *
 * أشدُّ ما يظهر فيه الخلل هو **سؤال الجولة الجماعية**: ستّون ثانية تشاورٍ
 * لا يلمس فيها أحدٌ الجهاز، فتُطفئ الشاشةُ نفسَها أمام المجلس ويُضطرّ الحكم
 * إلى إيقاظها وفتح قفلها في منتصف المؤقّت. والحق ما تلحق أقصر لكنّه أحرج.
 *
 * **يُطلب ولا يُنتظر**: القفل امتيازٌ قد يرفضه المتصفّح (تبويب غير ظاهر،
 * أو بطاريّة منخفضة، أو منصّة لا تدعمه)، والرفض لا يعطّل شيئاً — أسوأ أثره
 * أن تنام الشاشة كما كانت تنام. فكلُّ فشلٍ يُبتلع بلا رسالةٍ للاعب.
 *
 * **ويُعاد الطلب عند العودة**: النظام يُسقط القفل كلّما اختفت الصفحة (تبديل
 * تطبيق، قفل شاشة، تبويب آخر)، ولا يُعيده وحده. فبدون `visibilitychange`
 * يعمل القفل مرّةً واحدة ثمّ يسقط صامتاً في أوّل مقاطعة — وهي الحالة التي
 * تقع في المجلس لا في التجربة.
 *
 * **وطريقان لا واحد** (٨ سبتمبر ٢٠٢٦): واجهةُ الويب للموقع، ومؤقّتُ الخمول
 * من النظام للتطبيق المثبَّت. لأنّ دعم `navigator.wakeLock` داخل ويب‑ڤيو
 * Capacitor غيرُ مضمون، والطبقةُ الأصليّة أوثقُ حيث توجد. ويعملان معاً بلا
 * تعارض: كلاهما يقول للنظام «لا تُطفئ»، ورفعُ أحدهما لا يرفع الآخر.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const nav = navigator as Navigator & {
      wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> }
    }

    let lock: { release(): Promise<void> } | null = null
    let alive = true

    /* الطبقة الأصليّة: تُرفع مرّةً وتبقى حتى تُنزَع، ولا تحتاج إعادةَ طلبٍ
       عند العودة — النظام يحفظها للتطبيق لا للصفحة. */
    if (isNativeApp) KeepAwake.keepAwake().catch(() => {})

    const acquire = async () => {
      if (!alive || document.visibilityState !== 'visible' || lock) return
      try {
        lock = await nav.wakeLock!.request('screen')
        /* القفل قد يُسقط من النظام بلا اختيارنا؛ ننساه ليُعاد طلبه. */
        ;(lock as unknown as EventTarget).addEventListener?.('release', () => {
          lock = null
        })
      } catch {
        /* مرفوض أو غير مدعوم — الشاشة تنام كما كانت، ولا رسالة للاعب. */
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
      else lock = null
    }

    if (nav.wakeLock) {
      void acquire()
      document.addEventListener('visibilitychange', onVisible)
    }

    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release().catch(() => {})
      lock = null
      if (isNativeApp) KeepAwake.allowSleep().catch(() => {})
    }
  }, [active])
}
