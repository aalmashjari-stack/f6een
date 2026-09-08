import { useState } from 'react'
import { requestPasswordReset, resendConfirmation, signInWithEmail, signUpWithEmail } from '../lib/auth'
import { AUTH_CSS } from './authStyles'

/* رموز الاتصال — الخليج أوّلاً ثم الأكثر وروداً. الكويت الافتراضيّة. */
const DIAL_CODES = [
  { code: '+965', name: 'الكويت' },
  { code: '+966', name: 'السعودية' },
  { code: '+971', name: 'الإمارات' },
  { code: '+974', name: 'قطر' },
  { code: '+973', name: 'البحرين' },
  { code: '+968', name: 'عُمان' },
  { code: '+962', name: 'الأردن' },
  { code: '+20', name: 'مصر' },
  { code: '+961', name: 'لبنان' },
  { code: '+964', name: 'العراق' },
] as const

const MIN_PASSWORD = 8

/** العمر بالسنوات — بالتاريخ الكامل لا بطرح السنة، وإلا أخطأ بسنة قبل الميلاد. */
function ageFrom(birth: string): number | null {
  if (!birth) return null
  const b = new Date(birth)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
}

/**
 * إنشاء حساب بالبريد — والدخول بحساب قائم.
 *
 * الحقول: اسم أوّل وعائلة، وبريد، وتاريخ ميلاد، ورمز دولة ورقم هاتف، وكلمة
 * سرّ وتأكيدها. **حُذفت الزائدة ثم أُرجعت بقرار علي (٢٧ أغسطس ٢٠٢٦) لحاجة
 * مستقبليّة** — ولا يقرؤها شيء في اللعبة اليوم، فتُذكر في سياسة الخصوصيّة
 * وفي إقرار المتجرين ما دامت تُجمع.
 *
 * وضعان في شاشة واحدة — تسجيل ودخول — لأنّ حقولهما واحدة، وفصلهما يضاعف
 * التخطيط ويربك من أخطأ في الوضع.
 *
 * والتحقّق كلّه قبل الإرسال برسائل عربيّة: تركُه للخادم يُرجع نصّاً
 * إنجليزيّاً في وجه لاعبٍ عربيّ.
 */
