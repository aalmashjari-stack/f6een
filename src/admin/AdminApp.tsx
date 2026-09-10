import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signInWithEmail, signInWithGoogle, signOut, useSession } from '../lib/auth'
import { day, stamp } from '../lib/date'
import type { AdminMessage } from '../lib/messages'
import { fetchMessages, setMessageStatus } from '../lib/messages'
import type {
  AdminCode,
  AdminFlag,
  AdminQuestionEdit,
  AdminSession,
  AdminStats,
  AdminUser,
  CategoryRow,
  GroupRow,
  DraftBatch,
  DraftRow,
} from '../lib/admin'
import { uploadArt } from '../lib/uploads'
import { isImageUrl } from '../game/celebs'
import { shippedImage } from '../game/shippedImage'
import type { Plan } from '../lib/importQuestions'
import { buildPlan, questionsToCsv, readTable } from '../lib/importQuestions'
import type { Question } from '../game/types'
import {
  addCategory,
  addGroup,
  approveDrafts,
  bankMode,
  createCode,
  deleteCategory,
  deleteCode,
  deleteGroup,
  deleteQuestionEdit,
  deleteQuestions,
  fetchStats,
  importQuestions,
  isAdmin,
  isSuper,
  setAdminRole,
  listCodes,
  listDraftBatches,
  listDraftRows,
  listFlags,
  listCategoryRows,
  listExtraCategories,
  listGroups,
  listQuestionEdits,
  listSessions,
  listUsers,
  rejectDrafts,
  renameGroup,
  reorderGroups,
  saveCategoryArt,
  setCategoryGroup,
  saveQuestion,
  seedBank,
  setBalance,
  setBankMode,
  setFlag,
} from '../lib/admin'

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

/* ============================== بوّابة الدخول ============================== */

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
          هذا الحساب ({email}) ليس مديراً. الصلاحية يمنحها المديرُ العامّ من لسان
          «الحسابات» في هذه اللوحة.
        </p>
        <button className="a-btn" onClick={() => signOut()}>
          الخروج
        </button>
      </div>
    </div>
  )
}

/* ================================ اللوحة ================================ */

type Tab = 'users' | 'sessions' | 'codes' | 'reports' | 'messages' | 'questions' | 'categories' | 'drafts'

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
  ['reports', 'البلاغات', false],
  ['users', 'الحسابات', true],
  ['sessions', 'الجلسات', true],
  ['codes', 'أكواد الهدية', true],
  ['messages', 'الرسائل', true],
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
          <button
            key={id}
            className={'a-tab' + (tab === id ? ' on' : '')}
            onClick={() => setTab(id)}
          >
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

/**
 * حِمل مشترك لكل لسان: قراءة، ثمّ إمّا خطأ أو بيانات.
 *
 * `reload` تُعاد بعد كل كتابة — القاعدة هي المصدر، والتعديل المحلّي المتفائل
 * يُظهر رقماً لم تقبله القاعدة.
 */
