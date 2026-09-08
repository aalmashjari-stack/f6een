import { useState } from 'react'
import { setNewPassword } from '../lib/auth'
import { AUTH_CSS } from './authStyles'

const MIN_PASSWORD = 8

/**
 * تعيين كلمة سرّ جديدة بعد فتح رابط الاستعادة.
 *
 * تُعرض حين يفتح اللاعب الرابط الآتي في بريده: العميل يبادل الرمز بجلسةٍ
 * ويطلق `PASSWORD_RECOVERY`، فتحلّ هذه الشاشة محلّ اللعبة كلّها — لا يُترك
 * على شاشة الإعداد وهو جاء ليغيّر كلمته.
 *
 * **ولا تُطلب الكلمة القديمة**: من نسيها هو من وصل إلى هنا، وحقُّه في
 * التغيير أثبتَه بفتح بريده.
 *
 * و`failed` تعني أنّ الرابط وصل ولم ينفع — منتهيَ الصلاحية، أو مستهلَكاً،
 * أو مفتوحاً في متصفّح غير الذي طُلب منه. ويُقال ذلك صراحةً: الشاشة الصامتة
 * تجعل اللاعب يظنّ العطبَ في اللعبة فلا يعيد الطلب.
 */
export function ResetPassword({ onDone, failed = false }: { onDone: () => void; failed?: boolean }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) {
      setErr(`كلمة المرور ${MIN_PASSWORD} أحرف على الأقل`)
      return
    }
    if (password !== confirm) {
      setErr('كلمتا المرور غير متطابقتين')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      await setNewPassword(password)
      setDone(true)
    } catch (e2) {
      /* أشهر سببين: انتهت صلاحية الرابط، أو فُتح في متصفّح غير الذي طُلب منه. */
      setErr(
        e2 instanceof Error && /expired|invalid/i.test(e2.message)
          ? 'انتهت صلاحية الرابط. اطلب رابطاً جديداً.'
          : 'تعذّر تغيير كلمة المرور',
      )
    } finally {
      setBusy(false)
    }
  }

  if (failed) {
    return (
      <div className="screen su">
        <style>{AUTH_CSS}</style>
        <div className="su-card su-done">
          <h1 className="su-title">الرابط لم يعد صالحاً</h1>
          <p className="su-sub">
            رابط الاستعادة يُفتح مرّة واحدة وتنتهي صلاحيتُه بسرعة. اطلب رابطاً
            جديداً وافتحه على الجهاز نفسه الذي طلبته منه.
          </p>
          <button className="su-submit" onClick={onDone}>
            اطلب رابطاً جديداً
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="screen su">
        <style>{AUTH_CSS}</style>
        <div className="su-card su-done">
          <h1 className="su-title">تغيّرت كلمة المرور</h1>
          <p className="su-sub">تستطيع الآن الدخول بها.</p>
          <button className="su-submit" onClick={onDone}>
            ابدأ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen su">
        <style>{AUTH_CSS}</style>
      <form className="su-card" onSubmit={submit} noValidate>
        <h1 className="su-title">كلمة مرور جديدة</h1>
        <p className="su-sub">اكتبها مرّتين، ولا نطلب القديمة.</p>

        <input
          className="su-in"
          type="password"
          placeholder="كلمة المرور الجديدة"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          className="su-in"
          type="password"
          placeholder="تأكيد كلمة المرور"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />

        {err && <p className="su-err">{err}</p>}

        <button className="su-submit" type="submit" disabled={busy}>
          {busy ? '…' : 'احفظ'}
        </button>
      </form>
    </div>
  )
}