export function SignUp({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dialCode, setDialCode] = useState('+965')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  /* «أُرسل» يشمل الاستعادة وإعادة التأكيد معاً: كلاهما ينتهي بالرسالة نفسها
     «افحص بريدك»، فشاشةٌ واحدة تكفيهما بنصٍّ مختلف. */
  const [note, setNote] = useState<string | null>(null)

  const signup = mode === 'signup'

  function validate(): string | null {
    if (signup && !firstName.trim()) return 'اكتب اسمك الأول'
    if (signup && !lastName.trim()) return 'اكتب اسم العائلة'
    if (!email.trim()) return 'اكتب بريدك الإلكتروني'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'البريد غير صحيح'
    if (!password) return 'اكتب كلمة المرور'
    if (!signup) return null
    if (!birthDate) return 'اكتب تاريخ ميلادك'
    const age = ageFrom(birthDate)
    if (age === null || age < 0 || age > 120) return 'تاريخ الميلاد غير صحيح'
    if (!phone.trim()) return 'اكتب رقم هاتفك'
    if (password.length < MIN_PASSWORD) return `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل`
    if (password !== confirm) return 'كلمتا المرور غير متطابقتين'
    if (!agreed) return 'وافق على سياسة الخصوصية'
    return null
  }

  /**
   * الاستعادة وإعادة التأكيد — كلتاهما تحتاج البريد وحده.
   *
   * **ولا يُفشى وجود الحساب**: الرسالة واحدة سواء وُجد البريد أم لا، وإلّا
   * صار النموذج أداةَ تعدادٍ لحسابات اللاعبين.
   */
  async function byEmail(kind: 'reset' | 'resend') {
    const e = email.trim()
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setErr('اكتب بريدك الإلكتروني أولاً')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      if (kind === 'reset') await requestPasswordReset(e)
      else await resendConfirmation(e)
      setNote(
        kind === 'reset'
          ? 'إن كان لديك حساب بهذا البريد فستصلك رسالة لتغيير كلمة المرور.'
          : 'أُرسلت رسالة التأكيد من جديد. افحص بريدك ومجلّد غير المرغوب.',
      )
    } catch {
      /* الرسالة نفسها عند الفشل: الفرق يفشي ما نخفيه. */
      setNote('إن كان لديك حساب بهذا البريد فستصلك رسالة.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const bad = validate()
    if (bad) {
      setErr(bad)
      return
    }
    setErr(null)
    setNote(null)
    setBusy(true)
    try {
      if (signup) {
        const { needsEmailConfirmation } = await signUpWithEmail({
          firstName, lastName, email, birthDate, dialCode, phone, password,
        })
        if (needsEmailConfirmation) setSent(true)
      } else {
        await signInWithEmail(email, password)
        /* الجلسة تُلتقط في App فتتبدّل الشاشة وحدها. */
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر إتمام الطلب')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="screen su">
        <div className="su-card su-done">
          <h1 className="su-title">تحقّق من بريدك</h1>
          <p className="su-sub">
            أرسلنا رسالة تأكيد إلى <b dir="ltr">{email.trim()}</b>. افتحها لتفعيل حسابك،
            ثمّ ارجع وسجّل الدخول.
          </p>
          <button className="su-submit" onClick={onBack}>رجوع</button>
        </div>
        <style>{AUTH_CSS}</style>
      </div>
    )
  }

  return (
    <div className="screen su">
      <form className="su-card" onSubmit={submit} noValidate>
        <h1 className="su-title">{signup ? 'إنشاء حساب' : 'تسجيل الدخول'}</h1>
        <p className="su-sub">
          {signup
            ? 'بياناتك تبقى عندك — لا إعلانات ولا مشاركة'
            : 'بحسابك الذي أنشأته بالبريد'}
        </p>

        {signup && (
          <div className="su-row">
            <input className="su-in" placeholder="الاسم الأول" value={firstName}
                   onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
            <input className="su-in" placeholder="اسم العائلة" value={lastName}
                   onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </div>
        )}

        <input className="su-in" type="email" placeholder="البريد الإلكتروني" value={email}
               onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" />

        {signup && (
          <>
            {/* حقل تاريخ من النظام لا ثلاث قوائم — أقلّ نقرات وأقلّ خطأ. */}
            <input className="su-in" type="date" value={birthDate}
                   max={new Date().toISOString().slice(0, 10)}
                   onChange={(e) => setBirthDate(e.target.value)} aria-label="تاريخ الميلاد" />

            <div className="su-row phone">
              <select className="su-in" value={dialCode} aria-label="رمز الدولة"
                      onChange={(e) => setDialCode(e.target.value)}>
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                ))}
              </select>
              <input className="su-in" type="tel" placeholder="رقم التليفون" value={phone}
                     onChange={(e) => setPhone(e.target.value)} autoComplete="tel" dir="ltr" />
            </div>
          </>
        )}

        <input className="su-in" type="password" placeholder="كلمة المرور" value={password}
               onChange={(e) => setPassword(e.target.value)}
               autoComplete={signup ? 'new-password' : 'current-password'} dir="ltr" />

        {signup && (
          <>
            <input className="su-in" type="password" placeholder="تأكيد كلمة المرور" value={confirm}
                   onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" dir="ltr" />

            {/* لا ذكر لـ«الشروط والأحكام»: لا وجود لها بعد، والإشارة إلى صفحة
                غائبة وعدٌ لا يُوفى. تُضاف حين تُكتب. */}
            <label className="su-terms">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                قرأت <a href="/privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a> وأوافق عليها
              </span>
            </label>
          </>
        )}

        {err && <p className="su-err">{err}</p>}
        {note && <p className="su-note">{note}</p>}

        <button className="su-submit" type="submit" disabled={busy}>
          {busy ? 'لحظة…' : signup ? 'إنشاء الحساب' : 'دخول'}
        </button>

        {/* المخرجان اللذان لم يكونا: من نسي كلمته، ومن ضاعت رسالة تأكيده
            فلا يدخل ولا يسجّل ثانيةً لأنّ بريده مأخوذ. وموضعهما في وضع
            الدخول: من يُنشئ حساباً لا يحتاجهما. */}
        {!signup && (
          <div className="su-foot su-recover">
            <button type="button" className="su-link" disabled={busy} onClick={() => byEmail('reset')}>
              نسيت كلمة المرور
            </button>
            <button type="button" className="su-link" disabled={busy} onClick={() => byEmail('resend')}>
              أعد إرسال رسالة التأكيد
            </button>
          </div>
        )}

        <div className="su-foot">
          <button type="button" className="su-link"
                  onClick={() => { setMode(signup ? 'signin' : 'signup'); setErr(null); setNote(null) }}>
            {signup ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ واحداً'}
          </button>
          <button type="button" className="su-link" onClick={onBack}>رجوع</button>
        </div>
      </form>

      <style>{AUTH_CSS}</style>
    </div>
  )
}
