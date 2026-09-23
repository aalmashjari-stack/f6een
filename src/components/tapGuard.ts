import { useEffect, useLayoutEffect } from 'react'

/**
 * **الضغطةُ المزدوجة لا تعبر إلى الشاشة التالية.**
 *
 * المخفّض يحرس كلَّ فعلٍ بطوره، فتكرارُ الفعل نفسه لا يفعل شيئاً — لكنّ
 * الضغطة الثانية لا تقع على الزرّ نفسه: React يرسم الشاشة التالية بين
 * الضغطتين، فتقع الثانية على **زرٍّ آخر في الموضع نفسه**. وجدتها مراجعة ٢٣
 * سبتمبر ٢٠٢٦ في ثلاثة مواضع: تنقيطٌ في الكشف يختار خليّةً من اللوح تحت
 * الإصبع (فيضيع اختيار الفريق التالي ويُحرق سؤاله)، و«ابدأ» أو ✓/✗ في الحق
 * ما تلحق يكشف إجابة السؤال التالي قبل أن يحاوله الفريق، و«اكشف» قد تقع على
 * «لم يجب أحد».
 *
 * فلحظةَ تتبدّل الشاشة تُمسك الضغطات لمدّةٍ أقصر من أن يلاحظها حكمٌ يقصد
 * الضغط، وأطول من ضغطةٍ مزدوجة. **ولا تُعطَّل الأزرار ولا تُبهت**: الزرّ
 * المطفأ يُقرأ معطوباً في المجلس (ثلاث بلاغات «لا يعمل» قبل هذا).
 */
const HOLD_MS = 400

let until = 0

function swallow(e: Event) {
  if (performance.now() < until) {
    e.stopPropagation()
    e.preventDefault()
  }
}

/**
 * يُمسك الضغطات حين يتغيّر `screenKey`. الإمساك في `useLayoutEffect` لا في
 * `useEffect`: الأخيرة تجري بعد الرسم، والضغطة الثانية قد تصل بينهما.
 * والمستمع على `document` في طور الالتقاط، فيسبق مستمعَ React على الجذر.
 */
export function useTapGuard(screenKey: string | null) {
  useEffect(() => {
    document.addEventListener('click', swallow, true)
    return () => document.removeEventListener('click', swallow, true)
  }, [])

  useLayoutEffect(() => {
    if (screenKey !== null) until = performance.now() + HOLD_MS
  }, [screenKey])
}