function useLoad<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const reload = useCallback(() => {
    fn()
      .then((d) => {
        setData(d)
        setErr(null)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'تعذّرت القراءة'))
    /* الدالّة تُبنى في كل عرض، ووضعها في التبعيّات يجعل الأثر يدور بلا نهاية. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(reload, [reload])
  return { data, err, reload }
}

/* ================================ الحسابات ================================ */

function Users({ onChanged, me }: { onChanged: () => void; me: string }) {
  const { data, err, reload } = useLoad<AdminUser[]>(listUsers)
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    if (!data) return null
    const needle = q.trim().toLowerCase()
    if (!needle) return data
    return data.filter((u) =>
      [u.email, u.name, u.phone].some((v) => (v ?? '').toLowerCase().includes(needle)),
    )
  }, [data, q])

  if (err) return <p className="a-err">{err}</p>
  if (!rows) return <p className="a-note">…</p>

  return (
    <>
      <div className="a-bar">
        <input
          className="a-in"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث ببريد أو اسم أو هاتف"
        />
        <span className="muted num">{rows.length}</span>
      </div>

      <div className="a-card a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th>البريد</th>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>الميلاد</th>
              <th>عضو منذ</th>
              <th>لعب</th>
              <th>آخر لعبة</th>
              <th>أسئلة رآها</th>
              <th>الرصيد</th>
              <th>الصلاحية</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                me={me}
                onSaved={() => {
                  reload()
                  onChanged()
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function UserRow({ user, onSaved, me }: { user: AdminUser; onSaved: () => void; me: string }) {
  const [val, setVal] = useState(String(user.balance ?? 0))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  /* الصلاحية منتقٍ وزرُّ حفظ — لا شارةً وزرَّين.
     ثلاثةُ عناصر لا تسعها خليّةُ جدولٍ ضيّقة: تتكدّس إن التفّت، وتُقصّ إن
     لم تلتفّ. والدور صفةٌ واحدة من ثلاث، فالمنتقي يقولها ويغيّرها معاً.
     وزرُّ الحفظ لا يعمل إلّا إذا تغيّر الاختيار — فهو تأكيدُ السحب نفسه،
     بنفس شكل خليّة الرصيد المجاورة. */
  const current = user.role ?? ''
  const [pick, setPick] = useState<string>(current)
  /* القائمة تُعاد تحميلها بعد كل حفظ والصفُّ يبقى بمفتاحه، فلا يُعاد بناء
     الحالة — بلا هذا يبقى المنتقي على الاختيار القديم بعد نجاح الحفظ. */
  useEffect(() => setPick(current), [current])
  const roleDirty = pick !== current

  async function saveRole() {
    setErr(null)
    setBusy(true)
    try {
      await setAdminRole(user.id, (pick || null) as 'super' | 'editor' | null)
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذّر تغيير الصلاحية')
    } finally {
      setBusy(false)
    }
  }

  const dirty = val !== String(user.balance ?? 0)

  async function save() {
    const n = Number(val)
    if (!Number.isInteger(n) || n < 0) {
      setErr('رقم صحيح لا يقلّ عن صفر')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      await setBalance(user.id, n)
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr>
      <td className="ltr">{user.email ?? <span className="muted">بلا بريد</span>}</td>
      <td>{user.name ?? <span className="muted">—</span>}</td>
      <td className="ltr">{user.phone ?? <span className="muted">—</span>}</td>
      <td className="num">{user.birth_date ?? '—'}</td>
      <td className="num">{day(user.joined_at)}</td>
      <td className="num">{user.games}</td>
      <td className="num">{user.last_game ? day(user.last_game) : '—'}</td>
      <td className="num">{user.questions_seen}</td>
      <td>
        <span className="a-acts">
          <input
            className="a-num"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            inputMode="numeric"
            aria-label="الرصيد"
          />
          <button className="a-btn go" disabled={!dirty || busy} onClick={save}>
            {busy ? '…' : 'حفظ'}
          </button>
          {err && <span className="a-err">{err}</span>}
        </span>
      </td>
      <td>
        {/* المديرُ لا يغيّر دورَ نفسه — والقاعدة تردّه بـ`cannot_change_self`
            لو حاول. وهو القيدُ الذي يضمن بقاء مديرٍ عامّ واحد على الأقلّ. */}
        {user.id === me ? (
          <span className="tag open">أنت</span>
        ) : (
          <span className="a-acts">
            <select
              className="a-in a-role-pick"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              aria-label="الصلاحية"
            >
              <option value="">بلا صلاحية</option>
              <option value="editor">محرّر أسئلة</option>
              <option value="super">مدير عامّ</option>
            </select>
            <button className="a-btn go" disabled={!roleDirty || busy} onClick={saveRole}>
              {busy ? '…' : 'حفظ'}
            </button>
          </span>
        )}
      </td>
    </tr>
  )
}

/* ================================ الجلسات ================================ */

const STATUS: Record<AdminSession['status'], string> = {
  open: 'مفتوحة',
  finished: 'مكتملة',
  abandoned: 'منسحبة',
}

function Sessions() {
  const { data, err } = useLoad<AdminSession[]>(() => listSessions(200))
  if (err) return <p className="a-err">{err}</p>
  if (!data) return <p className="a-note">…</p>
  if (data.length === 0) return <p className="a-note">لا جلسات بعد.</p>

  return (
    <div className="a-card a-scroll">
      <table className="a-tbl">
        <thead>
          <tr>
            <th>البدء</th>
            <th>آخر حركة</th>
            <th>الحساب</th>
            <th>الفريقان</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id}>
              <td className="num">{stamp(s.created_at)}</td>
              <td className="num">{stamp(s.updated_at)}</td>
              <td className="ltr">{s.email ?? '—'}</td>
              <td>
                {s.teams && s.teams.length === 2 ? (
                  <>
                    {s.teams[0].name} <span className="num">{s.teams[0].score}</span>
                    <span className="muted"> · </span>
                    {s.teams[1].name} <span className="num">{s.teams[1].score}</span>
                  </>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <span className={'tag ' + s.status}>{STATUS[s.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ============================== أكواد الهدية ============================== */

function Codes({ onChanged }: { onChanged: () => void }) {
  const { data, err, reload } = useLoad<AdminCode[]>(listCodes)
  const [code, setCode] = useState('')
  const [games, setGames] = useState('1')
  const [max, setMax] = useState('')
  const [expires, setExpires] = useState('')
  const [owner, setOwner] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const made = await createCode({
        code,
        games: Number(games) || 1,
        max: max.trim() ? Number(max) : null,
        expires: expires || null,
        owner: owner.trim() || null,
      })
      setCode('')
      setOwner('')
      setMsg({ ok: true, text: `أُنشئ الكود ${made}` })
      reload()
      onChanged()
    } catch (e2) {
      setMsg({ ok: false, text: e2 instanceof Error ? e2.message : 'تعذّر الإنشاء' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: string) {
    setMsg(null)
    try {
      await deleteCode(c)
      reload()
      onChanged()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الحذف' })
    }
  }

  return (
    <>
      <form className="a-form" onSubmit={create}>
        <div className="a-field">
          <label htmlFor="c-code">الكود</label>
          <input
            id="c-code"
            className="a-in ltr"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="F6EEN-ALI"
          />
        </div>
        <div className="a-field">
          <label htmlFor="c-games">ألعاب</label>
          <input
            id="c-games"
            className="a-num"
            value={games}
            onChange={(e) => setGames(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="a-field">
          <label htmlFor="c-max">السقف</label>
          <input
            id="c-max"
            className="a-num"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="∞"
            inputMode="numeric"
          />
        </div>
        <div className="a-field">
          <label htmlFor="c-exp">ينتهي</label>
          <input
            id="c-exp"
            className="a-in"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </div>
        <div className="a-field">
          <label htmlFor="c-owner">صاحبه</label>
          <input
            id="c-owner"
            className="a-in"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="اسم المؤثّر"
          />
        </div>
        <button className="a-btn go" type="submit" disabled={busy || code.trim().length < 3}>
          {busy ? '…' : 'إنشاء'}
        </button>
        {msg && <p className={msg.ok ? 'a-ok' : 'a-err'}>{msg.text}</p>}
      </form>

      {err && <p className="a-err">{err}</p>}
      {!err && !data && <p className="a-note">…</p>}
      {data && data.length === 0 && <p className="a-note">لا أكواد بعد.</p>}
      {data && data.length > 0 && (
        <div className="a-card a-scroll">
          <table className="a-tbl">
            <thead>
              <tr>
                <th>الكود</th>
                <th>يمنح</th>
                <th>أُضيف</th>
                <th>السقف</th>
                <th>ينتهي</th>
                <th>صاحبه</th>
                <th>أُنشئ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <CodeRow key={c.code} code={c} onDelete={() => remove(c.code)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function CodeRow({ code, onDelete }: { code: AdminCode; onDelete: () => void }) {
  const [armed, setArmed] = useState(false)
  const dead = code.expires_at !== null && new Date(code.expires_at) < new Date()
  const full = code.max_redemptions !== null && code.redeemed >= code.max_redemptions

  return (
    <tr>
      <td className="ltr">
        <b>{code.code}</b>
      </td>
      <td className="num">{code.games}</td>
      <td className="num">{code.redeemed}</td>
      <td className="num">{code.max_redemptions ?? '∞'}</td>
      <td className="num">
        {code.expires_at ? day(code.expires_at) : '—'}
        {dead && <span className="tag abandoned"> منتهٍ</span>}
        {!dead && full && <span className="tag abandoned"> مكتمل</span>}
      </td>
      <td>{code.owner ?? <span className="muted">—</span>}</td>
      <td className="num">{day(code.created_at)}</td>
      <td>
        {/* الحذف بضغطتين: الصفّ ضيّق والأكواد متجاورة، وضغطةٌ واحدة تمحو كود
            مؤثّرٍ حيّ بلا رجعة. */}
        <button className="a-btn danger" onClick={() => (armed ? onDelete() : setArmed(true))}>
          {armed ? 'تأكيد' : 'حذف'}
        </button>
      </td>
    </tr>
  )
}

/* ============================= بلاغات الأسئلة ============================= */

/**
 * البنك يُحمَّل عند فتح لسان البلاغات وحده — استيراد ديناميكيّ.
 *
 * ستّمئة كيلوبايت من الأسئلة لا معنى لتحميلها لمن فتح اللوحة ليمنح لعبةً
 * ويغلق. ولا تُقرأ البلاغات بلا البنك: القاعدة تحفظ المعرّف وحده، والنصّ
 * يعيش في الملفّ المشحون (`data/questions-bank-v5.json`).
 */
function useBank() {
  const [bank, setBank] = useState<Question[] | null>(null)
  useEffect(() => {
    let alive = true
    import('../game/bank').then((m) => {
      if (alive) setBank(m.ALL_QUESTIONS)
    })
    return () => {
      alive = false
    }
  }, [])
  return bank
}

const FLAG_LABEL: Record<AdminFlag['status'], string> = {
  pending: 'محجوز',
  ok: 'يُسحب',
  disabled: 'ملغى',
}

function Reports() {
  const { data, err, reload } = useLoad<AdminFlag[]>(listFlags)
  const list = useBank()
  const { data: edits } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  /* البنك بعد تركيب التعديلات عليه — كما يراه اللاعب: بالمشحون وحده كان
     بلاغٌ على سؤالٍ أضافته اللوحة يظهر معرّفاً بلا نصّ، والمعدَّلُ بنصّه القديم. */
  const bank = useMemo(
    () => (list && edits ? new Map(merge(list, edits).map((r) => [r.q.id, r.q])) : null),
    [list, edits],
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function decide(id: string, status: AdminFlag['status']) {
    setBusy(id)
    setMsg(null)
    try {
      await setFlag(id, status)
      reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'تعذّر الحفظ')
    } finally {
      setBusy(null)
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!data) return <p className="a-note">…</p>
  if (data.length === 0) return <p className="a-note">لا بلاغات.</p>

  return (
    <>
      {msg && <p className="a-err">{msg}</p>}
      {/* المحجوز لا يُسحب لأحد حتى يُراجَع — والصفّ يقول ذلك صراحةً كي لا
          يُترك الطابور بظنّ أنّ البلاغ مجرّد ملاحظة. */}
      <p className="a-note">
        السؤال المحجوز لا يظهر لأيّ لاعب. «يُسحب» يعيده، و«ملغى» يمنعه نهائياً.
      </p>
      <div className="a-card a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th>الحالة</th>
              <th>السؤال</th>
              <th>الإجابة</th>
              <th>التصنيف</th>
              <th>بلاغات</th>
              <th>آخر بلاغ</th>
              <th>القرار</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => {
              const q = bank?.get(f.question_id)
              return (
                <tr key={f.question_id}>
                  <td>
                    <span className={'tag ' + (f.status === 'pending' ? 'open' : f.status === 'disabled' ? 'abandoned' : 'finished')}>
                      {FLAG_LABEL[f.status]}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 420 }}>
                    {q ? (
                      q.question
                    ) : (
                      <span className="muted">{bank ? f.question_id : '…'}</span>
                    )}
                  </td>
                  <td>{q?.answer ?? '—'}</td>
                  <td>{q ? `${q.category} · ${q.level}` : '—'}</td>
                  <td className="num">{f.reports}</td>
                  <td className="num">{day(f.last_at)}</td>
                  <td>
                    <span className="a-acts">
                      <button
                        className="a-btn go"
                        disabled={busy === f.question_id || f.status === 'ok'}
                        onClick={() => decide(f.question_id, 'ok')}
                      >
                        أعِده
                      </button>
                      <button
                        className="a-btn danger"
                        disabled={busy === f.question_id || f.status === 'disabled'}
                        onClick={() => decide(f.question_id, 'disabled')}
                      >
                        ألغِه
                      </button>
                      {f.status !== 'pending' && (
                        <button
                          className="a-btn"
                          disabled={busy === f.question_id}
                          onClick={() => decide(f.question_id, 'pending')}
                        >
                          احجزه
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ================================ الأسئلة ================================ */

const LEVELS = ['سهل', 'متوسط', 'صعب', 'تعجيزي']

/**
 * حدّ الخليّة — عشرون سؤالاً لكل (فئة × مستوى)، وهو ما تفرضه
 * `assert_cell_floor` في القاعدة و`bank.test.ts` على الملفّ.
 *
 * مكتوبٌ هنا للعرض وحده: اللوحة تقوله قبل أن تُردّ المحاولة، والقاعدة هي
 * التي تمنع. فمن غيّره في الهجرة فليغيّره هنا — ولا عكس.
 */
const CELL_FLOOR = 20
const PAGE = 60

type Source = 'bank' | 'edited' | 'added'

interface Row {
  q: Question
  source: Source
  origin?: AdminQuestionEdit['origin']
  /** له صفٌّ في القاعدة، فالحذف يطاله. المشحونُ بلا صفٍّ لا يُحذف. */
  deletable: boolean
}

const SOURCE_LABEL: Record<Source, string> = {
  bank: 'البنك',
  edited: 'معدَّل',
  added: 'مضاف',
}

/**
 * كل الأسئلة: البنك المشحون مدموجاً بما عُدّل وأُضيف.
 *
 * **الدمج في المتصفّح لا في القاعدة.** البنك ملفٌّ تحمله هذه الصفحة أصلاً،
 * والقاعدة لا تعرف منه شيئاً — فيها الفرق وحده. ولو أُرسل البنك كلّه إلى
 * القاعدة ليُدمج هناك لصار لكل سؤالٍ نسختان تفترقان عند أوّل إصدار.
 */
const SOURCE_OF: Record<AdminQuestionEdit['origin'], Source> = {
  bank: 'bank',
  override: 'edited',
  new: 'added',
}

/**
 * البنك المشحون بعد تركيب التعديلات — نفس دمج المحرّك، بمصدر كل صفّ.
 *
 * `live` = القاعدة صارت مرجع الأسئلة (مفتاح `bank_in_db`). حينها **لا
 * يُدمج الملفّ أصلاً**: صفوف القاعدة هي البنك كلّه، ودمجُ الملفّ فوقها
 * يعيد كل سؤالٍ حذفتَه.
 */
function merge(
  bank: Question[],
  edits: AdminQuestionEdit[],
  /* صفٌّ واحد بـ`origin = 'bank'` يكفي دليلاً: البنك انتُقل. الشاشاتُ
     الأخرى (البلاغات والفئات) لا تسأل المفتاح، فتكفيها هذه القرينة. */
  live = edits.some((e) => e.origin === 'bank'),
): Row[] {
  if (live) {
    return edits.map((e) => ({
      q: toQuestion(e),
      source: SOURCE_OF[e.origin] ?? 'added',
      origin: e.origin,
      deletable: true,
    }))
  }

  const byId = new Map(edits.map((e) => [e.question_id, e]))
  const out: Row[] = bank.map((base) => {
    const e = byId.get(base.id)
    return e
      ? { q: toQuestion(e), source: 'edited' as const, origin: e.origin, deletable: true }
      : { q: base, source: 'bank' as const, deletable: false }
  })
  for (const e of edits) {
    if (e.origin === 'new')
      out.push({ q: toQuestion(e), source: 'added', origin: 'new', deletable: true })
  }
  return out
}

function Questions() {
  const bank = useBank()
  const { data: edits, err, reload } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  const { data: extra } = useLoad<string[]>(listExtraCategories)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [level, setLevel] = useState('')
  const [source, setSource] = useState<Source | ''>('')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  /* المحدَّد بمعرّفاته لا بمواضعه: الصفوف تتبدّل مع التصفية والترقيم. */
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [wiping, setWiping] = useState(0)

  /* مرجعُ الأسئلة: القاعدة أم ملفّ التطبيق. `null` = لم يصل الجواب بعد،
     فتُعرض الصفحةُ على الوضع القديم حتى يصل — لا شاشةَ انتظارٍ لأجل مفتاح. */
  const [live, setLive] = useState<boolean | null>(null)
  const [seeding, setSeeding] = useState<{ done: number; total: number } | null>(null)
  useEffect(() => {
    let alive = true
    bankMode()
      .then((v) => alive && setLive(v))
      .catch(() => alive && setLive(false))
    return () => {
      alive = false
    }
  }, [])

  const rows: Row[] | null = useMemo(
    () => (bank && edits ? merge(bank, edits, live ?? undefined) : null),
    [bank, edits, live],
  )

  const shown = useMemo(() => {
    if (!rows) return null
    const needle = q.trim()
    return rows.filter(
      (r) =>
        (!needle || r.q.question.includes(needle) || r.q.answer.includes(needle) || r.q.id === needle) &&
        (!cat || r.q.category === cat) &&
        (!level || r.q.level === level) &&
        (!source || r.source === source),
    )
  }, [rows, q, cat, level, source])

  /**
   * تصديرُ ما تراه لا ما في القاعدة: `shown` بعد التصفية، فتصفية «سيارات»
   * ثمّ التصدير تعطي أسئلتها وحدها.
   *
   * والأعمدة أعمدةُ المستورِد نفسها (`HEADERS` في importQuestions) ومعها
   * المعرّف — فيدور الملفّ ذهاباً وإياباً: تُصدّر، وتُصحّح في إكسل، وتُرفع
   * من «رفع ملفّ» فتحلّ التصحيحات محلّ الأصل بعمود المعرّف.
   */
  function exportCsv() {
    if (!shown || shown.length === 0) return
    const csv = questionsToCsv(shown.map((r) => r.q))
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `أسئلة-فطين${cat ? '-' + cat : ''}${level ? '-' + level : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* المشحونُ بلا صفٍّ في القاعدة لا يُحذف. وبعد النقل لكل سؤالٍ صفٌّ،
     فيصير الجميع قابلاً للتحديد. */
  /* الصورة المكبَّرة داخل اللوحة لا في لسانٍ جديد: مراجعة خمسين صورة
     بفتح خمسين لساناً وإغلاقها ليست مراجعة (طلب علي ٨ سبتمبر ٢٠٢٦). */
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null)
  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  const selectable = useMemo(() => (shown ?? []).filter((r) => r.deletable), [shown])
  const allPicked = selectable.length > 0 && selectable.every((r) => picked.has(r.q.id))

  /* تبدّلت التصفية: يسقط التحديد. وإلّا حذف الحكمُ صفوفاً لا يراها. */
  useEffect(() => setPicked(new Set()), [q, cat, level, source])

  function toggleOne(id: string) {
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toggleAll() {
    setPicked(allPicked ? new Set() : new Set(selectable.map((r) => r.q.id)))
  }

  /**
   * حذفُ المحدَّد — **نداءٌ واحد في معاملةٍ واحدة**.
   *
   * كان صفّاً صفّاً، فوقف حذفُ «سيارات» عند ستّين: حارسُ الخليّة في القاعدة
   * يقيس كلَّ حذفٍ وحده، ولا يرى أنّ الحكم يفرغ الخليّة كلّها — يرى نزولاً
   * من عشرين إلى تسعة عشر فيردّه، ولا سبيل من عشرين إلى صفرٍ بخطوة.
   *
   * والرسالة تفصل بين فعلين مختلفين تحت زرٍّ واحد: المضاف والمنقول **يُمحيان**،
   * والمعدَّل **يعود أصلاً في الملفّ ولا يختفي من اللعبة**. خلطُهما يجعل الحكم
   * يظنّ أنّه محا ثلاثين سؤالاً وقد محا عشرة وأعاد عشرين.
   */
  async function removePicked() {
    const rows = selectable.filter((r) => picked.has(r.q.id))
    if (rows.length === 0) return
    const added = rows.filter((r) => r.source === 'added').length
    const banked = rows.filter((r) => r.source === 'bank').length
    const edited = rows.length - added - banked
    /* **«أعِد الأصل» معناه مشروطٌ بالمرجع.** حين كان الملفّ مرجعاً، حذفُ صفّ
       التعديل يُظهر أصلَه المشحون ثانيةً. وبعد نقل البنك لم يعد الملفّ يُقرأ:
       صفُّ التعديل هو السؤال كلُّه — والبذرةُ تخطّته عمداً كي لا تمحو تعديلك
       (`on conflict do nothing`) — فحذفُه محوٌ لا تراجع. */
    const what = live
      ? `محوُ ${rows.length} سؤالاً نهائياً`
      : [
          added ? `محوُ ${added} سؤالاً مضافاً نهائياً` : '',
          banked ? `محوُ ${banked} سؤالاً من البنك نهائياً` : '',
          edited ? `إعادةُ ${edited} سؤالاً من البنك إلى أصله` : '',
        ].filter(Boolean).join(' و')
    if (!window.confirm(`${what}. متأكّد؟`)) return

    setMsg(null)
    setWiping(rows.length)
    try {
      const n = await deleteQuestions(rows.map((r) => r.q.id))
      setPicked(new Set())
      setMsg(`تمّ على ${n} سؤالاً`)
    } catch (e) {
      /* المعاملة تُرجَع كلُّها عند الرفض، فلا يُحذف شيء — والتحديد يبقى
         كما هو ليصحّح الحكمُ اختيارَه بدل أن يعيد بناءه. */
      setMsg(e instanceof Error ? `${e.message} — لم يُحذف شيء` : 'تعذّر الحذف')
    }
    setWiping(0)
    reload()
  }

  async function remove(row: Row) {
    setMsg(null)
    try {
      const kind = await deleteQuestionEdit(row.q.id)
      setMsg(!live && kind === 'override' ? 'أُعيد سؤال البنك كما كان' : 'حُذف السؤال')
      reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'تعذّر الحذف')
    }
  }

  /**
   * نقلُ البنك إلى القاعدة — خطوتان في ضغطة.
   *
   * الزرعُ لا يمسّ صفّاً قائماً، فتعديلاتُك السابقة تبقى؛ ثمّ يُقلب المفتاح
   * ولا تقبله القاعدة إلّا إن بلغت كلُّ خليّةٍ حدَّها. فإن انقطعت الشبكة في
   * المنتصف بقي المفتاحُ مطفأً واللعبةُ على ملفّها — وإعادةُ الضغط تُكمل.
   */
  async function migrate() {
    if (!bank) return
    if (!window.confirm(`نقلُ ${bank.length} سؤالاً إلى القاعدة. ما عدّلتَه لا يُمسّ. متأكّد؟`)) return
    setMsg(null)
    try {
      const payload = bank.map((b) => ({
        id: b.id,
        category: b.category,
        level: b.level as string,
        topic: b.topic ?? '',
        question: b.question,
        answer: b.answer,
        image: b.image ?? null,
        answer_image: b.answerImage ?? null,
        family: b.family ?? null,
      }))
      setSeeding({ done: 0, total: payload.length })
      const res = await seedBank(payload, (done, total) => setSeeding({ done, total }))
      setSeeding(null)
      const total = await setBankMode(true, payload.length)
      setLive(true)
      setMsg(`تمّ النقل — أُضيف ${res.inserted}، والمجموع في القاعدة ${total}. القاعدة صارت المرجع.`)
      reload()
    } catch (e) {
      setSeeding(null)
      setMsg(e instanceof Error ? e.message : 'تعذّر النقل')
    }
  }

  /** رجوعٌ آمن: الأسئلة تعود من ملفّ التطبيق، وصفوفُ القاعدة تبقى مكانها. */
  async function revert() {
    if (!window.confirm('يعود مرجع الأسئلة إلى ملفّ التطبيق. ما حذفتَه من البنك يظهر ثانيةً. متأكّد؟'))
      return
    setMsg(null)
    try {
      await setBankMode(false)
      setLive(false)
      setMsg('المرجع الآن ملفّ التطبيق')
      reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'تعذّر التبديل')
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!shown) return <p className="a-note">…</p>

  /* فئات البنك ثمّ المضافة: النموذج يجب أن يعرض فئةً أُنشئت للتوّ وهي بعد
     فارغة — وإلّا لم يكن لإنشائها معنى. */
  const categories = [
    ...new Set([...(bank ?? []).map((b) => b.category), ...(extra ?? [])]),
  ]

  return (
    <>
      {/* مرجعُ الأسئلة معروضٌ دائماً: هو ما يفسّر لماذا يُحذف سؤالٌ ولا يُحذف
          آخر. كان الفرق صامتاً فبدا الزرُّ معطوباً. */}
      <div className="a-bar">
        {live === true ? (
          <>
            <span className="tag open">مرجع الأسئلة: القاعدة</span>
            <button className="a-btn" onClick={revert}>
              أعِد المرجع إلى ملفّ التطبيق
            </button>
          </>
        ) : (
          <>
            <span className="tag">مرجع الأسئلة: ملفّ التطبيق</span>
            <button
              className="a-btn go"
              onClick={migrate}
              disabled={!bank || live === null || seeding !== null}
            >
              {seeding
                ? `يُنقل… ${seeding.done} / ${seeding.total}`
                : `نقل البنك إلى القاعدة (${bank?.length ?? 0})`}
            </button>
          </>
        )}
      </div>

      <div className="a-bar">
        <input
          className="a-in"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث في السؤال أو الإجابة أو المعرّف"
        />
        <select className="a-in" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="a-in" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">كل المستويات</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="a-in"
          value={source}
          onChange={(e) => setSource(e.target.value as Source | '')}
        >
          <option value="">الكلّ</option>
          <option value="bank">البنك</option>
          <option value="edited">معدَّل</option>
          <option value="added">مضاف</option>
        </select>
        <span className="muted num">{shown.length}</span>
        <button className="a-btn go" onClick={() => setEditing('new')}>
          سؤال جديد
        </button>
        <button className="a-btn" onClick={() => setImporting(true)}>
          رفع ملفّ
        </button>
        {/* التصدير بجوار الرفع: البابان واحد — يخرج الملفّ ويعود مصحَّحاً. */}
        <button className="a-btn" onClick={exportCsv} disabled={shown.length === 0}>
          تصدير CSV
        </button>
        {/* ظاهرٌ دائماً ومعطَّلٌ حتى يُحدَّد شيء (٥ سبتمبر ٢٠٢٦). كان يظهر عند
            التحديد وحده — أخفيتُه لئلّا يكون إغراءً بضغطةٍ لا رجعة فيها،
            فصار الاختفاءُ نفسه يُقرأ «الميزة غير موجودة». والتعطيل حارسٌ
            يكفي. */}
        <button
          className="a-btn danger"
          onClick={removePicked}
          disabled={picked.size === 0 || wiping > 0}
        >
          {wiping > 0 ? `يُحذف… ${wiping}` : `حذف المحدَّد (${picked.size})`}
        </button>
      </div>

      {msg && <p className="a-note">{msg}</p>}

      {/* طبقةُ التكبير: الخلفية تُغلق بالضغط، ومعها زرُّ ✕ ظاهر ومفتاحُ
          الهروب. والإجابةُ تحت الصورة، فمراجعةُ فئةٍ مصوَّرة أن ترى الصورة
          وجوابَها معاً لا الصورةَ وحدها. */}
      {zoom && (
        <div className="pv-back" role="dialog" aria-modal="true" onClick={() => setZoom(null)}>
          <button
            type="button"
            className="pv-x"
            aria-label="إغلاق"
            onClick={(e) => {
              e.stopPropagation()
              setZoom(null)
            }}
          >
            ✕
          </button>
          <img src={zoom.src} alt="" onClick={(e) => e.stopPropagation()} />
          <span className="pv-label">{zoom.label}</span>
        </div>
      )}

      <div className="a-card a-scroll">
        <table className="a-tbl a-tbl-q">
          {/* الأعمدة تُقاس هنا لا من محتواها (`table-layout: fixed` في
              admin.css): السؤالُ يأخذ ما بقي، والباقي بعرضٍ يكفي أطولَ ما
              فيه. وبهذا يظهر الجدول كلُّه بلا تمريرٍ أفقيّ على شاشة الحاسب. */}
          <colgroup>
            <col style={{ width: 38 }} />
            <col style={{ width: 84 }} />
            <col />
            <col style={{ width: 220 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 82 }} />
            <col style={{ width: 158 }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                {/* تُحدّد كلَّ ما بعد التصفية لا الصفحةَ المعروضة وحدها —
                    «امسح كل شيء» يعني كلَّ ما صفّيتَه. والعنوان يقول العدد. */}
                <input
                  type="checkbox"
                  checked={allPicked}
                  onChange={toggleAll}
                  disabled={selectable.length === 0}
                  title={`تحديد الكلّ (${selectable.length})`}
                />
              </th>
              <th>المصدر</th>
              <th>السؤال</th>
              <th>الإجابة</th>
              <th>التصنيف</th>
              <th>المستوى</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map((r) => (
              <tr key={r.q.id}>
                <td className="mid">
                  {/* خانةٌ في كل صفّ، والمشحونُ **معطَّلٌ لا مخفيّ**: إخفاؤها
                      جعل الصفحة الأولى — وكلُّها بنك — تبدو بلا ميزةٍ أصلاً. */}
                  <input
                    type="checkbox"
                    checked={picked.has(r.q.id)}
                    onChange={() => toggleOne(r.q.id)}
                    disabled={!r.deletable}
                    title={r.deletable ? undefined : 'سؤالٌ في ملفّ التطبيق — انقل البنك إلى القاعدة ليُحذف'}
                  />
                </td>
                <td className="mid">
                  <span className={'tag' + (r.source === 'bank' ? '' : ' open')}>
                    {SOURCE_LABEL[r.source]}
                  </span>
                </td>
                <td>
                  {/* مصغَّرةٌ لا كلمةُ «[صورة]»: خمسون سؤالَ معالم لا تُراجَع
                      بفتح كلّ واحدٍ منها على حدة (بلاغ علي ٨ سبتمبر ٢٠٢٦).
                      والضغطة تفتح الأصل في لسانٍ جديد لمن أراد التدقيق. */}
                  {r.q.image ? (
                    <span className="q-thumb-wrap">
                      <QThumb image={r.q.image} label={r.q.answer} onZoom={setZoom} />
                      <span>{r.q.question}</span>
                    </span>
                  ) : (
                    r.q.question
                  )}
                </td>
                {/* وجهُ الإجابة يجاور الإجابة لا السؤال — هناك يظهر في اللعب. */}
                <td>
                  {r.q.answerImage ? (
                    <span className="q-thumb-wrap">
                      <QThumb image={r.q.answerImage} label={r.q.answer} onZoom={setZoom} />
                      <span>{r.q.answer}</span>
                    </span>
                  ) : (
                    r.q.answer
                  )}
                </td>
                <td>{r.q.category}</td>
                <td>{r.q.level}</td>
                <td className="mid">
                  <span className="a-acts">
                    <button className="a-btn" onClick={() => setEditing(r)}>
                      تعديل
                    </button>
                    {r.deletable && (
                      <button className="a-btn danger" onClick={() => remove(r)}>
                        {!live && r.source === 'edited' ? 'أعِد الأصل' : 'حذف'}
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shown.length > limit && (
        <div className="a-bar" style={{ marginBlockStart: 10 }}>
          <button className="a-btn" onClick={() => setLimit((n) => n + PAGE * 4)}>
            عرض المزيد ({shown.length - limit})
          </button>
        </div>
      )}

      {importing && rows && (
        <ImportDialog
          categories={categories}
          existing={rows.map((r) => ({
            id: r.q.id,
            question: r.q.question,
            image: r.q.image,
            answerImage: r.q.answerImage,
          }))}
          onClose={() => setImporting(false)}
          onDone={(text) => {
            setImporting(false)
            setMsg(text)
            reload()
          }}
        />
      )}

      {editing && (
        <QuestionForm
          row={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setMsg('حُفظ — يصل اللاعبين عند فتحهم اللعبة')
            reload()
          }}
        />
      )}
    </>
  )
}

/**
 * صورة السؤال في اللوحة: الرابط المرفوع يُعرض كما هو، والمفتاح المشحون
 * (`celeb-…`) يُحلّ إلى ملفّه.
 *
 * كانت تُرجع فراغاً للمفتاح — «معاينةٌ صغيرة لا تستحقّ تحميل صور المشاهير
 * كلّها». والثمن لم يكن تحميلاً: `import.meta.glob` بـ`?url` يجمع مساراتٍ
 * نصّية لا صوراً، والصورة وحدها تُطلب عند عرضها. أمّا الخسارة فكانت أنّ
 * تعديل سؤال «مشاهير» يُظهر إطاراً فارغاً كأنّ صورته ضاعت — وهي سليمة.
 */
/**
 * مصغَّرةُ صورةٍ في الجدول — للسؤال والإجابة معاً.
 *
 * جسمٌ واحد لا جسمان: نسخُه للإجابة كان يكرّر ستّة عشر سطراً بمُعالِجَي
 * ضغطٍ ولوحةِ مفاتيح، وأوّلُ تعديلٍ في أحدهما ينسى الآخر.
 */
function QThumb({
  image,
  label,
  onZoom,
}: {
  image: string
  label: string
  onZoom: (z: { src: string; label: string }) => void
}) {
  const src = resolveImage(image)
  if (!src) return <span className="q-thumb empty" title={image} />
  return (
    <img
      className="q-thumb tap"
      src={src}
      alt=""
      loading="lazy"
      role="button"
      tabIndex={0}
      title="اضغط للتكبير"
      onClick={() => onZoom({ src, label })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onZoom({ src, label })
        }
      }}
    />
  )
}

function resolveImage(image: string): string | null {
  if (isImageUrl(image)) return image
  /* السلسلة في `shippedImage` موضعاً واحداً تخدم اللوحة وشاشة اللعب معاً:
     كانت مكتوبةً هنا وهناك، فغاب مجلّدٌ عن أحدهما مرّتين في يومٍ واحد. */
  return shippedImage(image)
}

function toQuestion(e: AdminQuestionEdit): Question {
  return {
    id: e.question_id,
    category: e.category,
    level: e.level as Question['level'],
    topic: e.topic ?? '',
    question: e.question,
    answer: e.answer,
    ...(e.image ? { image: e.image } : {}),
    ...(e.answer_image ? { answerImage: e.answer_image } : {}),
    ...(e.family ? { family: e.family } : {}),
  }
}

/**
 * نموذج التعديل والإضافة.
 *
 * التصنيف قائمةٌ لا حقل حرّ: العجلة اثنا عشر تصنيفاً ثابتاً (SPEC ٧)، وتصنيف
 * جديد يعني سؤالاً لا تصل إليه العجلة أبداً.
 *
 * ومفتاح الصورة يُحمل كما هو ولا يُحرَّر: الصور مُجمَّعة في حزمة التطبيق،
 * فمفتاحٌ لا ملفّ له يعرض صورة العنصر النائب.
 */
function QuestionForm({
  row,
  categories,
  onClose,
  onSaved,
}: {
  row: Row | null
  categories: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const base = row?.q
  const [category, setCategory] = useState(base?.category ?? categories[0] ?? '')
  const [level, setLevel] = useState(base?.level ?? 'متوسط')
  const [topic, setTopic] = useState(base?.topic ?? '')
  const [question, setQuestion] = useState(base?.question ?? '')
  const [answer, setAnswer] = useState(base?.answer ?? '')
  const [image, setImage] = useState<string | null>(base?.image ?? null)
  const [answerImage, setAnswerImage] = useState<string | null>(base?.answerImage ?? null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await saveQuestion({
        id: base?.id ?? null,
        category,
        level,
        topic,
        question,
        answer,
        image,
        answerImage,
      })
      onSaved()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر الحفظ')
      setBusy(false)
    }
  }

  return (
    <div className="q-veil" onClick={onClose}>
      <form className="q-box" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <header className="a-top" style={{ margin: 0 }}>
          <b>{base ? 'تعديل سؤال' : 'سؤال جديد'}</b>
          {base && <span className="muted ltr">{base.id}</span>}
        </header>

        <div className="a-bar">
          <div className="a-field">
            <label htmlFor="q-cat">التصنيف</label>
            <select
              id="q-cat"
              className="a-in"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="q-lvl">المستوى</label>
            <select
              id="q-lvl"
              className="a-in"
              value={level}
              onChange={(e) => setLevel(e.target.value as Question['level'])}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="q-topic">الموضوع</label>
            <input
              id="q-topic"
              className="a-in"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="اختياري"
            />
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="q-text">السؤال</label>
          <textarea
            id="q-text"
            className="a-in"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="a-field">
          <label htmlFor="q-ans">الإجابة</label>
          <input
            id="q-ans"
            className="a-in"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <div className="a-field">
          <label>الصورة</label>
          <ArtCell
            src={image ? resolveImage(image) : null}
            uploaded={image !== null}
            onPick={async (f) => {
              setErr(null)
              try {
                setImage(await uploadArt(f, 'questions'))
              } catch (e2) {
                setErr(e2 instanceof Error ? e2.message : 'تعذّر رفع الصورة')
              }
            }}
            onClear={() => setImage(null)}
          />
          {/* الصورة تغيّر شكل السؤال كلّه، لا تزيّنه: `QuestionView` يعرضها
              بدل النصّ وفوقها «من صاحب الصورة؟». */}
          <p className="a-note" style={{ padding: 0 }}>
            سؤالٌ بصورة يُعرض صورةً فوقها «من صاحب الصورة؟» — والنصّ لا يظهر، والإجابة اسم صاحبها.
          </p>
        </div>

        <div className="a-field">
          <label>صورة الإجابة</label>
          <ArtCell
            src={answerImage ? resolveImage(answerImage) : null}
            uploaded={answerImage !== null}
            onPick={async (f) => {
              setErr(null)
              try {
                setAnswerImage(await uploadArt(f, 'questions'))
              } catch (e2) {
                setErr(e2 instanceof Error ? e2.message : 'تعذّر رفع الصورة')
              }
            }}
            onClear={() => setAnswerImage(null)}
          />
          {/* عكسُ الحقل الذي فوقه: السؤال يبقى نصّاً، والوجه لا يظهر إلّا في
              شاشة الكشف إلى جانب الاسم. فسؤالٌ عن شيءٍ مشهور واسمٍ مجهول
              يبقى تعجيزيّاً، ويُكافأ المجلس بالوجه حين يُكشف. */}
          <p className="a-note" style={{ padding: 0 }}>
            تظهر في شاشة الكشف إلى جانب الإجابة — والسؤال يبقى نصّاً. لا تضع الاثنتين معاً.
          </p>
        </div>

        {err && <p className="a-err">{err}</p>}

        <div className="a-bar" style={{ marginBlockEnd: 0 }}>
          <button className="a-btn go" type="submit" disabled={busy || !question.trim() || !answer.trim()}>
            {busy ? '…' : 'حفظ'}
          </button>
          <button className="a-btn" type="button" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>

    </div>
  )
}

/* ================================ الفئات ================================ */

/**
 * الفئات: المشحونة مع التطبيق والمضافة من هنا، ومعها ما ينقص كلَّ واحدة.
 *
 * **الرقم الذي يهمّ هو «هل تدخل العجلة؟»** لا عدد أسئلتها: السحب يقع على
 * (فئة، مستوى) والمستوى يتبع موضع السؤال في الجلسة لا اختيار الحكم، ففئةٌ
 * بلا سؤال «صعب» تُسقط اللعبة عند السؤال السابع. ولهذا لا تدخل العجلة حتى
 * تكتمل مستوياتها الثلاثة — والجدول يقول صراحةً ما الناقص.
 */
function Categories() {
  const bank = useBank()
  const { data: edits } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  const { data: cats, err, reload } = useLoad<CategoryRow[]>(listCategoryRows)
  /* التصنيفات تُقرأ مستقلّةً عن الفئات: التصنيف الفارغ الذي لم تدخله فئةٌ
     بعدُ لا أثر له في صفوف الفئات — انظر `listGroups`. */
  const { data: groups, reload: reloadGroups } = useLoad<GroupRow[]>(listGroups)
  const [art, setArt] = useState<Record<string, string> | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* صور الفئات المشحونة تُحمَّل عند فتح اللسان وحده — هي ملفّات صور في
     الحزمة، ولا معنى لتحميلها لمن جاء يمنح لعبة. */
  useEffect(() => {
    let alive = true
    import('../components/categoryArt').then((m) => {
      if (alive) setArt(m.CATEGORY_ART)
    })
    return () => {
      alive = false
    }
  }, [])

  const rows = useMemo(() => {
    if (!bank || !edits || !cats) return null
    const merged = merge(bank, edits)
    const byName = new Map(cats.map((c) => [c.name, c]))
    const extraNames = cats.filter((c) => c.is_extra !== false).map((c) => c.name)
    const names = [...new Set([...bank.map((b) => b.category), ...extraNames])]
    return names.map((cat) => {
      const mine = merged.filter((r) => r.q.category === cat)
      const counts = LEVELS.map((l) => mine.filter((r) => r.q.level === l).length)
      const row = byName.get(cat)
      return {
        cat,
        counts,
        total: mine.length,
        added: row?.is_extra !== false && byName.has(cat) && extraNames.includes(cat),
        uploaded: row?.art_url ?? null,
        shipped: art?.[cat] ?? null,
        missing: LEVELS.filter((_, i) => counts[i] === 0),
        group: row?.group_name ?? null,
        /* ما دون الحدّ يُرى من هنا لا من محاولةٍ تُردّ: الخليّة تحت عشرين
           تمنع الحذف والنقل (`assert_cell_floor`)، وهي أيضاً ما ينقص الفئة
           الجديدة لتصير كاملة. */
        thin: LEVELS.filter((_, i) => counts[i] > 0 && counts[i] < CELL_FLOOR),
      }
    })
  }, [bank, edits, cats, art])

  /** ترتيب العرض: التصنيفات بترتيبها ثمّ ما لا تصنيف له — كشاشة الإعداد. */
  const ordered = useMemo(() => {
    if (!rows) return null
    const at = new Map((groups ?? []).map((g, i) => [g.name, i]))
    return [...rows].sort((a, b) => {
      const ga = a.group === null ? Number.MAX_SAFE_INTEGER : (at.get(a.group) ?? 1e6)
      const gb = b.group === null ? Number.MAX_SAFE_INTEGER : (at.get(b.group) ?? 1e6)
      return ga - gb || a.cat.localeCompare(b.cat, 'ar')
    })
  }, [rows, groups])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const made = await addCategory(name)
      setName('')
      setMsg({ ok: true, text: `أُضيفت «${made}» — تدخل العجلة حين تكتمل مستوياتها الثلاثة` })
      reload()
    } catch (e2) {
      setMsg({ ok: false, text: e2 instanceof Error ? e2.message : 'تعذّرت الإضافة' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(cat: string, total: number) {
    setMsg(null)
    /* الحارسُ في القاعدة (`admin_delete_category`) لا هنا؛ وهذا سبقٌ له
       يقول الرقم: «تحمل أسئلة» وحدها لا تدلّ الحكمَ على كم بقي ولا أين. */
    if (total > 0) {
      setMsg({
        ok: false,
        text: `«${cat}» تحمل ${total} سؤالاً — احذفها من لسان الأسئلة أوّلاً، ثمّ عُد`,
      })
      return
    }
    try {
      await deleteCategory(cat)
      setMsg({ ok: true, text: `حُذفت «${cat}»` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الحذف' })
    }
  }

  /* ── التصنيفات: مظلّاتٌ تجمع الفئات في شاشة الإعداد ── */
  async function moveToGroup(cat: string, group: string | null) {
    setMsg(null)
    try {
      await setCategoryGroup(cat, group)
      setMsg({
        ok: true,
        text: group ? `«${cat}» صارت تحت «${group}»` : `«${cat}» خرجت من تصنيفها`,
      })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر النقل' })
    }
  }

  async function groupAction(run: () => Promise<unknown>, text: string) {
    setMsg(null)
    try {
      await run()
      setMsg({ ok: true, text })
      reloadGroups()
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الفعل' })
    }
  }

  async function art_(cat: string, file: File | null) {
    setMsg(null)
    try {
      const url = file ? await uploadArt(file, 'categories') : null
      await saveCategoryArt(cat, url)
      setMsg({ ok: true, text: url ? `بُدّلت صورة «${cat}»` : `أُعيدت صورة «${cat}» الأصلية` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر رفع الصورة' })
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!rows || !ordered) return <p className="a-note">…</p>

  return (
    <>
      {/* التصنيفات أوّلاً: الفئة تُنشأ ثمّ تُوضع تحت مظلّة، فالمظلّات تُقرأ
          قبلها. وهي طبقةُ عرضٍ لا لعب — قِيلت هنا مرّةً حتى لا تُفهم على
          أنّها تغيّر السحب أو النقاط. */}
      <GroupsBar
        groups={groups ?? []}
        counts={rows.reduce<Record<string, number>>((acc, r) => {
          if (r.group) acc[r.group] = (acc[r.group] ?? 0) + 1
          return acc
        }, {})}
        onAdd={(n) => groupAction(() => addGroup(n), `أُضيف تصنيف «${n}»`)}
        onRename={(o, n) => groupAction(() => renameGroup(o, n), `صار «${o}» يُسمّى «${n}»`)}
        onDelete={(n) => groupAction(() => deleteGroup(n), `حُذف «${n}» — وفئاتُه بلا تصنيف الآن`)}
        onReorder={(names) => groupAction(() => reorderGroups(names), 'رُتّبت التصنيفات')}
      />

      <form className="a-form" onSubmit={add}>
        <div className="a-field">
          <label htmlFor="cat-name">فئة جديدة</label>
          <input
            id="cat-name"
            className="a-in"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الفئة كما يظهر في العجلة"
          />
        </div>
        <button className="a-btn go" type="submit" disabled={busy || name.trim().length < 2}>
          {busy ? '…' : 'إضافة'}
        </button>
        {msg && <p className={msg.ok ? 'a-ok' : 'a-err'}>{msg.text}</p>}
      </form>

      {/* الصورة المرفوعة تُجلب من الشبكة بخلاف المشحونة — أوّل عرضٍ لها
          يحتاج اتّصالاً، ثمّ يخزّنها المتصفّح. */}
      <p className="a-note">
        الصورة المفضّلة بنسبة ٣:٢ وعرض ١٠٢٤ بكسلاً. والمرفوعة تحتاج اتّصالاً في أوّل عرض، بخلاف
        الصور المشحونة مع التطبيق.
      </p>

      <div className="a-card a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الفئة</th>
              <th>التصنيف</th>
              <th>المصدر</th>
              {/* عناوينُ المستويات من مصدرها الواحد. كانت مكتوبةً بيدها على
                  ثلاثة، فلمّا دخل «تعجيزي» في ٩ سبتمبر ٢٠٢٦ صار الجدول
                  أربعةَ أرقامٍ تحت ثلاثة عناوين — و«في العجلة» يقف فوق
                  أرقام التعجيزي. */}
              {LEVELS.map((l) => (
                <th key={l}>{l}</th>
              ))}
              <th>في اللوح</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordered.map((r, i) => (
              <Fragment key={r.cat}>
                {/* عنوانُ المظلّة فوق فئاتها — صفٌّ واحد لا عمودٌ يتكرّر في
                    كل سطر. الجدول مرتَّبٌ بالمظلّة أصلاً (`ordered`)، فتبدُّلُ
                    الاسم عن الصفّ السابق هو الحدُّ بين قسمٍ وقسم. */}
                {(i === 0 || ordered[i - 1].group !== r.group) && (
                  <tr className="grp-row">
                    {/* رقمٌ أكبر من عدد الأعمدة عمداً: المتصفّح يقصّه إلى
                        عرض الصفّ، فلا يحتاج عدّاً يدويّاً ينزاح كلّما
                        أُضيف عمود — وقد انزاح فعلاً في هذا الجدول نفسه
                        (أربعة أرقامٍ تحت ثلاثة عناوين، ٩ سبتمبر ٢٠٢٦). */}
                    <th colSpan={99} scope="colgroup">
                      {r.group ?? 'بلا مظلّة'}
                      <span className="grp-n">
                        {ordered.filter((x) => x.group === r.group).length} فئة
                      </span>
                    </th>
                  </tr>
                )}
              <tr>
                <td>
                  <ArtCell
                    src={r.uploaded ?? r.shipped}
                    uploaded={r.uploaded !== null}
                    onPick={(f) => art_(r.cat, f)}
                    onClear={() => art_(r.cat, null)}
                  />
                </td>
                <td>
                  <b>{r.cat}</b>
                </td>
                <td>
                  {/* قائمةٌ لا حقلٌ يُكتب: تصنيفٌ بخطأ مطبعيّ يصير مظلّةً
                      ثانية بفئةٍ واحدة — نفس علّة الفئة في رفع الملفّ. */}
                  <select
                    className="a-in slim"
                    value={r.group ?? ''}
                    onChange={(e) => moveToGroup(r.cat, e.target.value || null)}
                  >
                    <option value="">— بلا تصنيف —</option>
                    {(groups ?? []).map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={'tag' + (r.added ? ' open' : '')}>
                    {r.added ? 'مضافة' : 'البنك'}
                  </span>
                </td>
                {r.counts.map((n, i) => (
                  <td
                    key={i}
                    /* الخليّة الرقيقة تُرى قبل أن تُردّ: تحت عشرين يمنع
                       القاعدةُ النقلَ منها والحذفَ فيها. */
                    className={'num' + (n === 0 ? ' muted' : n < CELL_FLOOR ? ' thin' : '')}
                    title={n > 0 && n < CELL_FLOOR ? `تحت الحدّ — ينقصها ${CELL_FLOOR - n}` : ''}
                  >
                    {n}
                  </td>
                ))}
                <td>
                  {r.missing.length === 0 ? (
                    r.thin.length === 0 ? (
                      <span className="tag finished">نعم</span>
                    ) : (
                      /* تدخل اللوح فعلاً — الشرط سؤالٌ واحد لا عشرون — لكنّ
                         خليّتها الرقيقة تمنع التعديل عليها، فتُقال. */
                      <span className="tag open">نعم · {r.thin.join(' و')} تحت الحدّ</span>
                    )
                  ) : (
                    <span className="tag abandoned">ينقصها {r.missing.join(' و')}</span>
                  )}
                </td>
                <td>
                  {r.added && (
                    /* **يُضغط دائماً، ويقول سببَه عند الرفض.** كان معطَّلاً
                       والسببُ في تلميحٍ لا يظهر إلّا بالتحويم — فقرأه علي
                       «الزرّ لا يعمل»، وهي ثالث مرّة يخدعه فيها زرٌّ رماديّ
                       (خانةُ التحديد وزرُّ الحذف قبله). الرفضُ المشروح أوضح
                       من التعطيل الصامت. */
                    <button className="a-btn danger" onClick={() => remove(r.cat, r.total)}>
                      حذف
                    </button>
                  )}
                </td>
              </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/**
 * شريط التصنيفات — إضافةٌ وتسميةٌ وترتيبٌ وحذف.
 *
 * **الترتيب يُرسَل كاملاً** لا خطوةً خطوة: «ارفع هذا» يحتاج قراءة الجار
 * وكتابتَه، وضغطتان متسارعتان تتبادلان الرقم نفسه.
 *
 * والحذف لا يشترط الفراغ بخلاف حذف الفئة: الفئة تحمل أسئلتها فتضيع معها،
 * والتصنيف لا يحمل شيئاً — فئاتُه تخرج من مظلّتها وتبقى كما هي.
 */
function GroupsBar({
  groups,
  counts,
  onAdd,
  onRename,
  onDelete,
  onReorder,
}: {
  groups: GroupRow[]
  counts: Record<string, number>
  onAdd: (name: string) => void
  onRename: (oldName: string, newName: string) => void
  onDelete: (name: string) => void
  onReorder: (names: string[]) => void
}) {
  const [name, setName] = useState('')

  function move(i: number, dir: -1 | 1) {
    const next = [...groups.map((g) => g.name)]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onReorder(next)
  }

  function rename(g: GroupRow) {
    const v = window.prompt(`اسمٌ جديد لـ«${g.name}»`, g.name)
    if (v === null) return
    const clean = v.trim()
    if (!clean || clean === g.name) return
    onRename(g.name, clean)
  }

  return (
    <div className="a-card groups-bar">
      <div className="gb-head">
        <b>التصنيفات</b>
        <span className="a-note gb-note">
          مظلّاتٌ تجمع الفئات في شاشة الإعداد — لا تُلعب ولا يُسحب منها، وترتيبُها هنا هو ترتيبُ
          عناوينها هناك.
        </span>
      </div>

      <form
        className="gb-add"
        onSubmit={(e) => {
          e.preventDefault()
          const clean = name.trim()
          if (clean.length < 2) return
          onAdd(clean)
          setName('')
        }}
      >
        <input
          className="a-in"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="تصنيف جديد — «رياضة» مثلاً"
        />
        <button className="a-btn go" type="submit" disabled={name.trim().length < 2}>
          إضافة
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="a-note">لا تصنيف بعد — الفئات كلّها تُعرض في قسمٍ واحد كما كانت.</p>
      ) : (
        <ul className="gb-list">
          {groups.map((g, i) => (
            <li key={g.name}>
              <span className="gb-name">{g.name}</span>
              <span className="gb-count">{counts[g.name] ?? 0} فئة</span>
              <button className="a-btn" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button
                className="a-btn"
                onClick={() => move(i, 1)}
                disabled={i === groups.length - 1}
              >
                ↓
              </button>
              <button className="a-btn" onClick={() => rename(g)}>
                تسمية
              </button>
              <button className="a-btn danger" onClick={() => onDelete(g.name)}>
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .groups-bar { padding:14px 16px; margin-bottom:14px; }
        .gb-head { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
        .gb-note { margin:0; }
        .gb-add { display:flex; gap:8px; margin:10px 0; max-width:520px; }
        .gb-add .a-in { flex:1; }
        .gb-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .gb-list li {
          display:flex; align-items:center; gap:8px;
          padding:6px 10px; border-radius:10px; background:var(--n-surface-2);
        }
        .gb-name { font-weight:800; }
        /* العدّاد يدفع الأزرار إلى الطرف فتصطفّ عمودياً مهما طالت الأسماء. */
        .gb-count { margin-inline-end:auto; opacity:.7; font-size:13px; }
      `}</style>
    </div>
  )
}

/**
 * خانة صورة: معاينة، واختيار ملفّ، وإزالة.
 *
 * الإزالة تظهر للمرفوعة وحدها — الصورة المشحونة في الحزمة لا تُحذف من هنا،
 * وأقصى ما يفعله المدير أن يضع فوقها غيرها.
 */
function ArtCell({
  src,
  uploaded,
  onPick,
  onClear,
}: {
  src: string | null
  uploaded: boolean
  onPick: (f: File) => void
  onClear: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    await Promise.resolve(onPick(f))
    setBusy(false)
  }

  return (
    <span className="art-cell">
      {src ? <img className="art-thumb" src={src} alt="" /> : <span className="art-thumb empty" />}
      <label className="a-btn art-pick">
        {busy ? '…' : uploaded ? 'تبديل' : 'رفع'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
      </label>
      {uploaded && (
        <button className="a-btn danger" onClick={onClear}>
          إزالة
        </button>
      )}
      <style>{`
        .art-cell { display:inline-flex; align-items:center; gap:6px; }
        .art-thumb {
          width:56px; height:38px; object-fit:cover; border-radius:8px;
          background:var(--n-surface-2); display:block;
        }
        .art-thumb.empty { box-shadow:inset 0 0 0 1px var(--n-line); }
        .art-pick { cursor:pointer; }
      `}</style>
    </span>
  )
}

/* ============================== رفع ملفّ أسئلة ============================== */

/**
 * ملفّ إكسل أو CSV → معاينة → رفع.
 *
 * **لا كتابة قبل المعاينة.** ملفّ من مئة سؤال فيه دائماً ما لا يصلح، ورفعُه
 * كما هو يترك المدير أمام خطأٍ واحد لا يعرف أيّ سطرٍ سبّبه. فالفرز في
 * المتصفّح أوّلاً، ولكل صفٍّ مردود سببه ورقم سطره في الملفّ.
 */
function ImportDialog({
  categories,
  existing,
  onClose,
  onDone,
}: {
  categories: string[]
  existing: { id: string; question: string }[]
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr(null)
    setPlan(null)
    try {
      const table = await readTable(f)
      setFileName(f.name)
      setPlan(buildPlan(table, { categories, existing }))
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّرت قراءة الملفّ')
    }
  }

  function template() {
    /* أربعة أعمدة لا ستّة (قرار علي ٣١ أغسطس ٢٠٢٦): «الموضوع» و«المعرّف»
       يبقيان مقبولين في القارئ لمن أراد تعديلاً بالجملة، ولا يُعرضان —
       عمودان فارغان في نموذجٍ يُملأ باليد سؤالٌ بلا جواب. */
    const rows = [
      ['التصنيف', 'المستوى', 'السؤال', 'الإجابة'],
      [categories[0] ?? 'الكويت', 'سهل', 'اكتب سؤالك هنا؟', 'إجابته'],
    ]
    const csv = '\ufeff' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'نموذج-أسئلة-فطين.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function upload() {
    if (!plan || plan.rows.length === 0) return
    setBusy(true)
    setErr(null)
    try {
      const res = await importQuestions(plan.rows, (n) => setDone(n))
      onDone(
        `رُفع الملفّ: أُضيف ${res.added} وعُدّل ${res.updated}` +
          (res.skipped ? ` وتُخطّي ${res.skipped} موجود أصلاً` : '') +
          ' — تصل اللاعبين عند فتحهم اللعبة',
      )
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذّر الرفع')
      setBusy(false)
    }
  }

  return (
    <div className="q-veil" onClick={busy ? undefined : onClose}>
      <div className="q-box" onClick={(e) => e.stopPropagation()}>
        <header className="a-top" style={{ margin: 0 }}>
          <b>رفع ملفّ أسئلة</b>
          {fileName && <span className="muted">{fileName}</span>}
        </header>

        <p className="a-note" style={{ padding: 0 }}>
          أعمدة الملفّ أربعة: <b>التصنيف · المستوى · السؤال · الإجابة</b>. والفئة يجب أن تكون
          موجودة — تُضاف من لسان «الفئات» أوّلاً.
        </p>

        <div className="a-bar">
          <label className="a-btn go" style={{ cursor: 'pointer' }}>
            اختر ملفّاً (xlsx أو csv)
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={pick}
              hidden
              disabled={busy}
            />
          </label>
          {/* نموذجٌ بأعمدته الصحيحة أقصرُ من شرحها: يُفتح في إكسل ويُملأ.
              وعلامة ترتيب البايتات في أوّله تجعل إكسل يقرأ العربية صحيحة. */}
          <button className="a-btn" type="button" onClick={template}>
            حمّل نموذجاً
          </button>
          {plan && (
            <span className="muted">
              <b className="num">{plan.added}</b> إضافة · <b className="num">{plan.updated}</b>{' '}
              تعديل · <b className="num">{plan.rejected.length}</b> مردود
            </span>
          )}
        </div>

        {err && <p className="a-err">{err}</p>}

        {plan && plan.rejected.length > 0 && (
          <div className="a-card a-scroll" style={{ maxHeight: 260 }}>
            <table className="a-tbl">
              <thead>
                <tr>
                  <th>السطر</th>
                  <th>السبب</th>
                  <th>النصّ</th>
                </tr>
              </thead>
              <tbody>
                {plan.rejected.map((r, i) => (
                  <tr key={i}>
                    <td className="num">{r.line}</td>
                    <td>{r.reason}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 340 }}>{r.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {plan && plan.rows.length === 0 && plan.rejected.length > 0 && (
          <p className="a-note" style={{ padding: 0 }}>
            لا صفّ صالحاً في الملفّ — صحّح ما فوق وأعد الاختيار.
          </p>
        )}

        <div className="a-bar" style={{ marginBlockEnd: 0 }}>
          <button
            className="a-btn go"
            disabled={busy || !plan || plan.rows.length === 0}
            onClick={upload}
          >
            {busy ? `… ${done}/${plan?.rows.length ?? 0}` : `ارفع ${plan?.rows.length ?? 0}`}
          </button>
          <button className="a-btn" disabled={busy} onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================== الرسائل ==============================
 * صندوق «تواصل معنا». الحالة ثلاث: جديدة · مقروءة · منتهية — والانتقال
 * بضغطة، فالمدير يفرز بسرعةٍ ولا يقرأ ما ردّ عليه مرّتين.
 */
function Messages() {
  const [rows, setRows] = useState<AdminMessage[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchMessages()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : 'تعذّرت القراءة'))
  }, [])

  useEffect(load, [load])

  async function mark(m: AdminMessage, status: AdminMessage['status']) {
    /* تفاؤليّ ثم إعادة قراءة: الفرز ضغطاتٌ متتابعة، وانتظار الردّ في كل
       واحدة يجعل اللوحة تبدو عالقة. */
    setRows((r) => r && r.map((x) => (x.id === m.id ? { ...x, status } : x)))
    try {
      await setMessageStatus(m.id, status)
    } catch {
      load()
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!rows) return <p className="a-note">يُحمَّل…</p>
  if (rows.length === 0) return <p className="a-note">لا رسائل.</p>

  return (
    <div className="a-card">
      <div className="a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البريد</th>
              <th>الرسالة</th>
              <th>الحالة</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="num">{stamp(m.createdAt)}</td>
                <td className="ltr">{m.email}</td>
                {/* الرسالة وحدها تلتفّ: بقيّة الأعمدة قصيرة، وnowrap العام
                    يمدّ الجدول بعرض أطول رسالة. */}
                <td style={{ whiteSpace: 'pre-wrap', minWidth: '22rem' }}>{m.body}</td>
                <td>
                  <span className={'tag' + (m.status === 'new' ? ' open' : m.status === 'done' ? ' finished' : '')}>
                    {m.status === 'new' ? 'جديدة' : m.status === 'read' ? 'مقروءة' : 'منتهية'}
                  </span>
                </td>
                <td>
                  <div className="a-acts">
                    {m.status !== 'read' && (
                      <button className="a-btn" onClick={() => mark(m, 'read')}>مقروءة</button>
                    )}
                    {m.status !== 'done' && (
                      <button className="a-btn go" onClick={() => mark(m, 'done')}>منتهية</button>
                    )}
                    <a className="a-btn" href={`mailto:${m.email}`}>ردّ</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================ المسوّدات ================================ */
/**
 * اقتراحات أسئلة كتبها طريقٌ خارجيّ بمفتاحه، تنتظر قرار المدير.
 *
 * **الشاشة قرارٌ لا تحرير.** الدفعة تُعتمد أو تُرفض كتلةً واحدة: مئةٌ
 * وخمسون سؤالاً قرارٌ واحد لا مئة وخمسون ضغطة. ومن أراد تصحيح سؤالٍ بعينه
 * يعتمد الدفعة ثمّ يصحّحه من شاشة الأسئلة كأيّ سؤالٍ مضاف — فالتصحيح هناك
 * موجودٌ ومختبَر، وتكرارُه هنا شاشةٌ ثانية بلا داعٍ.
 *
 * وفئةٌ لم تُنشأ بعد تُعرَض تحذيراً **قبل** الضغط لا خطأً بعده: الاعتماد
 * يُردّ من القاعدة (`unknown_category`)، والفئة لا تُنشأ من دفعة بقرار علي
 * في ٣١ أغسطس ٢٠٢٦.
 */
function Drafts() {
  const { data: all, err, reload } = useLoad<DraftBatch[]>(listDraftBatches)
  const [open, setOpen] = useState<string | null>(null)
  const [rows, setRows] = useState<DraftRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  /* المبتوت فيه يُخفى افتراضاً: الشاشة للقرار، والدفعة التي بُتّ فيها صارت
     سجلّاً. وبدونه تطول القائمة بلا حدّ وتُخفي المعلَّق بين المعتمَد. */
  const [showDecided, setShowDecided] = useState(false)
  /* اختيارٌ متعدّد: ستّ دفعات اختبار تُرفض بضغطة لا بستّ. */
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const pending = useMemo(() => (all ?? []).filter((b) => b.status === 'pending'), [all])
  const decided = useMemo(() => (all ?? []).filter((b) => b.status !== 'pending'), [all])
  const batches = showDecided ? all : pending

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const rejectPicked = async () => {
    setBusy(true)
    setMsg(null)
    let n = 0
    try {
      for (const b of picked) n += await rejectDrafts(b)
      setMsg({ ok: true, text: `رُفضت ${picked.size} دفعة · ${n} مسوّدة` })
      setPicked(new Set())
      setOpen(null)
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الرفض' })
    } finally {
      setBusy(false)
    }
  }

  const show = (batch: string) => {
    if (open === batch) {
      setOpen(null)
      return
    }
    setOpen(batch)
    setRows(null)
    listDraftRows(batch)
      .then(setRows)
      .catch((e) => setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّرت القراءة' }))
  }

  const decide = async (b: DraftBatch, approve: boolean) => {
    setBusy(true)
    setMsg(null)
    try {
      if (approve) {
        const res = await approveDrafts(b.batch)
        setMsg({
          ok: true,
          text:
            `اعتُمدت: أُضيف ${res.added}` +
            (res.skipped ? ` وتُخطّي ${res.skipped} نصُّه موجود` : '') +
            ' — تصل اللاعبين عند فتحهم اللعبة',
        })
      } else {
        const n = await rejectDrafts(b.batch)
        setMsg({ ok: true, text: `رُفضت ${n} مسوّدة` })
      }
      setOpen(null)
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر التنفيذ' })
    } finally {
      setBusy(false)
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!all || !batches) return <p className="a-muted">…</p>

  const bar = (
    <div className="a-bar">
      <span className="a-muted">
        {pending.length} تنتظر · {decided.length} مبتوت فيها
      </span>
      {decided.length > 0 && (
        <button className="a-btn" onClick={() => setShowDecided((v) => !v)}>
          {showDecided ? 'أخفِ المبتوت فيه' : 'أظهر المبتوت فيه'}
        </button>
      )}
      {picked.size > 0 && (
        <button className="a-btn danger" disabled={busy} onClick={rejectPicked}>
          ارفض المحدَّد ({picked.size})
        </button>
      )}
    </div>
  )

  if (batches.length === 0)
    return (
      <div className="a-card">
        {msg && <p className={msg.ok ? 'a-ok' : 'a-err'}>{msg.text}</p>}
        {bar}
        <p className="a-muted">لا مسوّدات تنتظر. ما يصل من طريقٍ خارجيّ يظهر هنا قبل أن يدخل البنك.</p>
        <style>{`.a-bar{display:flex;align-items:center;gap:10px;margin-bottom:10px}`}</style>
      </div>
    )

  return (
    <div className="a-card">
      {msg && <p className={msg.ok ? 'a-ok' : 'a-err'}>{msg.text}</p>}
      {bar}
      <table className="a-table">
        <thead>
          <tr>
            <th></th>
            <th>الدفعة</th>
            <th>الفئة</th>
            <th className="num">سهل</th>
            <th className="num">متوسط</th>
            <th className="num">صعب</th>
            <th className="num">المجموع</th>
            <th>الحالة</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <Fragment key={b.batch}>
              <tr>
                <td>
                  {b.status === 'pending' && (
                    <input type="checkbox" checked={picked.has(b.batch)} onChange={() => toggle(b.batch)} />
                  )}
                </td>
                <td className="a-muted">{stamp(b.created_at)}</td>
                <td>
                  {b.categories}
                  {b.missing_category && (
                    <span className="tag warn" title="أنشئ الفئة من لسان الفئات قبل الاعتماد">
                      الفئة غير موجودة
                    </span>
                  )}
                </td>
                <td className="num">{b.easy}</td>
                <td className="num">{b.medium}</td>
                <td className="num">{b.hard}</td>
                <td className="num">{b.n}</td>
                <td>
                  <span className={'tag' + (b.status === 'pending' ? ' open' : '')}>
                    {b.status === 'pending' ? 'تنتظر' : b.status === 'approved' ? 'معتمدة' : 'مرفوضة'}
                  </span>
                </td>
                <td className="a-actions">
                  <button className="a-btn" onClick={() => show(b.batch)}>
                    {open === b.batch ? 'أخفِ' : 'اعرض'}
                  </button>
                  {b.status === 'pending' && (
                    <>
                      <button
                        className="a-btn primary"
                        disabled={busy || b.missing_category}
                        title={b.missing_category ? 'أنشئ الفئة أوّلاً من لسان الفئات' : ''}
                        onClick={() => decide(b, true)}
                      >
                        اعتمد
                      </button>
                      <button className="a-btn danger" disabled={busy} onClick={() => decide(b, false)}>
                        ارفض
                      </button>
                    </>
                  )}
                </td>
              </tr>
              {open === b.batch && (
                <tr>
                  <td colSpan={9}>
                    {!rows ? (
                      <p className="a-muted">…</p>
                    ) : (
                      <table className="a-table sub">
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.id}>
                              <td className="a-muted">{r.level}</td>
                              <td>{r.question}</td>
                              <td>
                                <b>{r.answer}</b>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      <style>{`
        .a-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .a-table.sub { margin: 6px 0 10px; background: rgba(0,0,0,.03); }
        .a-table.sub td { padding: 4px 8px; font-size: 13px; }
        .tag.warn { margin-inline-start: 8px; background: #ffe6e0; color: #8a2c14; }
      `}</style>
    </div>
  )
}
