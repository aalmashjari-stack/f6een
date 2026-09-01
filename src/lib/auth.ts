import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { supabase } from './supabase'
import { isNativeApp } from './platform'

/* معرّفا غوغل — علنيّان كمفتاح Supabase، والحارس هو تسجيلُهما في
   Google Cloud وSupabase لا سرّيّتُهما. */
const IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined
const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined

/* التهيئة مرّةً واحدة ولو نُقر الزرّ مراراً: نحفظ الوعد نفسه لا علماً
   منطقيّاً، فالنقرتان المتلاحقتان تنتظران تهيئةً واحدة بدل أن تبدأ
   ثانيةٌ قبل أن تنتهي الأولى. */
let socialReady: Promise<void> | null = null
function initSocial() {
  if (!socialReady) {
    socialReady = SocialLogin.initialize({
      google: { iOSClientId: IOS_CLIENT_ID, webClientId: WEB_CLIENT_ID },
    })
  }
  return socialReady
}

/**
 * الدخول عبر غوغل — مساران لأنّ السياقين مختلفان لا لأنّ الهويّة مختلفة.
 *
 * **الويب:** يغادر الصفحة إلى غوغل ثم يرجع إلى `redirectTo` ومعه `?code=`،
 * فيلتقطه العميل ويبادله بجلسة (انظر `detectSessionInUrl` في supabase.ts).
 * و`window.location.origin` لا عنوان مكتوب بيد: نفس الشيفرة تعمل على
 * `localhost:4173` وعلى `f6een.com` بلا فرع لكلٍّ منهما.
 *
 * **التطبيق الأصليّ:** هذا المسار كان يكسر الدخول كسراً صامتاً. أصلُ
 * الويب‑ڤيو في Capacitor هو `capacitor://localhost` لا الدومين، وSupabase
 * لا يقبله في `redirect_to`، فيتجاهله ويحوّل إلى `Site URL` المسجَّل عنده
 * — أي يفتح متصفّحاً على موقعٍ آخر ولا يعود إلى التطبيق أبداً (بلاغ علي،
 * ١ سبتمبر ٢٠٢٦). فالحلّ ألّا يغادر الشاشة أصلاً: ورقةُ دخولٍ من النظام
 * تعطي `idToken`، ويبادله `signInWithIdToken` بجلسة.
 */
export async function signInWithGoogle() {
  if (isNativeApp) return signInWithGoogleNative()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

/**
 * الدخول داخل التطبيق — بلا متصفّح ولا إعادة توجيه.
 *
 * يشترط معرّفَ iOS وحده: هو الذي يصحّح التوقيع على الجهاز، وهو الجمهور
 * (`aud`) في الرمز الصادر — فيجب تسجيلُه في «Authorized Client IDs» عند
 * مزوّد غوغل في Supabase، وإلّا رُفض الرمز رغم صحّته. ومعرّفُ الويب
 * اختياريّ هنا: الحزمة لا تطلبه إلّا لوضع offline (طلبِ `serverAuthCode`)،
 * وهو ما لا نستعمله.
 *
 * و`nonce` صيغتان: **البصمة** إلى غوغل — يمرّرها `GIDSignIn` كما هي
 * ويُدرجها غوغل في الرمز كما هي — و**الخام** إلى Supabase، فهو يهشّئ ما
 * يستلمه (SHA-256 ستّ‑عشريّاً) ويقارن الناتج بما في الرمز. تمريرُ القيمة
 * نفسها للطرفين يُخرج `x` في الرمز و`SHA256(x)` في المقارنة، فلا يلتقيان.
 *
 * وأضلّتني **الجلسة المخزَّنة** قبل أن يستقيم هذا: كلُّ محاولةٍ كانت
 * تُقاس على رمزٍ قديم من محاولةٍ سابقة، فبدا السلوك متناقضاً — مرّةً
 * UUID ومرّةً بصمة — فطاردتُ ترميزاً لا وجود له، وحكمتُ على هذا الترتيب
 * نفسِه بالفشل وهو صحيح. لم يستقم القياس إلّا بعد `logout` قبل كلّ دخول.
 *
 * والحاسمُ كان التشخيصَ الذي يعرض المُرسَل وما في الرمز معاً: حين
 * تطابقا حرفاً بحرف وبقي الخطأ، لم يبقَ إلّا أنّ الطرف الآخر يهشّئ.
 */
async function signInWithGoogleNative() {
  if (!IOS_CLIENT_ID) {
    throw new Error('ينقص VITE_GOOGLE_IOS_CLIENT_ID في .env')
  }
  await initSocial()
  /* خروجٌ قبل الدخول: GIDSignIn يحتفظ بجلسة غوغل في Keychain — تبقى بعد
     حذف التطبيق نفسه — فيردّ رمزاً مخزَّناً بـ`nonce` محاولةٍ سابقة بدل
     أن يطلب واحداً جديداً. ظهر ذلك بالتشخيص: أرسلنا بصمةً وعاد في الرمز
     UUID من محاولةٍ قبلها. */
  try {
    await SocialLogin.logout({ provider: 'google' })
  } catch {
    /* لا جلسة تُغلق — وهذا هو المطلوب أصلاً */
  }
  const rawNonce = crypto.randomUUID()
  const hashedNonce = await sha256Hex(rawNonce)
  const res = await SocialLogin.login({ provider: 'google', options: { nonce: hashedNonce } })
  const idToken =
    res.provider === 'google' && 'idToken' in res.result ? res.result.idToken : null
  if (!idToken) throw new Error('لم يُرجِع غوغل رمزَ هويّة')
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: rawNonce,
  })
  if (error) throw error
}

