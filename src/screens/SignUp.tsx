import { useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '../lib/auth'

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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const bad = validate()
    if (bad) {
      setErr(bad)
      return
    }
    setErr(null)
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
        <style>{CSS}</style>
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

        <button className="su-submit" type="submit" disabled={busy}>
          {busy ? 'لحظة…' : signup ? 'إنشاء الحساب' : 'دخول'}
        </button>

        <div className="su-foot">
          <button type="button" className="su-link"
                  onClick={() => { setMode(signup ? 'signin' : 'signup'); setErr(null) }}>
            {signup ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ واحداً'}
          </button>
          <button type="button" className="su-link" onClick={onBack}>رجوع</button>
        </div>
      </form>

      <style>{CSS}</style>
    </div>
  )
}

/* البادئة "body .screen" لازمة لتغلب overflow:hidden في theme.css — نفس ما
   يفعله الإعداد. */
const CSS = `
  body .screen.su { overflow-y:auto; }
  .su { display:flex; justify-content:center; align-items:flex-start;
        padding:clamp(12px,3vh,32px) clamp(14px,4vw,32px); }
  .su-row { display:grid; grid-template-columns:1fr 1fr; gap:clamp(8px,1.4vw,12px); }
  .su-row.phone { grid-template-columns:1.15fr 1fr; }
  .su-card {
    width:min(480px, 100%); margin-inline:auto;
    display:flex; flex-direction:column; gap:clamp(9px,1.5vh,14px);
    background:var(--n-surface,#fff); border-radius:var(--n-r3,20px);
    box-shadow:var(--n-e2); padding:clamp(18px,3.4vw,30px);
  }
  .su-done { text-align:center; gap:14px; }
  .su-title { margin:0; text-align:center; font-weight:800;
              font-size:clamp(20px,3.4vw,30px); color:var(--n-brand,#7A3E9D); }
  .su-sub { margin:0 0 4px; text-align:center; color:var(--n-ink-2,#5D5670);
            font-weight:600; line-height:1.8; font-size:clamp(12px,1.6vw,15px); }
  .su-in {
    font:inherit; font-weight:700; width:100%;
    padding:clamp(9px,1.5vh,13px) clamp(10px,1.6vw,14px);
    border:1px solid var(--n-line,#E5E1F0); border-radius:var(--n-r2,14px);
    background:var(--n-surface-2,#F8F7FC); color:var(--n-ink,#1A1626);
    font-size:clamp(13px,1.7vw,16px);
  }
  .su-in::placeholder { color:var(--n-ink-3,#948CA8); font-weight:700; }
  .su-in:focus { outline:none; border-color:var(--n-brand,#7A3E9D); background:#fff; }
  .su-terms { display:flex; align-items:flex-start; gap:8px;
              font-size:clamp(12px,1.5vw,14px); color:var(--n-ink-2,#5D5670); font-weight:700; }
  .su-terms input { margin-top:5px; accent-color:var(--n-brand,#7A3E9D); }
  .su-terms a { color:var(--n-brand,#7A3E9D); }
  .su-err { margin:0; color:var(--n-bad,#DC4033); font-weight:800;
            font-size:clamp(12px,1.6vw,15px); }
  .su-submit {
    font:inherit; font-weight:800; cursor:pointer; border:0;
    border-radius:var(--n-r3,20px); padding:clamp(10px,1.8vh,15px);
    font-size:clamp(14px,2vw,19px);
    background:var(--n-ink,#1A1626); color:#fff; box-shadow:var(--n-e2);
  }
  .su-submit:disabled { background:rgba(23,23,31,.07); color:var(--n-ink-3,#948CA8); box-shadow:none; }
  .su-foot { display:flex; justify-content:space-between; gap:10px; }
  .su-link { background:none; border:0; cursor:pointer; font:inherit; font-weight:700;
             font-size:clamp(11px,1.4vw,14px); color:var(--n-ink-3,#948CA8); }
  .su-link:hover { color:var(--n-brand,#7A3E9D); }
`
