import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listFlags,
  listQuestionEdits,
  saveQuestion,
  setFlag,
  type AdminQuestionEdit,
} from '../lib/admin'
import { isImageUrl } from '../game/celebs'
import { shippedImage } from '../game/shippedImage'

/**
 * لسان «التدقيق» — طلب علي ٩ أكتوبر ٢٠٢٦: «حطّلي إيّاهم في تبويب جديد في
 * لوحة الإدارة وأنا أتصرّف معهم».
 *
 * الاقتراحات ثابتةٌ في `audit-2026-10-09.json`: 1863 ما قبله المحقّقون من
 * تدقيقٍ بالوكلاء على نسخة ٦ أكتوبر (مستوى وجودة وصور). لا جدول لها في
 * القاعدة — اللسان يقرأ البنك الحيّ ويستنتج حالة كلّ اقتراح منه:
 * المستوى صار المقترح = طُبّق؛ النصّ أو الإجابة تغيّرا = عُدّل؛ محجوب أو
 * محذوف = حُجب. فما فعله علي من لسان «الأسئلة» يظهر هنا منجزاً أيضاً.
 *
 * و«اترك» وحدها لا أثر لها في البنك، فتُحفظ في هذا المتصفّح.
 *
 * الأفعال دوالّ اللوحة نفسها (`admin_save_question` و`admin_set_flag`)،
 * والقاعدة تردّ ما يُنزل خليّةً تحت حدّها — فاللسان لا يحرس الحدّ وحده.
 */

interface Item {
  id: string
  /** نوع الاقتراح: down/up للمستوى، block للحجب، والباقي جودة. */
  t: string
  q: string
  a: string
  c: string
  l: string
  to?: string
  fix?: string
  why: string
  rel?: string
  img?: string
}

const TYPE: Record<string, string> = {
  down: 'أسهل من مستواه',
  up: 'أصعب من مستواه',
  block: 'حجب',
  answer_in_other_question: 'مكشوف في سؤال آخر',
  answer_printed_in_image: 'مطبوع في الصورة',
  answer_in_question: 'الجواب في السؤال',
  ambiguous: 'غامض أو بجوابين',
  fact_error: 'خطأ واقعة',
  wording: 'صياغة',
  impossible: 'مستحيل',
  image_mismatch: 'صورة لا تطابق',
  image_unclear: 'صورة غير واضحة',
  duplicate: 'مكرّر',
  trivial: 'تافه',
  wrong_category: 'فئة خاطئة',
}

const LEVELS = ['سهل', 'متوسط', 'صعب', 'تعجيزي']
/** حدُّ الخليّة في المعيار (القاعدة تحرس 20) — تحته تنبيهٌ لا منع. */
const FLOOR = 30
const PAGE = 50
const DISMISSED = 'f6een.audit-2026-10-09.dismissed'

type Status = 'pending' | 'applied' | 'edited' | 'blocked' | 'dismissed'
const STATUS: Record<Status, string> = {
  pending: 'بانتظار',
  applied: 'طُبّق',
  edited: 'عُدّل',
  blocked: 'محجوب',
  dismissed: 'تُرك',
}

function readDismissed(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED) ?? '[]') as number[])
  } catch {
    return new Set()
  }
}

function writeDismissed(s: Set<number>) {
  try {
    localStorage.setItem(DISMISSED, JSON.stringify([...s]))
  } catch {
    /* تصفّحٌ خاصّ: يبقى «اترك» للجلسة وحدها. */
  }
}

function imageSrc(key: string): string | null {
  return isImageUrl(key) ? key : shippedImage(key)
}

