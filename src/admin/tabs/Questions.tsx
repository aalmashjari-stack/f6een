import { useEffect, useMemo, useState } from 'react'
import {
  type AdminQuestionEdit,
  bankMode,
  deleteQuestionEdit,
  deleteQuestions,
  listExtraCategories,
  listQuestionEdits,
  seedBank,
  setBankMode,
} from '../../lib/admin'
import { questionsToCsv } from '../../lib/importQuestions'
import { type Row, type Source, merge } from '../questionRows'
import { LEVELS } from '../../game/levels'
import { useBank, useLoad } from '../shared'
import { QThumb, QuestionForm } from '../QuestionForm'
import { ImportDialog } from '../ImportDialog'

const PAGE = 60

const SOURCE_LABEL: Record<Source, string> = {
  bank: 'البنك',
  edited: 'معدَّل',
  added: 'مضاف',
}

export function Questions() {
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
    /* كلُّ حذفٍ آخر في اللوحة يسأل قبله؛ وهذا بجوار «تعديل» في كلّ صفّ، ولا
       رجعة فيه حين يكون البنك في القاعدة. */
    const what = live || row.deletable ? 'حذفُ هذا السؤال نهائياً' : 'إعادةُ السؤال إلى أصله المشحون'
    if (!window.confirm(`${what}:\n«${row.q.question}»\nمتأكّد؟`)) return
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
