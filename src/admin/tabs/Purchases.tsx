import { useState } from 'react'
import { stamp } from '../../lib/date'
import { type AdminPurchase, listPurchases, settlePurchase } from '../../lib/admin'
import { useLoad } from '../shared'

/**
 * المشتريات على الموقع (ماي فاتورة) — طلب علي ٢٦ نوفمبر ٢٠٢٦.
 *
 * المعلّق نوعان: دفع وأغلق الصفحة قبل الرجوع (يُسوّى عند دخوله التالي، أو
 * بزرّ «تحقّق» هنا)، أو فتح صفحة الدفع وتركها. وبعد ثلاثة أيّام تنتهي
 * الفاتورة عند ماي فاتورة، فيُعرض «لم يكتمل» لا «معلّق».
 */
const EXPIRY_MS = 3 * 864e5

const kwd = (n: number) => n.toFixed(3)

function label(p: AdminPurchase): [string, string] {
  if (p.status === 'paid') return ['مدفوع', 'finished']
  if (p.status === 'canceled') return ['ملغى', 'abandoned']
  return Date.now() - Date.parse(p.created_at) > EXPIRY_MS ? ['لم يكتمل', 'abandoned'] : ['معلّق', 'open']
}

export function Purchases() {
  const { data, err, reload } = useLoad<AdminPurchase[]>(() => listPurchases(300))
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function settle(id: string) {
    setBusy(id)
    setNote(null)
    try {
      const st = await settlePurchase(id)
      setNote(
        st === 'paid' ? 'دُفع — أُضيف الرصيد' : st === 'canceled' ? 'أُلغي عند ماي فاتورة' : 'لم يُدفع بعد',
      )
      reload()
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'تعذّر التحقّق')
    } finally {
      setBusy(null)
    }
  }

  if (err) return <p className="a-err">{err}</p>
  if (!data) return <p className="a-note">…</p>
  if (data.length === 0) return <p className="a-note">لا مشتريات بعد.</p>

  const paid = data.filter((p) => p.status === 'paid')
  const month = new Date()
  month.setDate(1)
  month.setHours(0, 0, 0, 0)
  const sum = (xs: AdminPurchase[]) => xs.reduce((a, p) => a + Number(p.amount), 0)
  const thisMonth = paid.filter((p) => p.paid_at && Date.parse(p.paid_at) >= month.getTime())

  return (
    <>
      <div className="a-tiles">
        <div className="a-tile">
          <b className="num">{kwd(sum(paid))}</b>
          <span>د.ك مدفوعة</span>
        </div>
        <div className="a-tile">
          <b className="num">{kwd(sum(thisMonth))}</b>
          <span>د.ك هذا الشهر</span>
        </div>
        <div className="a-tile">
          <b className="num">{paid.length}</b>
          <span>عملية دفع</span>
        </div>
        <div className="a-tile">
          <b className="num">{paid.reduce((a, p) => a + p.games, 0)}</b>
          <span>لعبة مُباعة</span>
        </div>
      </div>
      {note && <p className="a-note">{note}</p>}
      <div className="a-card a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th>الوقت</th>
              <th>الحساب</th>
              <th>الباقة</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>الفاتورة</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((p) => {
              const [text, cls] = label(p)
              return (
                <tr key={p.id}>
                  <td className="num">{stamp(p.paid_at ?? p.created_at)}</td>
                  <td className="ltr">{p.email ?? '—'}</td>
                  <td>
                    <span className="num">{p.games}</span>{' '}
                    {p.games === 1 ? 'لعبة' : p.games === 2 ? 'لعبتان' : 'ألعاب'}
                  </td>
                  <td className="num">{kwd(Number(p.amount))}</td>
                  <td>
                    <span className={'tag ' + cls}>{text}</span>
                  </td>
                  <td className="num">{p.invoice_id ?? '—'}</td>
                  <td>
                    {p.status === 'pending' && (
                      <button className="a-btn" disabled={busy !== null} onClick={() => settle(p.id)}>
                        {busy === p.id ? '…' : 'تحقّق'}
                      </button>
                    )}
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
