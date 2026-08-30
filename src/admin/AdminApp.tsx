import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signInWithEmail, signInWithGoogle, signOut, useSession } from '../lib/auth'
import { day, stamp } from '../lib/date'
import type {
  AdminCode,
  AdminFlag,
  AdminQuestionEdit,
  AdminSession,
  AdminStats,
  AdminUser,
} from '../lib/admin'
import type { Question } from '../game/types'
import {
  createCode,
  deleteCode,
  fetchStats,
  isAdmin,
  deleteQuestionEdit,
  listCodes,
  listFlags,
  listQuestionEdits,
  listSessions,
  listUsers,
  saveQuestion,
  setBalance,
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
  const [admin, setAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!session) {
      setAdmin(null)
      return
    }
    let alive = true
    isAdmin()
      .then((v) => alive && setAdmin(v))
      .catch(() => alive && setAdmin(false))
    return () => {
      alive = false
    }
  }, [session])

  if (session === undefined) return <p className="a-note">…</p>
  if (!session) return <Gate />
  if (admin === null) return <p className="a-note">…</p>
  if (!admin) return <NotAdmin email={session.user.email ?? ''} />
  return <Dashboard session={session} />
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
          هذا الحساب ({email}) ليس مديراً. الصلاحية صفٌّ في جدول <code>admins</code> يُضاف من
          محرّر SQL وحده.
        </p>
        <button className="a-btn" onClick={() => signOut()}>
          الخروج
        </button>
      </div>
    </div>
  )
}

/* ================================ اللوحة ================================ */

type Tab = 'users' | 'sessions' | 'codes' | 'reports' | 'questions'

const TABS: [Tab, string][] = [
  ['users', 'الحسابات'],
  ['sessions', 'الجلسات'],
  ['codes', 'أكواد الهدية'],
  ['reports', 'بلاغات الأسئلة'],
  ['questions', 'الأسئلة'],
]

function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('users')
  const [stats, setStats] = useState<AdminStats | null>(null)

  const reloadStats = useCallback(() => {
    fetchStats()
      .then(setStats)
      .catch(() => {})
  }, [])

  useEffect(reloadStats, [reloadStats])

  return (
    <div className="a-wrap">
      <header className="a-top">
        <h1 className="a-title">
          لوحة <span>فطين</span>
        </h1>
        <div className="a-who">
          <span className="a-mail">{session.user.email}</span>
          <button className="a-btn" onClick={() => signOut()}>
            الخروج
          </button>
        </div>
      </header>

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

      <nav className="a-tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={'a-tab' + (tab === id ? ' on' : '')}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'users' && <Users onChanged={reloadStats} />}
      {tab === 'sessions' && <Sessions />}
      {tab === 'codes' && <Codes onChanged={reloadStats} />}
      {tab === 'reports' && <Reports />}
      {tab === 'questions' && <Questions />}
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

function Users({ onChanged }: { onChanged: () => void }) {
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
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow
                key={u.id}
                user={u}
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

function UserRow({ user, onSaved }: { user: AdminUser; onSaved: () => void }) {
  const [val, setVal] = useState(String(user.balance ?? 0))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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
        <span className="a-bar" style={{ margin: 0, gap: 6 }}>
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
  const bank = useMemo(() => (list ? new Map(list.map((q) => [q.id, q])) : null), [list])
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
                    <span className="a-bar" style={{ margin: 0, gap: 6 }}>
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

const LEVELS = ['سهل', 'متوسط', 'صعب']
const PAGE = 60

type Source = 'bank' | 'edited' | 'added'

interface Row {
  q: Question
  source: Source
  origin?: AdminQuestionEdit['origin']
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
function Questions() {
  const bank = useBank()
  const { data: edits, err, reload } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [level, setLevel] = useState('')
  const [source, setSource] = useState<Source | ''>('')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const rows: Row[] | null = useMemo(() => {
    if (!bank || !edits) return null
    const byId = new Map(edits.map((e) => [e.question_id, e]))
    const out: Row[] = bank.map((base) => {
      const e = byId.get(base.id)
      if (!e) return { q: base, source: 'bank' as const }
      return { q: toQuestion(e), source: 'edited' as const, origin: e.origin }
    })
    for (const e of edits) {
      if (e.origin === 'new') out.push({ q: toQuestion(e), source: 'added', origin: 'new' })
    }
    return out
  }, [bank, edits])

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

  async function remove(row: Row) {
    setMsg(null)
    try {
      const kind = await deleteQuestionEdit(row.q.id)
      setMsg(kind === 'new' ? 'حُذف السؤال المضاف' : 'أُعيد سؤال البنك كما كان')
      reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'تعذّر الحذف')
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!shown) return <p className="a-note">…</p>

  const categories = bank ? [...new Set(bank.map((b) => b.category))] : []

  return (
    <>
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
      </div>

      {msg && <p className="a-note">{msg}</p>}

      <div className="a-card a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
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
                <td>
                  <span className={'tag' + (r.source === 'bank' ? '' : ' open')}>
                    {SOURCE_LABEL[r.source]}
                  </span>
                </td>
                <td style={{ whiteSpace: 'normal', maxWidth: 460 }}>
                  {r.q.image ? <span className="muted">[صورة] </span> : null}
                  {r.q.question}
                </td>
                <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>{r.q.answer}</td>
                <td>{r.q.category}</td>
                <td>{r.q.level}</td>
                <td>
                  <span className="a-bar" style={{ margin: 0, gap: 6 }}>
                    <button className="a-btn" onClick={() => setEditing(r)}>
                      تعديل
                    </button>
                    {r.source !== 'bank' && (
                      <button className="a-btn danger" onClick={() => remove(r)}>
                        {r.source === 'added' ? 'حذف' : 'أعِد الأصل'}
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

function toQuestion(e: AdminQuestionEdit): Question {
  return {
    id: e.question_id,
    category: e.category,
    level: e.level as Question['level'],
    topic: e.topic ?? '',
    question: e.question,
    answer: e.answer,
    ...(e.image ? { image: e.image } : {}),
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
        image: base?.image ?? null,
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

        {base?.image && (
          <p className="a-note" style={{ padding: 0 }}>
            سؤال صورة — الصورة تبقى كما هي، والنصّ والإجابة وحدهما يُعدَّلان.
          </p>
        )}

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

      <style>{`
        .q-veil {
          position:fixed; inset:0; z-index:70;
          display:flex; align-items:center; justify-content:center; padding:16px;
          background:rgba(10,8,20,.5);
        }
        .q-box {
          display:flex; flex-direction:column; gap:10px;
          width:min(680px, 100%); max-height:min(88vh, 760px); overflow:auto;
          padding:16px; border-radius:16px;
          background:var(--n-surface); color:var(--n-ink);
          box-shadow:0 24px 60px rgba(0,0,0,.28);
        }
        .q-box textarea.a-in { font:inherit; font-size:14px; line-height:1.7; resize:vertical; }
        /* الحقول الطويلة (السؤال والإجابة) تملأ العرض، والثلاثة القصيرة
           تتقاسم صفّاً — بقاعدةٍ واحدة على كل الحقول كانت تنزل ثلاثة أسطر. */
        .q-box > .a-field { width:100%; }
        .q-box .a-bar .a-field { flex:1 1 190px; }
        .q-box .a-in, .q-box select.a-in, .q-box textarea.a-in { width:100%; }
      `}</style>
    </div>
  )
}
