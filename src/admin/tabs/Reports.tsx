import { useMemo, useState } from 'react'
import { day } from '../../lib/date'
import {
  type AdminFlag,
  type AdminQuestionEdit,
  deleteQuestionEdit,
  listFlags,
  listExtraCategories,
  listQuestionEdits,
  setFlag,
} from '../../lib/admin'
import { useBank, useLoad } from '../shared'
import { type Row, merge } from '../questionRows'
import { QuestionForm } from '../QuestionForm'

const FLAG_LABEL: Record<AdminFlag['status'], string> = {
  pending: 'محجوز',
  ok: 'يُسحب',
  disabled: 'ملغى',
}

export function Reports() {
  const { data, err, reload } = useLoad<AdminFlag[]>(listFlags)
  const list = useBank()
  const { data: edits, err: editsErr, reload: reloadEdits } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  const { data: extra } = useLoad<string[]>(listExtraCategories)
  /* البنك بعد تركيب التعديلات عليه — كما يراه اللاعب: بالمشحون وحده كان
     بلاغٌ على سؤالٍ أضافته اللوحة يظهر معرّفاً بلا نصّ، والمعدَّلُ بنصّه القديم.
     والصفُّ كاملاً لا السؤال وحده: التعديل والحذف من هنا يحتاجان مصدرَه. */
  const bank = useMemo(
    () => (list && edits ? new Map(merge(list, edits).map((r) => [r.q.id, r])) : null),
    [list, edits],
  )
  const categories = useMemo(
    () => [...new Set([...(list ?? []).map((b) => b.category), ...(extra ?? [])])],
    [list, extra],
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null>(null)

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

  /**
   * الحذف من طابور البلاغات نفسه (طلب علي ١٤ سبتمبر ٢٠٢٦): البلاغ الصحيح
   * جوابُه غالباً محوُ السؤال، وكان الحكم يذهب إلى لسان الأسئلة ويبحث عنه.
   *
   * والبلاغ لا يُترك «محجوزاً» على سؤالٍ لم يعد موجوداً — يُغلق «ملغى» في
   * الخطوة نفسها، وإلّا بقي في الطابور صفٌّ بمعرّفٍ بلا نصّ يُقرأ عطباً.
   * والقاعدة تردّ الحذف إن أنزل خليّةً تحت حدّها، فيبقى البلاغ كما كان.
   */
  async function remove(f: AdminFlag, row: Row) {
    const what = row.deletable ? 'محوُ السؤال نهائياً' : 'إعادةُ السؤال إلى أصله المشحون'
    if (!window.confirm(`${what} وإغلاقُ بلاغه. متأكّد؟`)) return
    setBusy(f.question_id)
    setMsg(null)
    let deleted = false
    try {
      await deleteQuestionEdit(row.q.id)
      deleted = true
      await setFlag(f.question_id, 'disabled', 'حُذف السؤال من اللوحة')
      setMsg('حُذف السؤال وأُغلق بلاغه')
      reloadEdits()
      reload()
    } catch (e) {
      /* نجح الحذف وفشل إغلاق البلاغ: كان يقول «تعذّر الحذف» ويُبقي الصفّ،
         فتردّ الضغطةُ الثانية خطأً على سؤالٍ لم يعد موجوداً. */
      const why = e instanceof Error ? e.message : ''
      setMsg(deleted ? `حُذف السؤال، لكن تعذّر إغلاق بلاغه${why ? ` — ${why}` : ''}` : why || 'تعذّر الحذف')
      if (deleted) {
        reloadEdits()
        reload()
      }
    } finally {
      setBusy(null)
    }
  }

  if (err ?? editsErr) return <p className="a-err">{err ?? editsErr}</p>
  if (!data) return <p className="a-note">…</p>
  if (data.length === 0) return <p className="a-note">لا بلاغات.</p>

  return (
    <>
      {msg && <p className="a-err">{msg}</p>}
      {/* المحجوز لا يُسحب لأحد حتى يُراجَع — والصفّ يقول ذلك صراحةً كي لا
          يُترك الطابور بظنّ أنّ البلاغ مجرّد ملاحظة. */}
      <p className="a-note">السؤال المحجوز لا يظهر لأيّ لاعب. «يُسحب» يعيده، و«ملغى» يمنعه نهائياً.</p>
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
              const row = bank?.get(f.question_id)
              const q = row?.q
              return (
                <tr key={f.question_id}>
                  <td>
                    <span
                      className={
                        'tag ' +
                        (f.status === 'pending' ? 'open' : f.status === 'disabled' ? 'abandoned' : 'finished')
                      }
                    >
                      {FLAG_LABEL[f.status]}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 420 }}>
                    {q ? (
                      q.question
                    ) : (
                      /* بنكٌ محمَّل ولا سؤال: حُذف. المعرّف وحده كان يُقرأ عطباً. */
                      <span className="muted">{bank ? `سؤال محذوف · ${f.question_id}` : '…'}</span>
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
                      {/* التعديل والحذف من الطابور نفسه — لا رحلة إلى لسان الأسئلة.
                          يغيبان عن سؤالٍ لم يعد موجوداً، لا يُطفآن. */}
                      {row && (
                        <>
                          <button
                            className="a-btn"
                            disabled={busy === f.question_id}
                            onClick={() => setEditing(row)}
                          >
                            عدّله
                          </button>
                          <button
                            className="a-btn danger"
                            disabled={busy === f.question_id}
                            onClick={() => remove(f, row)}
                          >
                            احذفه
                          </button>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <QuestionForm
          row={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setMsg('حُفظ — يصل اللاعبين عند فتحهم اللعبة')
            reloadEdits()
          }}
        />
      )}
    </>
  )
}
