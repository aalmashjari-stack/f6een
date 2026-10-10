import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signInWithEmail, signInWithGoogle, signOut, useSession } from '../lib/auth'
import { type AdminStats, fetchStats, isAdmin, isSuper } from '../lib/admin'
import { Insights } from './tabs/Insights'
import { Backups } from './tabs/Backups'
import { Audit } from './tabs/Audit'
import { Users } from './tabs/Users'
import { Sessions } from './tabs/Sessions'
import { Codes } from './tabs/Codes'
import { Reports } from './tabs/Reports'
import { Messages } from './tabs/Messages'
import { Questions } from './tabs/Questions'
import { Categories } from './tabs/Categories'
import { Drafts } from './tabs/Drafts'
import { Uploads } from './tabs/Uploads'

/**
 * لوحة إدارة فطين — على `/admin.html`، خارج شاشات اللعب.
 *
 * **صفحة مستقلّة لا شاشة داخل اللعبة.** اللعبة تُشغَّل من الحكم أمام المجلس
 * بقاعدة «فعل واحد ظاهر في كل شاشة»، وهذه جدولٌ كثيف يُقرأ وحدك — ولو
 * سكنت داخل التطبيق لصار للحكم زرٌّ يفتح بيانات كل اللاعبين أمام الضيوف.
 *
 * **وأمنها كلّه في القاعدة.** الحزمة علنيّة ومن يعرف العنوان يفتحها، لكنّه
 * لا يرى شيئاً: كل دالّة تشترط صفّاً في `public.admins`، ومن ليس فيه يرى
 * صفر صفوف. فالإخفاء ليس حراسةً، والحراسة لا تحتاج إخفاءً.
 */
export default function AdminApp() {
  const session = useSession()
  /* `null` = لم يُسأل بعد. والسؤالان يُطرحان معاً فلا ترتسم اللوحة بدورٍ
     ناقص ثمّ تقفز ألسنتُها حين يصل الجواب الثاني. */
  const [role, setRole] = useState<{ admin: boolean; superAdmin: boolean } | null>(null)

  useEffect(() => {
    if (!session) {
      setRole(null)
      return
    }
    let alive = true
    Promise.all([isAdmin(), isSuper()])
      .then(([admin, superAdmin]) => alive && setRole({ admin, superAdmin }))
      .catch(() => alive && setRole({ admin: false, superAdmin: false }))
    return () => {
      alive = false
    }
  }, [session])

  if (session === undefined) return <p className="a-note">…</p>
  if (!session) return <Gate />
  if (role === null) return <p className="a-note">…</p>
  if (!role.admin) return <NotAdmin email={session.user.email ?? ''} />
  return <Dashboard session={session} superAdmin={role.superAdmin} />
}

function Gate() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await signInWithEmail(email, pass)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر الدخول')
      setBusy(false)
    }
  }

  return (
    <div className="a-gate">
      <form className="a-gate-card" onSubmit={submit}>
        <h1>لوحة فطين</h1>
        <input
          className="a-in ltr"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد"
          autoComplete="username"
        />
        <input
          className="a-in ltr"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="كلمة السرّ"
          autoComplete="current-password"
        />
        <button className="a-btn go" type="submit" disabled={busy || !email || !pass}>
          {busy ? '…' : 'دخول'}
        </button>
        <button
          className="a-btn"
          type="button"
          onClick={() => signInWithGoogle().catch((e) => setErr(String(e)))}
        >
          الدخول بغوغل
        </button>
        {err && <p className="a-err">{err}</p>}
      </form>
    </div>
  )
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="a-gate">
      <div className="a-gate-card">
        <h1>لا صلاحية</h1>
        <p className="a-note">
          هذا الحساب ({email}) ليس مديراً. الصلاحية يمنحها المديرُ العامّ من لسان «الحسابات» في هذه اللوحة.
        </p>
        <button className="a-btn" onClick={() => signOut()}>
          الخروج
        </button>
      </div>
    </div>
  )
}

type Tab =
  | 'users'
  | 'sessions'
  | 'codes'
  | 'reports'
  | 'messages'
  | 'questions'
  | 'categories'
  | 'drafts'
  | 'uploads'
  | 'insights'
  | 'backups'
  | 'audit'

/**
 * الألسنة مرتّبةٌ بالعمل لا بتاريخ إضافتها: **المحتوى أوّلاً** (الأسئلة
 * وفئاتها وبلاغاتها) ثمّ **الإدارة** (الحسابات والجلسات والأكواد والرسائل).
 *
 * والمحتوى أوّلٌ لأنّه العمل اليوميّ — وهو كلّ ما يراه محرّرُ الأسئلة، فلا
 * تبدأ لوحتُه بفجوةٍ حيث أُخفيت ألسنةٌ ليست له.
 *
 * و`true` = للمدير العامّ وحده (قرار علي ٤ سبتمبر ٢٠٢٦: «كلّ شيء متعلّق
 * بالأسئلة» للمحرّر).
 */
