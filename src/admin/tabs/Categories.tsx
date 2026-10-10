import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  type AdminQuestionEdit,
  type CategoryRow,
  type GroupRow,
  addCategory,
  addGroup,
  deleteCategory,
  deleteGroup,
  listCategoryRows,
  listGroups,
  listQuestionEdits,
  renameGroup,
  reorderGroups,
  reorderCategories,
  saveCategoryArt,
  setCategoryGroup,
  setCategoryHidden,
  saveCategoryInfo,
  renameCategory,
} from '../../lib/admin'
import { uploadArt } from '../../lib/uploads'
import { useBank, useLoad } from '../shared'
import { CELL_FLOOR, merge } from '../questionRows'
import { LEVELS } from '../../game/levels'
import { ArtCell } from '../QuestionForm'

/**
 * الفئات: المشحونة مع التطبيق والمضافة من هنا، ومعها ما ينقص كلَّ واحدة.
 *
 * **الرقم الذي يهمّ هو «هل تدخل العجلة؟»** لا عدد أسئلتها: السحب يقع على
 * (فئة، مستوى) والمستوى يتبع موضع السؤال في الجلسة لا اختيار الحكم، ففئةٌ
 * بلا سؤال «صعب» تُسقط اللعبة عند السؤال السابع. ولهذا لا تدخل العجلة حتى
 * تكتمل مستوياتها الثلاثة — والجدول يقول صراحةً ما الناقص.
 */