export function Audit() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [live, setLive] = useState<Map<string, AdminQuestionEdit> | null>(null)
  const [disabled, setDisabled] = useState<Set<string>>(new Set())
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<number>>(readDismissed)
  const [busy, setBusy] = useState<string | null>(null)

  const [status, setStatus] = useState<Status | 'all'>('pending')
  const [type, setType] = useState('down')
  const [cat, setCat] = useState('')
  const [level, setLevel] = useState('')
  const [needle, setNeedle] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<number | null>(null)

  /* الملفّ كبير (ستّمئة كيلوبايت)؛ يُحمَّل حين يُفتح اللسان لا مع اللوحة. */
  useEffect(() => {
    import('./audit-2026-10-09.json')
      .then((m) => setItems(m.default as Item[]))
      .catch(() => setErr('تعذّر تحميل ملفّ التدقيق'))
  }, [])

  const reload = useCallback(() => {
    Promise.all([listQuestionEdits(), listFlags()])
      .then(([edits, flags]) => {
        setLive(new Map(edits.map((e) => [e.question_id, e])))
        setDisabled(new Set(flags.filter((f) => f.status === 'disabled').map((f) => f.question_id)))
        setErr(null)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'تعذّرت القراءة'))
  }, [])
  useEffect(reload, [reload])

  /* عددُ كلّ خليّةٍ حيّة (بلا المحجوب) — لتنبيه النزول تحت الحدّ. */
  const cells = useMemo(() => {
    const m = new Map<string, number>()
    if (!live) return m
    for (const e of live.values()) {
      if (disabled.has(e.question_id)) continue
      const k = e.category + '|' + e.level
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [live, disabled])

  const statusOf = useCallback(
    (it: Item, i: number): Status => {
      const cur = live?.get(it.id)
      if (!cur || disabled.has(it.id)) return 'blocked'
      if (it.to && cur.level === it.to) return 'applied'
      if (cur.question !== it.q || cur.answer !== it.a || cur.image !== (it.img ?? null)) return 'edited'
      if (dismissed.has(i)) return 'dismissed'
      return 'pending'
    },
    [live, disabled, dismissed],
  )

  const rows = useMemo(() => {
    if (!items || !live) return null
    return items.map((it, i) => ({ it, i, st: statusOf(it, i) }))
  }, [items, live, statusOf])

  const byStatus = useMemo(() => (rows ?? []).filter((r) => status === 'all' || r.st === status), [rows, status])

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of byStatus) m.set(r.it.t, (m.get(r.it.t) ?? 0) + 1)
    return m
  }, [byStatus])

  const shown = useMemo(() => {
    const n = needle.trim()
    return byStatus
      .filter(
        (r) =>
          (!type || r.it.t === type) &&
          (!cat || r.it.c === cat) &&
          (!level || r.it.l === level) &&
          (!n || r.it.id === n || r.it.q.includes(n) || r.it.a.includes(n)),
      )
      .sort((a, b) => a.it.c.localeCompare(b.it.c, 'ar') || LEVELS.indexOf(a.it.l) - LEVELS.indexOf(b.it.l))
  }, [byStatus, type, cat, level, needle])

  useEffect(() => setLimit(PAGE), [status, type, cat, level, needle])

  const cats = useMemo(() => [...new Set((items ?? []).map((it) => it.c))].sort((a, b) => a.localeCompare(b, 'ar')), [items])

  const done = (rows ?? []).filter((r) => r.st !== 'pending').length

  async function applyLevel(it: Item) {
    const cur = live?.get(it.id)
    if (!cur || !it.to) return
    await saveQuestion({
      id: cur.question_id,
      category: cur.category,
      level: it.to,
      topic: cur.topic,
      question: cur.question,
      answer: cur.answer,
      image: cur.image,
      answerImage: cur.answer_image,
    })
  }

  async function act(key: string, fn: () => Promise<void>, ok: string) {
    setBusy(key)
    setMsg(null)
    try {
      await fn()
      setMsg(ok)
      reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'تعذّر التنفيذ')
    }
    setBusy(null)
  }

  function dismiss(i: number, on: boolean) {
    const s = new Set(dismissed)
    if (on) s.add(i)
    else s.delete(i)
    setDismissed(s)
    writeDismissed(s)
  }

  /**
   * تطبيق مستويات المعروض كلّه — بلا ما يُنزل خليّته المصدر تحت الحدّ.
   * العدّ يُحدَّث مع كلّ نقلٍ في الدفعة نفسها، فلا يعبر اثنان معاً الحدّ.
   */
  async function applyShownLevels() {
    const todo = shown.filter((r) => r.st === 'pending' && r.it.to && (r.it.t === 'down' || r.it.t === 'up'))
    if (todo.length === 0) return
    if (!window.confirm(`تغيير مستوى ${todo.length} سؤالاً معروضاً. ما يُنزل خليّته تحت ${FLOOR} يُترك. متأكّد؟`)) return
    const count = new Map(cells)
    let applied = 0
    let held = 0
    setBusy('bulk')
    setMsg(null)
    for (const r of todo) {
      const from = r.it.c + '|' + (live?.get(r.it.id)?.level ?? r.it.l)
      const to = r.it.c + '|' + r.it.to
      if ((count.get(from) ?? 0) - 1 < FLOOR) {
        held++
        continue
      }
      try {
        await applyLevel(r.it)
        count.set(from, (count.get(from) ?? 0) - 1)
        count.set(to, (count.get(to) ?? 0) + 1)
        applied++
        setMsg(`طُبّق ${applied} من ${todo.length}…`)
      } catch {
        held++
      }
    }
    setBusy(null)
    setMsg(`طُبّق ${applied}، وتُرك ${held} لأنّ خليّته عند الحدّ أو رفضته القاعدة`)
    reload()
  }

  if (err) return <p className="a-err">{err}</p>
  if (!rows) return <p className="a-note">…</p>

  const levelType = type === 'down' || type === 'up'

  return (
    <div className="audit">
      <p className="a-note audit-head">
        تدقيق ٩ أكتوبر على نسخة ٦ أكتوبر: <span className="num">{rows.length}</span> اقتراحاً قبله المحقّقون،
        أُنجز منها <span className="num">{done}</span>. ما تعدّله من لسان «الأسئلة» يُحسب هنا تلقائياً.
      </p>

      <div className="a-bar">
        <select className="a-in" value={status} onChange={(e) => setStatus(e.target.value as Status | 'all')}>
          {(['pending', 'applied', 'edited', 'blocked', 'dismissed'] as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS[s]} ({rows.filter((r) => r.st === s).length})
            </option>
          ))}
          <option value="all">الكلّ ({rows.length})</option>
        </select>
        <select className="a-in" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">كلّ الفئات</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="a-in" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">كلّ المستويات</option>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <input
          className="a-in"
          placeholder="بحث بالنصّ أو المعرّف"
          value={needle}
          onChange={(e) => setNeedle(e.target.value)}
        />
      </div>

      <div className="audit-types">
        {Object.keys(TYPE)
          .filter((k) => typeCounts.get(k))
          .sort((a, b) => (typeCounts.get(b) ?? 0) - (typeCounts.get(a) ?? 0))
          .map((k) => (
            <button key={k} className={'a-btn' + (type === k ? ' on' : '')} onClick={() => setType(k)}>
              {TYPE[k]} <span className="num">{typeCounts.get(k)}</span>
            </button>
          ))}
        <button className={'a-btn' + (type === '' ? ' on' : '')} onClick={() => setType('')}>
          كلّ الأنواع <span className="num">{byStatus.length}</span>
        </button>
      </div>

      <div className="a-bar">
        <span className="a-note audit-count">
          <span className="num">{shown.length}</span> معروضاً
        </span>
        {levelType && status === 'pending' && shown.length > 0 && (
          <button className="a-btn go" disabled={busy !== null} onClick={applyShownLevels}>
            طبّق مستويات المعروض ({shown.length})
          </button>
        )}
        {msg && <span className="a-ok">{msg}</span>}
      </div>

      {shown.slice(0, limit).map(({ it, i, st }) => {
        const cur = live?.get(it.id)
        const rel = it.rel ? live?.get(it.rel) : undefined
        const src = it.img ? imageSrc(it.img) : null
        const fromCount = cells.get(it.c + '|' + (cur?.level ?? it.l)) ?? 0
        const key = String(i)
        return (
          <div key={i} className={'audit-row' + (st !== 'pending' ? ' done' : '')}>
            <div className="audit-top">
              <span className="num">{it.id}</span>
              <span>{it.c}</span>
              {it.to ? (
                <span className={'tag ' + (it.t === 'up' ? 'open' : 'finished')}>
                  {it.l} ← {it.to}
                </span>
              ) : (
                <span className="tag">{it.l}</span>
              )}
              <span className="tag bad">{TYPE[it.t] ?? it.t}</span>
              {st !== 'pending' && <span className="tag finished">{STATUS[st]}</span>}
            </div>

            <div className="audit-body">
              {src && (
                <a href={src} target="_blank" rel="noreferrer">
                  <img className="audit-img" src={src} alt="" loading="lazy" />
                </a>
              )}
              <div>
                <div className="audit-q">
                  {cur?.question ?? it.q} — <b>{cur?.answer ?? it.a}</b>
                </div>
                {it.fix && <div className="audit-fix">{it.fix}</div>}
                <div className="audit-why">{it.why}</div>
                {rel && (
                  <div className="audit-why">
                    السؤال المرتبط <span className="num">{rel.question_id}</span>: {rel.question} — <b>{rel.answer}</b>
                  </div>
                )}
              </div>
            </div>

            {editing === i && cur ? (
              <EditBox
                cur={cur}
                level={it.to}
                onCancel={() => setEditing(null)}
                onSave={(q, a, l) =>
                  act(
                    key,
                    async () => {
                      await saveQuestion({
                        id: cur.question_id,
                        category: cur.category,
                        level: l,
                        topic: cur.topic,
                        question: q,
                        answer: a,
                        image: cur.image,
                        answerImage: cur.answer_image,
                      })
                      setEditing(null)
                    },
                    `حُفظ ${it.id}`,
                  )
                }
                busy={busy === key}
              />
            ) : (
              st === 'pending' && (
                <div className="a-bar audit-acts">
                  {it.to && (
                    <button
                      className="a-btn go"
                      disabled={busy !== null}
                      onClick={() => act(key, () => applyLevel(it), `${it.id} صار ${it.to}`)}
                    >
                      طبّق: {it.to}
                    </button>
                  )}
                  <button className="a-btn" disabled={busy !== null || !cur} onClick={() => setEditing(i)}>
                    تعديل
                  </button>
                  <button
                    className="a-btn danger"
                    disabled={busy !== null}
                    onClick={() =>
                      act(key, () => setFlag(it.id, 'disabled', `تدقيق 9 أكتوبر: ${it.why}`.slice(0, 300)), `حُجب ${it.id}`)
                    }
                  >
                    حجب
                  </button>
                  <button className="a-btn" disabled={busy !== null} onClick={() => dismiss(i, true)}>
                    اترك
                  </button>
                  {it.to && fromCount - 1 < FLOOR && (
                    <span className="a-err">
                      خليّة {it.c}/{cur?.level ?? it.l} فيها <span className="num">{fromCount}</span>
                    </span>
                  )}
                </div>
              )
            )}
            {st === 'dismissed' && (
              <div className="a-bar audit-acts">
                <button className="a-btn" onClick={() => dismiss(i, false)}>
                  أعده إلى الانتظار
                </button>
              </div>
            )}
          </div>
        )
      })}

      {shown.length > limit && (
        <button className="a-btn audit-more" onClick={() => setLimit(limit + PAGE * 4)}>
          المزيد ({shown.length - limit} باقية)
        </button>
      )}
    </div>
  )
}

function EditBox({
  cur,
  level,
  busy,
  onSave,
  onCancel,
}: {
  cur: AdminQuestionEdit
  level?: string
  busy: boolean
  onSave: (q: string, a: string, l: string) => void
  onCancel: () => void
}) {
  const [q, setQ] = useState(cur.question)
  const [a, setA] = useState(cur.answer)
  const [l, setL] = useState(level ?? cur.level)
  return (
    <div className="audit-edit">
      <textarea className="a-in" rows={3} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="a-bar">
        <input className="a-in audit-ans" value={a} onChange={(e) => setA(e.target.value)} />
        <select className="a-in" value={l} onChange={(e) => setL(e.target.value)}>
          {LEVELS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="a-btn go" disabled={busy || !q.trim() || !a.trim()} onClick={() => onSave(q, a, l)}>
          حفظ
        </button>
        <button className="a-btn" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  )
}