const TABS: [Tab, string, boolean][] = [
  ['questions', 'الأسئلة', false],
  ['drafts', 'المسوّدات', false],
  ['categories', 'الفئات', false],
  ['uploads', 'الصور المرفوعة', false],
  ['reports', 'البلاغات', false],
  /* اقتراحات تدقيق ٩ أكتوبر ٢٠٢٦ — يُزال اللسان وملفّه حين تنتهي. */
  ['audit', 'التدقيق', false],
  /* للمدير العامّ: فيها حساباتٌ وبريدُ أكثرهم لعباً (`admin_insights` تردّ غيرَه). */
  ['insights', 'الإحصائيات', true],
  ['users', 'الحسابات', true],
  ['sessions', 'الجلسات', true],
  ['codes', 'أكواد الهدية', true],
  ['messages', 'الرسائل', true],
  ['backups', 'النسخ الاحتياطي', true],
]

function Dashboard({ session, superAdmin }: { session: Session; superAdmin: boolean }) {
  const tabs = TABS.filter(([, , sup]) => superAdmin || !sup)
  const [tab, setTab] = useState<Tab>('questions')
  const [stats, setStats] = useState<AdminStats | null>(null)

  const reloadStats = useCallback(() => {
    if (!superAdmin) return
    fetchStats()
      .then(setStats)
      .catch(() => {})
  }, [superAdmin])

  useEffect(reloadStats, [reloadStats])

  return (
    <div className="a-wrap">
      <header className="a-top">
        <h1 className="a-title">
          لوحة <span>فطين</span>
        </h1>
        <div className="a-who">
          <span className="a-mail">{session.user.email}</span>
          <span className={'tag' + (superAdmin ? ' open' : '')}>
            {superAdmin ? 'مدير عامّ' : 'محرّر أسئلة'}
          </span>
          {/* العودة إلى اللعبة — رابطٌ لا زرّ: اللوحة مدخلٌ مستقلّ
              (‏admin.html‎) لا مسارٌ داخل التطبيق، فالرجوع تنقّلٌ حقيقيّ
              بين صفحتين. ورابطٌ يُفتح في تبويب جديد بالوسط أو بـcmd.

              و‎./index.html‎ لا ‎/‎: في التطبيق الأصليّ الأصلُ
              ‎capacitor://localhost‎، والجذرُ المجرّد يعتمد على أن يخدم
              الخادمُ الداخليّ ‎index.html‎ عنه — أمّا المسار الصريح فيصحّ
              في المتصفّح والتطبيق معاً. */}
          <a className="a-btn" href="./index.html">
            العودة للرئيسية
          </a>
          <button className="a-btn" onClick={() => signOut()}>
            الخروج
          </button>
        </div>
      </header>

      {/* البطاقات حساباتٌ ورصيد، فهي للمدير العامّ — و`admin_stats` تردّ
          المحرّرَ بـ`not_super` على أيّ حال. */}
      {superAdmin && (
        <div className="a-tiles">
          <Tile n={stats?.users} label="حساب" />
          <Tile n={stats?.sessions} label="جلسة" />
          <Tile n={stats?.played_today} label="اليوم" />
          <Tile n={stats?.open} label="مفتوحة" />
          <Tile n={stats?.finished} label="مكتملة" />
          <Tile n={stats?.abandoned} label="منسحبة" />
          <Tile n={stats?.balance} label="رصيد قائم" />
          <Tile n={stats?.redemptions} label="إضافة هدية" />
        </div>
      )}

      <nav className="a-tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={'a-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'users' && <Users onChanged={reloadStats} me={session.user.id} />}
      {tab === 'sessions' && <Sessions />}
      {tab === 'codes' && <Codes onChanged={reloadStats} />}
      {tab === 'reports' && <Reports />}
      {tab === 'messages' && <Messages />}
      {tab === 'questions' && <Questions />}
      {tab === 'categories' && <Categories />}
      {tab === 'drafts' && <Drafts />}
      {tab === 'uploads' && <Uploads />}
      {tab === 'insights' && <Insights />}
      {tab === 'backups' && <Backups />}
      {tab === 'audit' && <Audit />}
    </div>
  )
}

function Tile({ n, label }: { n?: number; label: string }) {
  return (
    <div className="a-tile">
      <b className="num">{n === undefined ? '…' : n}</b>
      <span>{label}</span>
    </div>
  )
}
