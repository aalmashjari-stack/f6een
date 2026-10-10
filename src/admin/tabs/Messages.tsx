import { useCallback, useEffect, useState } from 'react'
import { stamp } from '../../lib/date'
import { type AdminMessage, fetchMessages, setMessageStatus } from '../../lib/messages'

/**
 * صندوق «تواصل معنا». الحالة ثلاث: جديدة · مقروءة · منتهية — والانتقال
 * بضغطة، فالمدير يفرز بسرعةٍ ولا يقرأ ما ردّ عليه مرّتين.
 */
export function Messages() {
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
                    <a className="a-btn" href={`mailto:${encodeURIComponent(m.email)}`}>ردّ</a>
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
