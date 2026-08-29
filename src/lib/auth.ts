import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * الدخول عبر غوغل — مسار الويب.
 *
 * يغادر الصفحة إلى غوغل ثم يرجع إلى `redirectTo` ومعه `?code=`، فيلتقطه
 * العميل ويبادله بجلسة (انظر `detectSessionInUrl` في supabase.ts).
 *
 * `window.location.origin` لا عنوان مكتوب بيد: نفس الشيفرة تعمل على
 * `localhost:4173` وعلى `f6een.com` بلا فرع لكلٍّ منهما. ويشترط Supabase
 * أن يكون الأصل مسجَّلاً في Authentication ← URL Configuration، وإلّا ردّ
 * الطلب بـ`redirect_to` غير مسموح.
 *
 * وفي التطبيق الأصليّ لاحقاً: حزمة غوغل الأصليّة ثم `signInWithIdToken` —
 * لا إعادة توجيه ولا مغادرة للشاشة.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
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
