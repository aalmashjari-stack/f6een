import { useEffect, useMemo, useState } from 'react'
import { day } from '../../lib/date'
import { type AdminUser, setAdminRole, listUsers, setBalance } from '../../lib/admin'
import { useLoad, wholeNumber } from '../shared'

export function Users({ onChanged, me }: { onChanged: () => void; me: string }) {
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
    const n = wholeNumber(val)
    if (n === null) {
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
