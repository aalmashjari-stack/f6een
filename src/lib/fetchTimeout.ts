/**
 * مهلةٌ على كلّ طلب شبكة يمرّ من عميل Supabase.
 *
 * **السبب حادثةٌ لا احتياط:** «ابدأ اللعبة» تعلق على «لحظة…» ولا تنفكّ إلّا
 * بقتل التطبيق (بلاغ علي ٢٥ سبتمبر ٢٠٢٦). المسار: `startSession` ينتظر
 * `supabase.rpc`، والعميل قبل أيّ طلب ينتظر `getSession()`، وهذه تنتظر
 * تجديدَ الرمز إن كان تجديدٌ جارياً — والتجديد طلبُ شبكةٍ بلا مهلة. وWebKit
 * على الآيفون يُسقط طلباً كان في الطريق حين يُعلَّق التطبيق (قفل الشاشة،
 * تبديل تطبيق) **بلا رفضٍ ولا ردّ**: يبقى الوعد معلّقاً إلى الأبد، ومعه
 * كلُّ طلبٍ بعده لأنّه ينتظر التجديد نفسه. فلا زرّ يعود ولا رسالة تظهر.
 *
 * الحلّ في موضعٍ واحد لا في كلّ نداء: `fetch` مغلَّف بـ`AbortController`
 * يُلغي بعد المهلة، ويُمرَّر إلى العميل كلّه (`global.fetch`) فيصل إلى
 * التجديد وإلى PostgREST وإلى الدوالّ سواء. وبعد الإلغاء يرفض الوعد، فيصعد
 * الخطأ إلى الزرّ ويقول «تحقّق من اتصالك»، والضغطة التالية تنجح: `start_session`
 * يردّ الجلسة المفتوحة نفسها إن كان الطلب الأوّل قد بلغ الخادم، فلا خصم مرّتين.
 *
 * **التخزين مستثنى** (`/storage/v1/`): رفعُ صورةٍ من اللوحة على شبكة الجوال
 * قد يتجاوز المهلة بحقّ، وليس في مساره ما يعلق بصمت — الرفع يقع خلف زرٍّ
 * يعرف أنّه ينتظر.
 */

/** المهلة الافتراضيّة — لاعبٌ يحدّق في زرّ. اللوحة ترفعها من مدخلها. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

const STORAGE_PATH = '/storage/v1/'

/** `true` للطلب الذي لا تُطبَّق عليه المهلة. */
export function isExempt(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return url.includes(STORAGE_PATH)
}

/**
 * يلفّ `fetch` بمهلة. `timeoutMs` دالّةٌ لا رقم كي تُقرأ عند كلّ طلب، فيغيّرها
 * المدخلُ بعد إنشاء العميل (`setRequestTimeout`) بلا إعادة إنشاء.
 */
export function withTimeout(base: typeof fetch, timeoutMs: () => number): typeof fetch {
  return (input, init) => {
    const ms = timeoutMs()
    if (isExempt(input) || !(ms > 0)) return base(input, init)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new TimeoutError(ms)), ms)

    /* إشارةُ النداء الأصليّة تبقى مسموعة: إلغاؤها يلغي، ومهلتُنا فوقها. */
    const outer = init?.signal
    const relay = () => controller.abort(outer?.reason)
    if (outer) {
      if (outer.aborted) relay()
      else outer.addEventListener('abort', relay, { once: true })
    }

    return base(input, { ...init, signal: controller.signal }).finally(() => {
      clearTimeout(timer)
      outer?.removeEventListener('abort', relay)
    })
  }
}

/** سبب الإلغاء حين تنقضي المهلة — يُميَّز عن إلغاءٍ طلبه النداء نفسه. */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`request timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}
