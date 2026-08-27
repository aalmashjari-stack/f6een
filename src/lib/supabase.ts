import { createClient } from '@supabase/supabase-js'

/* عميل Supabase — نسخة واحدة للتطبيق كلّه.
 *
 * المفتاح هنا هو `sb_publishable_` العلنيّ، ووجوده في الحزمة مقصود لا سهو:
 * الحارس هو RLS في `supabase/migrations/` لا سرّية المفتاح. تحقّقنا منه على
 * القاعدة الحيّة (٢٧ أغسطس ٢٠٢٦): محاولة كتابة رصيد أو إنشاء جلسة بهذا
 * المفتاح تُردّ بـ42501.
 *
 * ولا يدخل هنا مفتاح `sb_secret_` ولا `service_role` — يتجاوزان RLS كلّه،
 * ولا مكان لهما في شيفرة تُشحن إلى الأجهزة.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/* الفشل هنا صريح لا صامت: بلا هذا يبني المشروع بنجاح ثم يسقط أوّل طلب
   برسالة غامضة، والسبب الحقيقي `.env` ناقص لا خلل في الشبكة. */
if (!url || !key) {
  throw new Error(
    'ينقص VITE_SUPABASE_URL أو VITE_SUPABASE_PUBLISHABLE_KEY — انسخ .env.example إلى .env واملأه.',
  )
}

export const supabase = createClient(url, key, {
  auth: {
    /* الجلسة تُحفظ وتُجدَّد وحدها: الحكم يفتح اللعبة على جواله مرّة كل أسبوعين،
       ولا يُطالَب بتسجيل دخول جديد كلّما فتحها. */
    persistSession: true,
    autoRefreshToken: true,
    /* **لازمة للويب.** دخول غوغل يغادر الصفحة ويرجع بـ`?code=` في العنوان،
       وهذه هي التي تلتقطه وتبادله بجلسة. أطفأتُها أوّلاً ظنّاً أنّ Capacitor
       لا يحتاجها — وكان ذلك سيكسر دخول الويب صامتاً: يرجع اللاعب من غوغل
       فيجد نفسه غير مسجَّل بلا رسالة خطأ.
       والتطبيق الأصليّ لا يتضرّر: مساره `signInWithIdToken` بلا عنوان يُقرأ. */
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