/** بصمة SHA-256 نصّاً ستّ‑عشريّاً — الصيغة التي يحسبها Supabase للمقارنة. */
async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}


/**
 * الخروج — ومن غوغل أيضاً في التطبيق.
 *
 * بلا سطر `logout` يبقى حسابُ غوغل مختاراً في النظام، فالنقرةُ التالية
 * تدخل بالحساب نفسه بلا سؤال — ويبدو للاعب أنّ الخروج لم يعمل.
 * والفشلُ هنا لا يُوقف الخروج من Supabase: الجلسة هي ما يهمّ.
 */
/**
 * معرّفُ صاحب الجلسة الحالية.
 *
 * تلزم لأنّ RLS **لا يكفي وحده** للتصفية: سياسةُ «المدير يقرأ الكلّ» تُجمع
 * مع سياسة «كلٌّ يقرأ صفّه» بـOR، فيرى المديرُ صفوف الجميع — فينفجر
 * `.single()` ويرى في «ألعابي» ألعابَ غيره. الاستعلامُ يقيّد نفسه بنفسه،
 * وRLS حارسٌ خلفه لا مصفاةٌ أمامه.
 *
 * تُقرأ من الجلسة المحفوظة محلّياً بلا طلبِ شبكة.
 */
export async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const id = data.session?.user.id
  if (!id) throw new Error('لا جلسة مفتوحة')
  return id
}

export async function signOut() {
  if (isNativeApp) {
    try {
      await SocialLogin.logout({ provider: 'google' })
    } catch {
      /* لا شيء: قد لا تكون التهيئة جرت أصلاً في هذه الجلسة */
    }
  }
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * الجلسة الحالية.
 *
 * `undefined` تعني «ما زلت أقرأ» لا «لا يوجد» — والتفريق بينهما ضروريّ:
 * بدونه تومض شاشة الدخول لحظةً أمام لاعبٍ مسجَّل أصلاً في كل تشغيل، لأنّ
 * قراءة الجلسة من المخزن غير فوريّة.
 */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session)
    })
    /* يلتقط أيضاً اللحظة التي يُبادَل فيها `?code=` بجلسة بعد العودة من غوغل. */
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (alive) setSession(s)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return session
}

/**
 * حذف الحساب نهائياً — شرط متجر آبل، ووعدٌ في سياسة الخصوصيّة المنشورة.
 *
 * الحذف يقع في القاعدة عبر `delete_own_account`، ويجرف معه الرصيد وذاكرة
 * الأسئلة والجلسات بـ`on delete cascade`. ثم يُخرَج المستخدم محلّياً لأنّ
 * رمز جلسته يبقى في المتصفّح بعد اختفاء الحساب من الخادم — وبدون هذا يظلّ
 * التطبيق يظنّه داخلاً حتى ينتهي صلاحيّة الرمز.
 */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw error
  await supabase.auth.signOut()
}

/** بيانات التسجيل. الهاتف والميلاد اختياريّان في الاستعمال، مطلوبان في النموذج. */
export interface SignUpFields {
  firstName: string
  lastName: string
  email: string
  birthDate: string   // YYYY-MM-DD
  dialCode: string    // مثل +965
  phone: string
  password: string
}

/**
 * إنشاء حساب بالبريد وكلمة السرّ.
 *
 * **الحقول الزائدة محفوظة لاستعمال لاحق بقرار علي (٢٧ أغسطس ٢٠٢٦)** — لا
 * يقرؤها شيء في اللعبة اليوم. وموضعها `user_metadata` لا جدولٌ جديد: بيانات
 * ملفٍّ شخصيّ لا يُستعلَم عنها، فوضعها هنا يوفّر هجرةً وعموداً لكل حقل
 * يُضاف أو يُحذف. والرصيد وذاكرة الأسئلة تبقى في جداولهما.
 *
 * وما دامت تُجمع، فهي تُذكر في سياسة الخصوصيّة وفي إقرار المتجرين — وتاريخ
 * الميلاد خاصّةً يجرّ التزامات بيانات الأطفال.
 *
 * ولا يُلمس `profiles`: المُطلِق `handle_new_user` يُنشئ صفّه بالرصيد وحده.
 */
export async function signUpWithEmail(f: SignUpFields) {
  const { data, error } = await supabase.auth.signUp({
    email: f.email.trim(),
    password: f.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        first_name: f.firstName.trim(),
        last_name: f.lastName.trim(),
        full_name: `${f.firstName.trim()} ${f.lastName.trim()}`.trim(),
        birth_date: f.birthDate,
        /* الصفر البادئ يُحذف: من يكتب ٠٥٠… مع رمز دولة يُنتج رقماً خاطئاً. */
        phone: f.phone.trim() ? `${f.dialCode}${f.phone.trim().replace(/^0+/, '')}` : null,
      },
    },
  })
  if (error) throw error

  /* تأكيد البريد مفعّل في المشروع، فالتسجيل الناجح لا يعطي جلسة بل يرسل
     رسالة. نُرجع هذا صراحةً كي تقول الشاشة «افحص بريدك» بدل أن تنتظر
     جلسةً لا تأتي. */
  return { needsEmailConfirmation: !data.session }
}

/** الدخول بحساب بريد موجود. */
export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}