export function Categories() {
  const bank = useBank()
  const { data: edits, err: editsErr } = useLoad<AdminQuestionEdit[]>(listQuestionEdits)
  const { data: cats, err, reload } = useLoad<CategoryRow[]>(listCategoryRows)
  /* التصنيفات تُقرأ مستقلّةً عن الفئات: التصنيف الفارغ الذي لم تدخله فئةٌ
     بعدُ لا أثر له في صفوف الفئات — انظر `listGroups`. */
  const { data: groups, reload: reloadGroups } = useLoad<GroupRow[]>(listGroups)
  const [art, setArt] = useState<Record<string, string> | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* صور الفئات المشحونة تُحمَّل عند فتح اللسان وحده — هي ملفّات صور في
     الحزمة، ولا معنى لتحميلها لمن جاء يمنح لعبة. */
  useEffect(() => {
    let alive = true
    import('../../components/categoryArt').then((m) => {
      if (alive) setArt(m.CATEGORY_ART)
    })
    return () => {
      alive = false
    }
  }, [])

  const rows = useMemo(() => {
    if (!bank || !edits || !cats) return null
    const merged = merge(bank, edits)
    const byName = new Map(cats.map((c) => [c.name, c]))
    const extraNames = cats.filter((c) => c.is_extra !== false).map((c) => c.name)
    const names = [...new Set([...bank.map((b) => b.category), ...extraNames])]
    return names.map((cat) => {
      const mine = merged.filter((r) => r.q.category === cat)
      const counts = LEVELS.map((l) => mine.filter((r) => r.q.level === l).length)
      const row = byName.get(cat)
      return {
        cat,
        counts,
        total: mine.length,
        added: row?.is_extra !== false && byName.has(cat) && extraNames.includes(cat),
        uploaded: row?.art_url ?? null,
        shipped: art?.[cat] ?? null,
        missing: LEVELS.filter((_, i) => counts[i] === 0),
        group: row?.group_name ?? null,
        /* مستبعَدة من اللوح مؤقّتاً — علمٌ يُرفع من الزرّ نفسه. */
        hidden: row?.hidden === true,
        /* نبذة (i) وسؤالها المثال — تُحرَّر من زرّ «النبذة». */
        info: { brief: row?.info_brief ?? '', q: row?.info_q ?? '', a: row?.info_a ?? '' },
        /* موضعها داخل تصنيفها؛ وما لم يُرتَّب يتبع ترتيب القائمة (`at`) —
           ترتيبَ شاشة الإعداد نفسه: المشحونة ثمّ المضافة بتاريخ إضافتها. */
        sort: typeof row?.sort === 'number' ? row.sort : null,
        at: names.indexOf(cat),
        /* ما دون الحدّ يُرى من هنا لا من محاولةٍ تُردّ: الخليّة تحت عشرين
           تمنع الحذف والنقل (`assert_cell_floor`)، وهي أيضاً ما ينقص الفئة
           الجديدة لتصير كاملة. */
        thin: LEVELS.filter((_, i) => counts[i] > 0 && counts[i] < CELL_FLOOR),
      }
    })
  }, [bank, edits, cats, art])

  /**
   * ترتيب العرض **هو ترتيب شاشة الإعداد**: التصنيفات بترتيبها ثمّ ما لا
   * تصنيف له، وداخل كلّ تصنيف الفئاتُ بما رُتّبت ثمّ ما لم يُرتَّب بموضعه في
   * القائمة (`groupCategories`). كان أبجديّاً هنا وبترتيب القائمة هناك،
   * فالسهم يحرّك ما يراه المدير لا ما يراه الحكم لو اختلفا.
   */
  const ordered = useMemo(() => {
    if (!rows) return null
    const at = new Map((groups ?? []).map((g, i) => [g.name, i]))
    const big = Number.MAX_SAFE_INTEGER
    return [...rows].sort((a, b) => {
      const ga = a.group === null ? big : (at.get(a.group) ?? 1e6)
      const gb = b.group === null ? big : (at.get(b.group) ?? 1e6)
      return ga - gb || (a.sort ?? big) - (b.sort ?? big) || a.at - b.at
    })
  }, [rows, groups])

  /* ── ترتيب الفئات داخل تصنيفها (طلب علي ٢٣ سبتمبر ٢٠٢٦) ──
     يُرسَل ترتيب القسم كلّه لا خطوةً واحدة — كما في `GroupsBar`. */
  async function moveCat(cat: string, dir: -1 | 1) {
    if (!ordered) return
    const row = ordered.find((x) => x.cat === cat)
    if (!row) return
    const names = ordered.filter((x) => x.group === row.group).map((x) => x.cat)
    const i = names.indexOf(cat)
    const j = i + dir
    if (j < 0 || j >= names.length) return
    ;[names[i], names[j]] = [names[j], names[i]]
    setMsg(null)
    try {
      await reorderCategories(names)
      setMsg({ ok: true, text: `رُتّبت فئات «${row.group ?? 'بلا مظلّة'}»` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الترتيب' })
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const made = await addCategory(name)
      setName('')
      setMsg({ ok: true, text: `أُضيفت «${made}» — تدخل العجلة حين تكتمل مستوياتها الثلاثة` })
      reload()
    } catch (e2) {
      setMsg({ ok: false, text: e2 instanceof Error ? e2.message : 'تعذّرت الإضافة' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(cat: string, total: number) {
    setMsg(null)
    /* الحارسُ في القاعدة (`admin_delete_category`) لا هنا؛ وهذا سبقٌ له
       يقول الرقم: «تحمل أسئلة» وحدها لا تدلّ الحكمَ على كم بقي ولا أين. */
    if (total > 0) {
      setMsg({
        ok: false,
        text: `«${cat}» تحمل ${total} سؤالاً — احذفها من لسان الأسئلة أوّلاً، ثمّ عُد`,
      })
      return
    }
    try {
      await deleteCategory(cat)
      setMsg({ ok: true, text: `حُذفت «${cat}»` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الحذف' })
    }
  }

  /* ── التصنيفات: مظلّاتٌ تجمع الفئات في شاشة الإعداد ── */
  async function moveToGroup(cat: string, group: string | null) {
    setMsg(null)
    try {
      await setCategoryGroup(cat, group)
      setMsg({
        ok: true,
        text: group ? `«${cat}» صارت تحت «${group}»` : `«${cat}» خرجت من تصنيفها`,
      })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر النقل' })
    }
  }

  async function groupAction(run: () => Promise<unknown>, text: string) {
    setMsg(null)
    try {
      await run()
      setMsg({ ok: true, text })
      reloadGroups()
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الفعل' })
    }
  }

  /* ── الاستبعاد المؤقّت من اللوح (طلب علي ١٩ سبتمبر ٢٠٢٦) ── */
  async function hide(cat: string, hidden: boolean) {
    setMsg(null)
    try {
      await setCategoryHidden(cat, hidden)
      setMsg({
        ok: true,
        text: hidden
          ? `«${cat}» مستبعَدة من اللوح والديربي حتى تُعاد — أسئلتها باقية`
          : `«${cat}» عادت إلى اللوح`,
      })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر التغيير' })
    }
  }

  /* ── نبذة (i) وسؤالها المثال (طلب علي ٢٤ سبتمبر ٢٠٢٦) — لوحٌ تحت صفّ
     الفئة يُفتح من زرّ «النبذة»، مسوّدته محلّيّة حتى «حفظ». */
  const [infoOpen, setInfoOpen] = useState<string | null>(null)
  const [infoDraft, setInfoDraft] = useState({ brief: '', q: '', a: '' })
  function openInfo(cat: string, cur: { brief: string; q: string; a: string }) {
    if (infoOpen === cat) return setInfoOpen(null)
    setInfoDraft(cur)
    setInfoOpen(cat)
  }
  async function saveInfo(cat: string) {
    setMsg(null)
    try {
      await saveCategoryInfo(cat, infoDraft.brief, infoDraft.q, infoDraft.a)
      setMsg({
        ok: true,
        text: infoDraft.brief.trim()
          ? `حُفظت نبذة «${cat}» — تظهر للّاعبين عند تحديث الإعداد`
          : `أُزيلت نبذة «${cat}» فسقطت علامتها`,
      })
      setInfoOpen(null)
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر الحفظ' })
    }
  }

  /* ── إعادة التسمية (طلب علي ١٩ سبتمبر ٢٠٢٦) — للمضافة؛ والمشحونة تُردّ
     بسببها من القاعدة لا بزرٍّ مطفأ. */
  async function rename(cat: string) {
    const v = window.prompt(`اسمٌ جديد لـ«${cat}»`, cat)
    if (v === null) return
    const clean = v.trim()
    if (clean.length < 2 || clean === cat) return
    setMsg(null)
    try {
      const made = await renameCategory(cat, clean)
      setMsg({ ok: true, text: `صارت «${cat}» تُسمّى «${made}» — وأسئلتها معها` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّرت التسمية' })
    }
  }

  async function art_(cat: string, file: File | null) {
    setMsg(null)
    try {
      const url = file ? await uploadArt(file, 'categories') : null
      await saveCategoryArt(cat, url)
      setMsg({ ok: true, text: url ? `بُدّلت صورة «${cat}»` : `أُعيدت صورة «${cat}» الأصلية` })
      reload()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'تعذّر رفع الصورة' })
    }
  }

  /* خطأُ أيٍّ من القراءتين يُقال، وإلّا بقيت الصفحة على «…» بلا سبب (مراجعة ٢٥ سبتمبر). */
  if (err ?? editsErr) return <p className="a-err">{err ?? editsErr}</p>
  if (!rows || !ordered) return <p className="a-note">…</p>

  return (
    <>
      {/* التصنيفات أوّلاً: الفئة تُنشأ ثمّ تُوضع تحت مظلّة، فالمظلّات تُقرأ
          قبلها. وهي طبقةُ عرضٍ لا لعب — قِيلت هنا مرّةً حتى لا تُفهم على
          أنّها تغيّر السحب أو النقاط. */}
      <GroupsBar
        groups={groups ?? []}
        counts={rows.reduce<Record<string, number>>((acc, r) => {
          if (r.group) acc[r.group] = (acc[r.group] ?? 0) + 1
          return acc
        }, {})}
        onAdd={(n) => groupAction(() => addGroup(n), `أُضيف تصنيف «${n}»`)}
        onRename={(o, n) => groupAction(() => renameGroup(o, n), `صار «${o}» يُسمّى «${n}»`)}
        onDelete={(n) => groupAction(() => deleteGroup(n), `حُذف «${n}» — وفئاتُه بلا تصنيف الآن`)}
        onReorder={(names) => groupAction(() => reorderGroups(names), 'رُتّبت التصنيفات')}
      />

      <form className="a-form" onSubmit={add}>
        <div className="a-field">
          <label htmlFor="cat-name">فئة جديدة</label>
          <input
            id="cat-name"
            className="a-in"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الفئة كما يظهر في العجلة"
          />
        </div>
        <button className="a-btn go" type="submit" disabled={busy || name.trim().length < 2}>
          {busy ? '…' : 'إضافة'}
        </button>
        {msg && <p className={msg.ok ? 'a-ok' : 'a-err'}>{msg.text}</p>}
      </form>

      {/* الصورة المرفوعة تُجلب من الشبكة بخلاف المشحونة — أوّل عرضٍ لها
          يحتاج اتّصالاً، ثمّ يخزّنها المتصفّح. */}
      <p className="a-note">
        الصورة المفضّلة بنسبة 3:2 وعرض 1024 بكسلاً. والمرفوعة تحتاج اتّصالاً في أوّل عرض، بخلاف الصور المشحونة
        مع التطبيق.
      </p>

      <div className="a-card a-scroll">
        <table className="a-tbl">
          <thead>
            <tr>
              <th>الترتيب</th>
              <th>الصورة</th>
              <th>الفئة</th>
              <th>التصنيف</th>
              <th>المصدر</th>
              {/* عناوينُ المستويات من مصدرها الواحد. كانت مكتوبةً بيدها على
                  ثلاثة، فلمّا دخل «تعجيزي» في ٩ سبتمبر ٢٠٢٦ صار الجدول
                  أربعةَ أرقامٍ تحت ثلاثة عناوين — و«في العجلة» يقف فوق
                  أرقام التعجيزي. */}
              {LEVELS.map((l) => (
                <th key={l}>{l}</th>
              ))}
              <th>في اللوح</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordered.map((r, i) => (
              <Fragment key={r.cat}>
                {/* عنوانُ المظلّة فوق فئاتها — صفٌّ واحد لا عمودٌ يتكرّر في
                    كل سطر. الجدول مرتَّبٌ بالمظلّة أصلاً (`ordered`)، فتبدُّلُ
                    الاسم عن الصفّ السابق هو الحدُّ بين قسمٍ وقسم. */}
                {(i === 0 || ordered[i - 1].group !== r.group) && (
                  <tr className="grp-row">
                    {/* رقمٌ أكبر من عدد الأعمدة عمداً: المتصفّح يقصّه إلى
                        عرض الصفّ، فلا يحتاج عدّاً يدويّاً ينزاح كلّما
                        أُضيف عمود — وقد انزاح فعلاً في هذا الجدول نفسه
                        (أربعة أرقامٍ تحت ثلاثة عناوين، ٩ سبتمبر ٢٠٢٦). */}
                    <th colSpan={99} scope="colgroup">
                      {r.group ?? 'بلا مظلّة'}
                      <span className="grp-n">{ordered.filter((x) => x.group === r.group).length} فئة</span>
                    </th>
                  </tr>
                )}
                <tr>
                  <td className="ord-cell">
                    {/* السهمان داخل التصنيف وحده: عنوانُ القسم حدٌّ لا يُعبَر —
                      النقلُ بين التصنيفات من عمود «التصنيف». */}
                    <button
                      className="a-btn slim"
                      aria-label={`رفع ${r.cat}`}
                      onClick={() => moveCat(r.cat, -1)}
                      disabled={i === 0 || ordered[i - 1].group !== r.group}
                    >
                      ↑
                    </button>
                    <button
                      className="a-btn slim"
                      aria-label={`خفض ${r.cat}`}
                      onClick={() => moveCat(r.cat, 1)}
                      disabled={i === ordered.length - 1 || ordered[i + 1].group !== r.group}
                    >
                      ↓
                    </button>
                  </td>
                  <td>
                    <ArtCell
                      src={r.uploaded ?? r.shipped}
                      uploaded={r.uploaded !== null}
                      onPick={(f) => art_(r.cat, f)}
                      onClear={() => art_(r.cat, null)}
                    />
                  </td>
                  <td>
                    <b>{r.cat}</b>
                    {/* قلمُ التسمية بجانب الاسم لا في عمود الأفعال: يُضغط دائماً،
                      والمشحونة تقول سببها. */}
                    <button
                      className="a-btn slim rename"
                      title="إعادة تسمية"
                      aria-label={`إعادة تسمية ${r.cat}`}
                      onClick={() => rename(r.cat)}
                    >
                      ✎
                    </button>
                  </td>
                  <td>
                    {/* قائمةٌ لا حقلٌ يُكتب: تصنيفٌ بخطأ مطبعيّ يصير مظلّةً
                      ثانية بفئةٍ واحدة — نفس علّة الفئة في رفع الملفّ. */}
                    <select
                      className="a-in slim"
                      value={r.group ?? ''}
                      onChange={(e) => moveToGroup(r.cat, e.target.value || null)}
                    >
                      <option value="">— بلا تصنيف —</option>
                      {(groups ?? []).map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={'tag' + (r.added ? ' open' : '')}>{r.added ? 'مضافة' : 'البنك'}</span>
                  </td>
                  {r.counts.map((n, i) => (
                    <td
                      key={i}
                      /* الخليّة الرقيقة تُرى قبل أن تُردّ: تحت عشرين يمنع
                       القاعدةُ النقلَ منها والحذفَ فيها. */
                      className={'num' + (n === 0 ? ' muted' : n < CELL_FLOOR ? ' thin' : '')}
                      title={n > 0 && n < CELL_FLOOR ? `تحت الحدّ — ينقصها ${CELL_FLOOR - n}` : ''}
                    >
                      {n}
                    </td>
                  ))}
                  <td>
                    {r.hidden ? (
                      /* المستبعَدة تُقال قبل الاكتمال: هي التي تمنعها من اللوح
                       الآن مهما اكتملت. */
                      <span className="tag abandoned">مستبعَدة مؤقّتاً</span>
                    ) : r.missing.length === 0 ? (
                      r.thin.length === 0 ? (
                        <span className="tag finished">نعم</span>
                      ) : (
                        /* تدخل اللوح فعلاً — الشرط سؤالٌ واحد لا عشرون — لكنّ
                         خليّتها الرقيقة تمنع التعديل عليها، فتُقال. */
                        <span className="tag open">نعم · {r.thin.join(' و')} تحت الحدّ</span>
                      )
                    ) : (
                      <span className="tag abandoned">ينقصها {r.missing.join(' و')}</span>
                    )}
                  </td>
                  <td className="a-actions">
                    {/* استبعادٌ لا حذف: علمٌ على الفئة يُرفع بالزرّ نفسه،
                      وأسئلتُها لا تُمسّ — طلب علي ١٩ سبتمبر ٢٠٢٦. لكلّ
                      فئةٍ، مشحونةً كانت أو مضافة. */}
                    <button
                      className={'a-btn' + (infoOpen === r.cat ? ' on' : '')}
                      onClick={() => openInfo(r.cat, r.info)}
                      title={r.info.brief ? 'تحرير النبذة' : 'لا نبذة — لا علامة (i) على البطاقة'}
                    >
                      {r.info.brief ? 'النبذة' : 'النبذة ＋'}
                    </button>
                    <button className="a-btn" onClick={() => hide(r.cat, !r.hidden)}>
                      {r.hidden ? 'إعادة إلى اللوح' : 'استبعاد من اللوح'}
                    </button>
                    {r.added && (
                      /* **يُضغط دائماً، ويقول سببَه عند الرفض.** كان معطَّلاً
                       والسببُ في تلميحٍ لا يظهر إلّا بالتحويم — فقرأه علي
                       «الزرّ لا يعمل»، وهي ثالث مرّة يخدعه فيها زرٌّ رماديّ
                       (خانةُ التحديد وزرُّ الحذف قبله). الرفضُ المشروح أوضح
                       من التعطيل الصامت. */
                      <button className="a-btn danger" onClick={() => remove(r.cat, r.total)}>
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
                {infoOpen === r.cat && (
                  <tr className="info-row">
                    <td colSpan={99}>
                      <div className="info-ed">
                        <label>
                          <span>النبذة</span>
                          <textarea
                            className="a-in"
                            rows={2}
                            value={infoDraft.brief}
                            onChange={(e) => setInfoDraft({ ...infoDraft, brief: e.target.value })}
                            placeholder="فارغة = لا علامة (i) على البطاقة"
                          />
                        </label>
                        <label>
                          <span>السؤال المثال — لا يُلعب</span>
                          <input
                            className="a-in"
                            value={infoDraft.q}
                            onChange={(e) => setInfoDraft({ ...infoDraft, q: e.target.value })}
                          />
                        </label>
                        <label>
                          <span>جوابه — فارغ في فئات الصور</span>
                          <input
                            className="a-in"
                            value={infoDraft.a}
                            onChange={(e) => setInfoDraft({ ...infoDraft, a: e.target.value })}
                          />
                        </label>
                        <div className="info-ed-actions">
                          <button className="a-btn go" onClick={() => saveInfo(r.cat)}>
                            حفظ
                          </button>
                          <button className="a-btn" onClick={() => setInfoOpen(null)}>
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/**
 * شريط التصنيفات — إضافةٌ وتسميةٌ وترتيبٌ وحذف.
 *
 * **الترتيب يُرسَل كاملاً** لا خطوةً خطوة: «ارفع هذا» يحتاج قراءة الجار
 * وكتابتَه، وضغطتان متسارعتان تتبادلان الرقم نفسه.
 *
 * والحذف لا يشترط الفراغ بخلاف حذف الفئة: الفئة تحمل أسئلتها فتضيع معها،
 * والتصنيف لا يحمل شيئاً — فئاتُه تخرج من مظلّتها وتبقى كما هي.
 */
function GroupsBar({
  groups,
  counts,
  onAdd,
  onRename,
  onDelete,
  onReorder,
}: {
  groups: GroupRow[]
  counts: Record<string, number>
  onAdd: (name: string) => void
  onRename: (oldName: string, newName: string) => void
  onDelete: (name: string) => void
  onReorder: (names: string[]) => void
}) {
  const [name, setName] = useState('')

  function move(i: number, dir: -1 | 1) {
    const next = [...groups.map((g) => g.name)]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onReorder(next)
  }

  function rename(g: GroupRow) {
    const v = window.prompt(`اسمٌ جديد لـ«${g.name}»`, g.name)
    if (v === null) return
    const clean = v.trim()
    if (!clean || clean === g.name) return
    onRename(g.name, clean)
  }

  return (
    <div className="a-card groups-bar">
      <div className="gb-head">
        <b>التصنيفات</b>
        <span className="a-note gb-note">
          مظلّاتٌ تجمع الفئات في شاشة الإعداد — لا تُلعب ولا يُسحب منها، وترتيبُها هنا هو ترتيبُ عناوينها
          هناك.
        </span>
      </div>

      <form
        className="gb-add"
        onSubmit={(e) => {
          e.preventDefault()
          const clean = name.trim()
          if (clean.length < 2) return
          onAdd(clean)
          setName('')
        }}
      >
        <input
          className="a-in"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="تصنيف جديد — «رياضة» مثلاً"
        />
        <button className="a-btn go" type="submit" disabled={name.trim().length < 2}>
          إضافة
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="a-note">لا تصنيف بعد — الفئات كلّها تُعرض في قسمٍ واحد كما كانت.</p>
      ) : (
        <ul className="gb-list">
          {groups.map((g, i) => (
            <li key={g.name}>
              <span className="gb-name">{g.name}</span>
              <span className="gb-count">{counts[g.name] ?? 0} فئة</span>
              <button className="a-btn" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button className="a-btn" onClick={() => move(i, 1)} disabled={i === groups.length - 1}>
                ↓
              </button>
              <button className="a-btn" onClick={() => rename(g)}>
                تسمية
              </button>
              <button
                className="a-btn danger"
                onClick={() => {
                  /* يُخرج فئاته كلَّها من التصنيف في ضغطة، وإعادتُها فئةً فئة. */
                  const n = counts[g.name] ?? 0
                  if (window.confirm(`حذفُ تصنيف «${g.name}»؟ ${n} فئة ستبقى بلا تصنيف.`)) onDelete(g.name)
                }}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .groups-bar { padding:14px 16px; margin-bottom:14px; }
        .gb-head { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
        .gb-note { margin:0; }
        .gb-add { display:flex; gap:8px; margin:10px 0; max-width:520px; }
        .gb-add .a-in { flex:1; }
        .gb-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .gb-list li {
          display:flex; align-items:center; gap:8px;
          padding:6px 10px; border-radius:10px; background:var(--n-surface-2);
        }
        .gb-name { font-weight:800; }
        /* العدّاد يدفع الأزرار إلى الطرف فتصطفّ عمودياً مهما طالت الأسماء. */
        .gb-count { margin-inline-end:auto; opacity:.7; font-size:13px; }
      `}</style>
    </div>
  )
}
