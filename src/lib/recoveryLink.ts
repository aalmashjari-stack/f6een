/**
 * قراءةُ رابط الاستعادة من العنوان — بلا عميل Supabase، فتُختبر وحدها.
 *
 * لرابط الاستعادة شكلان، والفرق بينهما ليس تجميليّاً:
 *
 * - **`?code=`** (المتولّد افتراضيّاً مع `flowType: 'pkce'`): الرمز نصفٌ لا
 *   يعمل وحده، ونصفُه الآخر `code_verifier` مخزَّنٌ في ذاكرة **المتصفّح الذي
 *   طلب** الاستعادة. فمن طلبها على جواله وفتح بريده على حاسوبه — أو فتح
 *   الرسالة في متصفّح تطبيق البريد لا في متصفّحه — يصل إلى الموقع بلا جلسة.
 *   وهذا ما وقع فعلاً في ٨ سبتمبر ٢٠٢٦.
 * - **`?token_hash=`**: يُتحقَّق منه عند الخادم بـ`verifyOtp`، ولا يطلب شيئاً
 *   من ذاكرة المتصفّح — فيعمل في أيّ متصفّح وأيّ جهاز. وهو ما يجب أن يرسله
 *   قالبُ البريد (Authentication ← Email Templates ← Reset Password).
 *
 * والشيفرة تقبل الشكلين: القديمُ يبقى عاملاً لمن في بريده رسالةٌ سابقة.
 */
export type RecoveryLink =
  | { kind: 'none' }
  | { kind: 'token'; tokenHash: string }
  | { kind: 'session' }

/**
 * ما الذي جاء به اللاعب؟ يُقرأ من عنوان **الإقلاع** لا من العنوان الحاليّ:
 * عميل Supabase يمسح `code` بعد مبادلته بنجاح، فقراءةٌ متأخّرة ترى عنواناً
 * منظَّفاً ولا تفرّق بين نجاحٍ وفشل.
 */
export function readRecoveryLink(search: string): RecoveryLink {
  const p = new URLSearchParams(search)
  if (!p.has('recovery')) return { kind: 'none' }
  const hash = p.get('token_hash')
  return hash ? { kind: 'token', tokenHash: hash } : { kind: 'session' }
}

/**
 * هل نجحت مبادلة `?code=` بجلسة؟
 *
 * **وجودُ جلسةٍ وحده لا يكفي دليلاً**: قد تكون جلسةً قديمةً لهذا اللاعب على
 * هذا الجهاز، ورابطُه مع ذلك ميّت. والعلامة القاطعة أنّ العميل يحذف `code`
 * من العنوان عند نجاح المبادلة وحدَه — فبقاؤه بعد انتهاء الإقلاع فشلٌ صريح.
 */
export function codeExchangeWorked(searchNow: string, hasSession: boolean): boolean {
  return hasSession && !new URLSearchParams(searchNow).has('code')
}
