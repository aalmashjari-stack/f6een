import { Fragment, useMemo, useRef, useState } from 'react'
import { stamp } from '../../lib/date'
import {
  type DraftBatch,
  type DraftRow,
  approveDrafts,
  listDraftBatches,
  listDraftRows,
  rejectDraftRows,
  rejectDrafts,
} from '../../lib/admin'
import { useLoad } from '../shared'
import { QThumb } from '../QuestionForm'

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
export function Drafts() {
  const { data: all, err, reload } = useLoad<DraftBatch[]>(listDraftBatches)
  const [open, setOpen] = useState<string | null>(null)
  /* الدفعةُ المفتوحة لحظةَ وصول الردّ — «اعرض» على دفعتين متتاليتين كان
     يعرض صفوف الأولى تحت الثانية إن تأخّر ردُّها، و«استبعد» يقع على غيرها. */
  const openRef = useRef<string | null>(null)
  const [rows, setRows] = useState<DraftRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  /* المبتوت فيه يُخفى افتراضاً: الشاشة للقرار، والدفعة التي بُتّ فيها صارت
     سجلّاً. وبدونه تطول القائمة بلا حدّ وتُخفي المعلَّق بين المعتمَد. */
  const [showDecided, setShowDecided] = useState(false)
  /* اختيارٌ متعدّد: ستّ دفعات اختبار تُرفض بضغطة لا بستّ. */
  const [picked, setPicked] = useState<Set<string>>(new Set())
  /* المستبعَد في هذه الجلسة — يُرسَم مشطوباً فوراً بلا انتظار قراءةٍ ثانية
     من القاعدة. والقراءةُ تصحّحه على أيّ حال عند إعادة الفتح. */
  const [dropped, setDropped] = useState<Set<number>>(new Set())
  /* تكبيرُ صورةٍ في الدفعة — الحوارُ نفسُه الذي في لسان الأسئلة. */
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null)

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
    /* لا شيء في اللوحة يعيد دفعةً مرفوضة، و«حدّد الكل» ثمّ هذا الزرّ يرفض
       كلَّ ما ينتظر في ضغطة. */
    const drafts = pending.filter((b) => picked.has(b.batch)).reduce((n, b) => n + (b.pending ?? b.n), 0)
    if (!window.confirm(`رفضُ ${picked.size} دفعة (${drafts} مسوّدة)؟ لا رجعة فيه من اللوحة.`)) return
    setBusy(true)
    setMsg(null)
    let n = 0
    let done = 0
    try {
      for (const b of picked) {
        n += await rejectDrafts(b)
        done++
      }
      setMsg({ ok: true, text: `رُفضت ${picked.size} دفعة · ${n} مسوّدة` })
      setPicked(new Set())
      setOpen(null)
      reload()
    } catch (e) {
      /* ما رُفض قبل الفشل رُفض فعلاً — كالاعتماد: يُقال ويُعاد التحميل، وإلّا
         بقيت الدفعات المرفوضة تعرض «تنتظر» بمربّعاتها. */
      setMsg({
        ok: false,
        text: (e instanceof Error ? e.message : 'تعذّر الرفض') + (done ? ` — بعد رفض ${done} دفعة` : ''),
      })
      setPicked(new Set())
      reload()
    } finally {
      setBusy(false)
    }
  }

  /**
   * **اعتمادُ المحدَّد دفعةً دفعة** (طلب علي ١٣ سبتمبر ٢٠٢٦): جاءت حصيلةُ
   * الموسوعة أربعاً وعشرين دفعة، واعتمادُها ضغطةً ضغطة لا يليق بشاشةٍ
   * شعارُها «مئةٌ وخمسون سؤالاً قرارٌ واحد».
   *
   * كلُّ دفعةٍ تُعتمد بنداءٍ مستقلّ — فما يفشل منها لا يُسقط ما سبقه — وما
   * فئتُه غير موجودة يُترك جانباً ويُسمّى في الرسالة لا يُخطئ الاعتمادَ
   * كلّه، وهو ما تفعله القاعدة نفسها لو ضُغط زرُّه منفرداً.
   */
  const approvePicked = async () => {
    setBusy(true)
    setMsg(null)
    let added = 0,
      skipped = 0,
      done = 0
    const held: string[] = []
    try {
      for (const id of picked) {
        const b = pending.find((x) => x.batch === id)
        if (!b) continue
        if (b.missing_category) {
          held.push(b.categories)
          continue
        }
        const res = await approveDrafts(id)
        added += res.added
        skipped += res.skipped
        done++
      }
      setMsg({
        ok: true,
        text:
          `اعتُمدت ${done} دفعة: أُضيف ${added}` +
          (skipped ? ` وتُخطّي ${skipped} نصُّه موجود` : '') +
          (held.length ? ` — وتُركت ${held.length} فئتُها غير موجودة (${held.join('، ')})` : '') +
          ' — تصل اللاعبين عند فتحهم اللعبة',
      })
      setPicked(new Set())
      setOpen(null)
      reload()
    } catch (e) {
      /* ما اعتُمد قبل الفشل اعتُمد فعلاً؛ فالرسالة تقوله ولا تخفيه. */
      setMsg({
        ok: false,
        text:
          `${e instanceof Error ? e.message : 'تعذّر الاعتماد'}` + (done ? ` — بعد اعتماد ${done} دفعة` : ''),
      })
      reload()
    } finally {
      setBusy(false)
    }
  }

  /* «حدّد الكل» يحدّد المعلَّق وحده: المبتوتُ فيه لا زرَّ له أصلاً. */
  const allPicked = pending.length > 0 && pending.every((b) => picked.has(b.batch))
  const togglePickAll = () => setPicked(allPicked ? new Set() : new Set(pending.map((b) => b.batch)))

  /**
   * **استبعادُ سؤالٍ قبل اعتماد دفعته** (طلب علي ١١ سبتمبر ٢٠٢٦).
   *
   * ولا فعلَ ثالث في القاعدة: المستبعَد **مرفوضٌ** كغيره، و«اعتمد» تمرّ
   * على المعلَّق وحده — فيُعتمد ما بقي بلا أن يُعاد إرسال الدفعة منقّحة.
   */
  const drop = async (r: DraftRow) => {
    setMsg(null)
    /* الشطبُ قبل الردّ: الضغطة تُرى أثرَها في الحال، وفشلُ الشبكة يعيده. */
    setDropped((d) => new Set(d).add(r.id))
    try {
      await rejectDraftRows([r.id])
      reload()
    } catch (e) {
      setDropped((d) => {
        const n = new Set(d)
        n.delete(r.id)
        return n
      })
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الاستبعاد' })
    }
  }

  const show = (batch: string) => {
    if (open === batch) {
      setOpen(null)
      return
    }
    setOpen(batch)
    openRef.current = batch
    setRows(null)
    listDraftRows(batch)
      .then((r) => {
        if (openRef.current === batch) setRows(r)
      })
      .catch((e) => setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّرت القراءة' }))
  }

  const decide = async (b: DraftBatch, approve: boolean) => {
    if (
      !approve &&
      !window.confirm(`رفضُ دفعة «${b.categories}» (${b.pending ?? b.n} مسوّدة)؟ لا رجعة فيه من اللوحة.`)
    )
      return
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
      {pending.length > 1 && (
        <label className="a-muted pick-all">
          <input type="checkbox" checked={allPicked} onChange={togglePickAll} />
          حدّد الكل ({pending.length})
        </label>
      )}
      {picked.size > 0 && (
        <>
          <button className="a-btn primary" disabled={busy} onClick={approvePicked}>
            اعتمد المحدَّد ({picked.size})
          </button>
          <button className="a-btn danger" disabled={busy} onClick={rejectPicked}>
            ارفض المحدَّد ({picked.size})
          </button>
        </>
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
            <th className="num">تعجيزي</th>
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
                <td className="num">{b.taajizi ?? 0}</td>
                <td className="num">
                  {b.n}
                  {/* ما سيدخل البنك فعلاً حين تُضغط «اعتمد»: المعلَّق وحده.
                      يظهر متى استُبعد شيءٌ من الدفعة — وإلّا فهو المجموع. */}
                  {b.rejected ? <span className="will"> ← {b.pending ?? 0}</span> : null}
                </td>
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
                  <td colSpan={99}>
                    {!rows ? (
                      <p className="a-muted">…</p>
                    ) : (
                      <table className="a-table sub">
                        <tbody>
                          {rows.map((r) => {
                            /* مستبعَدٌ: إمّا رفضتُه في هذه الجلسة، وإمّا جاء
                               مرفوضاً من قراءةٍ سابقة. */
                            const out = dropped.has(r.id) || r.status === 'rejected'
                            return (
                              <tr key={r.id} className={out ? 'out' : ''}>
                                <td className="a-muted">{r.level}</td>
                                {/* الصورتان كما في لسان الأسئلة: صورةُ السؤال بجانبه
                                  وصورةُ الإجابة بجانبها — القرارُ يُتّخذ عليهما. */}
                                <td>
                                  {r.image ? (
                                    <span className="q-thumb-wrap">
                                      <QThumb image={r.image} label={r.answer} onZoom={setZoom} />
                                      <span>{r.question}</span>
                                    </span>
                                  ) : (
                                    r.question
                                  )}
                                </td>
                                <td>
                                  {r.answer_image ? (
                                    <span className="q-thumb-wrap">
                                      <QThumb image={r.answer_image} label={r.answer} onZoom={setZoom} />
                                      <b>{r.answer}</b>
                                    </span>
                                  ) : (
                                    <b>{r.answer}</b>
                                  )}
                                </td>
                                <td className="drop-cell">
                                  {out ? (
                                    <span className="tag">مستبعَد</span>
                                  ) : (
                                    b.status === 'pending' && (
                                      <button
                                        className="a-btn danger"
                                        onClick={() => drop(r)}
                                        title="لا يدخل البنك عند اعتماد الدفعة"
                                      >
                                        استبعد
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                            )
                          })}
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
        /* الصفّ المستبعَد يبقى ظاهراً مشطوباً لا يختفي: المدير يرى ما أسقطه
           فيتراجع بعينه إن أخطأ، والاختفاءُ يترك الشاشةَ بلا أثرٍ للقرار. */
        .a-table.sub tr.out td { opacity:.45; text-decoration:line-through; }
        .a-table.sub tr.out .tag { text-decoration:none; }
        .drop-cell { white-space:nowrap; text-align:end; }
        /* «٨٠ ← ٧٥»: المجموع ثمّ ما سيدخل البنك فعلاً عند الاعتماد. */
        .will { color:var(--n-brand); font-weight:800; }

        .a-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .a-table.sub { margin: 6px 0 10px; background: rgba(0,0,0,.03); }
        .a-table.sub td { padding: 4px 8px; font-size: 13px; }
        .tag.warn { margin-inline-start: 8px; background: #ffe6e0; color: #8a2c14; }
      `}</style>
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
    </div>
  )
}
