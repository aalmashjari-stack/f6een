import { useState } from 'react'
import { type Plan, buildPlan, readTable } from '../lib/importQuestions'
import { importQuestions } from '../lib/admin'

/**
 * ملفّ إكسل أو CSV → معاينة → رفع.
 *
 * **لا كتابة قبل المعاينة.** ملفّ من مئة سؤال فيه دائماً ما لا يصلح، ورفعُه
 * كما هو يترك المدير أمام خطأٍ واحد لا يعرف أيّ سطرٍ سبّبه. فالفرز في
 * المتصفّح أوّلاً، ولكل صفٍّ مردود سببه ورقم سطره في الملفّ.
 */
export function ImportDialog({
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
          أعمدة الملفّ أربعة: <b>التصنيف · المستوى · السؤال · الإجابة</b>. والفئة يجب أن تكون موجودة — تُضاف
          من لسان «الفئات» أوّلاً.
        </p>

        <div className="a-bar">
          <label className="a-btn go" style={{ cursor: 'pointer' }}>
            اختر ملفّاً (xlsx أو csv)
            <input type="file" accept=".xlsx,.csv" onChange={pick} hidden disabled={busy} />
          </label>
          {/* نموذجٌ بأعمدته الصحيحة أقصرُ من شرحها: يُفتح في إكسل ويُملأ.
              وعلامة ترتيب البايتات في أوّله تجعل إكسل يقرأ العربية صحيحة. */}
          <button className="a-btn" type="button" onClick={template}>
            حمّل نموذجاً
          </button>
          {plan && (
            <span className="muted">
              <b className="num">{plan.added}</b> إضافة · <b className="num">{plan.updated}</b> تعديل ·{' '}
              <b className="num">{plan.rejected.length}</b> مردود
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
          <button className="a-btn go" disabled={busy || !plan || plan.rows.length === 0} onClick={upload}>
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
