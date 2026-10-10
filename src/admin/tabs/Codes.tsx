import { useState } from 'react'
import { day } from '../../lib/date'
import { type AdminCode, createCode, deleteCode, listCodes } from '../../lib/admin'
import { useLoad, wholeNumber } from '../shared'

export function Codes({ onChanged }: { onChanged: () => void }) {
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
    const g = wholeNumber(games)
    const m = max.trim() ? wholeNumber(max) : null
    if (g === null || g < 1) {
      setMsg({ ok: false, text: 'عدد الألعاب: رقم صحيح من 1 فأكثر' })
      return
    }
    if (max.trim() && (m === null || m < 1)) {
      setMsg({ ok: false, text: 'السقف: رقم صحيح من 1 فأكثر، أو اتركه فارغاً' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const made = await createCode({
        code,
        games: g,
        max: m,
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
