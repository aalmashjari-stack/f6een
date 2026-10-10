import { useMemo, useState } from 'react'
import {
  type AdminQuestionEdit,
  type CategoryRow,
  type DraftRow,
  listDraftBatches,
  listDraftRows,
  listCategoryRows,
  listQuestionEdits,
} from '../../lib/admin'
import { listArt, deleteArt, type ArtFile } from '../../lib/uploads'
import { useLoad } from '../shared'

/**
 * ملفّات دلو `art` وما يشير إلى كلٍّ منها.
 *
 * **الحذف يُضغط دائماً ويقول سببه**: ملفٌّ يستعمله سؤالٌ أو فئة يُردّ
 * باسم مستعمِله لا بزرٍّ رماديّ (انظر تعليق حذف الفئة). والمرجع هو
 * القاعدة الحيّة لا الحزمة: الصور المشحونة (`pic-`, `celeb-`…) ليست هنا
 * أصلاً — هنا ما رُفع من اللوحة وحده.
 */
export function Uploads() {
  const {
    data: files,
    err,
    reload,
  } = useLoad<ArtFile[]>(async () => [...(await listArt('questions')), ...(await listArt('categories'))])
  const { data: edits, err: editsErr } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  const { data: cats, err: catsErr } = useLoad<CategoryRow[]>(listCategoryRows)
  /* المسوّدات المعلَّقة تستعمل الدلو نفسه (حارسُ `agent_submit_drafts` لا
     يقبل غيره) — فصورةُ مسوّدةٍ لم تُعتمد كانت تظهر «بلا استعمال» وتُحذف، ثمّ
     يدخل سؤالُها البنكَ بصورةٍ مكسورة. */
  const { data: drafts, err: draftsErr } = useLoad<DraftRow[]>(async () => {
    const pending = (await listDraftBatches()).filter((b) => b.status === 'pending')
    return (await Promise.all(pending.map((b) => listDraftRows(b.batch)))).flat()
  })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  /* الرابط كما تحفظه اللوحة: `getPublicUrl` نفسه في الرفع والعرض، فالمطابقة
     نصّية لا بالمسار. */
  const users = useMemo(() => {
    const m = new Map<string, string[]>()
    const add = (url: string | null, who: string) => {
      if (!url) return
      m.set(url, [...(m.get(url) ?? []), who])
    }
    for (const e of edits ?? []) {
      add(e.image, `${e.question_id} — ${e.question.slice(0, 40)}`)
      add(e.answer_image, `${e.question_id} (صورة الإجابة) — ${e.question.slice(0, 40)}`)
    }
    for (const c of cats ?? []) add(c.art_url, `فئة «${c.name}»`)
    for (const d of drafts ?? []) {
      if (d.status !== 'pending') continue
      add(d.image ?? null, `مسوّدة «${d.category}» — ${d.question.slice(0, 40)}`)
      add(d.answer_image ?? null, `مسوّدة «${d.category}» (صورة الإجابة) — ${d.question.slice(0, 40)}`)
    }
    return m
  }, [edits, cats, drafts])

  async function remove(f: ArtFile) {
    const by = users.get(f.url) ?? []
    if (by.length > 0) {
      setMsg({ ok: false, text: `لم يُحذف — يستعمله: ${by.join(' · ')}. أزله منه أوّلاً.` })
      return
    }
    if (!confirm(`حذف ${f.path} نهائيّاً؟`)) return
    setBusy(f.path)
    setMsg(null)
    try {
      await deleteArt(f.path)
      setMsg({ ok: true, text: `حُذف ${f.path}` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الحذف' })
    }
    setBusy(null)
  }

  /* لا عرضَ قبل المسوّدات: قبلها تبدو صورُها «بلا استعمال» ويمرّ حذفُها — وهي
     الحادثة نفسها التي كتب لأجلها التعليق أعلاه. وخطأُ أيّ قراءة يُقال. */
  const loadErr = err ?? editsErr ?? catsErr ?? draftsErr
  if (loadErr) return <p className="a-err">{loadErr}</p>
  if (!files || !edits || !cats || !drafts) return <p className="a-note">…</p>

  const orphans = files.filter((f) => !users.has(f.url)).length

  return (
    <>
      <p className="a-note">
        {files.length} ملفّاً في التخزين، منها {orphans} لا يستعمله سؤالٌ ولا فئة. الصور المشحونة مع التطبيق
        ليست هنا.
      </p>
      {msg && <p className={msg.ok ? 'a-ok' : 'a-err'}>{msg.text}</p>}
      <div className="a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th />
              <th>الملفّ</th>
              <th className="num">الحجم</th>
              <th>رُفع</th>
              <th>يستعمله</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {files.map((f) => {
              const by = users.get(f.url) ?? []
              return (
                <tr key={f.path}>
                  <td>
                    <img className="art-thumb" src={f.url} alt="" loading="lazy" />
                  </td>
                  <td className="ltr">{f.path}</td>
                  <td className="num">{Math.round(f.bytes / 1024)} ك.ب</td>
                  <td>{f.createdAt.slice(0, 10)}</td>
                  <td>
                    {by.length === 0 ? (
                      <span className="tag abandoned">بلا استعمال</span>
                    ) : (
                      by.map((b) => <div key={b}>{b}</div>)
                    )}
                  </td>
                  <td>
                    <button className="a-btn danger" onClick={() => remove(f)} disabled={busy === f.path}>
                      {busy === f.path ? '…' : 'حذف'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        .art-thumb { width:56px; height:38px; object-fit:cover; border-radius:8px; background:var(--n-surface-2); display:block; }
      `}</style>
    </>
  )
}
