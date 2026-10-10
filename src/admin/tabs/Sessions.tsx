import { stamp } from '../../lib/date'
import { type AdminSession, listSessions } from '../../lib/admin'
import { useLoad } from '../shared'

const STATUS: Record<AdminSession['status'], string> = {
  open: 'مفتوحة',
  finished: 'مكتملة',
  abandoned: 'منسحبة',
}

export function Sessions() {
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
