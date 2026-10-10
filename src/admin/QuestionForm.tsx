import { useState } from 'react'
import { uploadArt } from '../lib/uploads'
import type { Question } from '../game/types'
import { saveQuestion } from '../lib/admin'
import { type Row, resolveImage } from './questionRows'
import { LEVELS } from '../game/levels'

/**
 * صورة السؤال في اللوحة: الرابط المرفوع يُعرض كما هو، والمفتاح المشحون
 * (`celeb-…`) يُحلّ إلى ملفّه.
 *
 * كانت تُرجع فراغاً للمفتاح — «معاينةٌ صغيرة لا تستحقّ تحميل صور المشاهير
 * كلّها». والثمن لم يكن تحميلاً: `import.meta.glob` بـ`?url` يجمع مساراتٍ
 * نصّية لا صوراً، والصورة وحدها تُطلب عند عرضها. أمّا الخسارة فكانت أنّ
 * تعديل سؤال «مشاهير» يُظهر إطاراً فارغاً كأنّ صورته ضاعت — وهي سليمة.
 */
/**
 * مصغَّرةُ صورةٍ في الجدول — للسؤال والإجابة معاً.
 *
 * جسمٌ واحد لا جسمان: نسخُه للإجابة كان يكرّر ستّة عشر سطراً بمُعالِجَي
 * ضغطٍ ولوحةِ مفاتيح، وأوّلُ تعديلٍ في أحدهما ينسى الآخر.
 */
export function QThumb({
  image,
  label,
  onZoom,
}: {
  image: string
  label: string
  onZoom: (z: { src: string; label: string }) => void
}) {
  const src = resolveImage(image)
  if (!src) return <span className="q-thumb empty" title={image} />
  return (
    <img
      className="q-thumb tap"
      src={src}
      alt=""
      loading="lazy"
      role="button"
      tabIndex={0}
      title="اضغط للتكبير"
      onClick={() => onZoom({ src, label })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onZoom({ src, label })
        }
      }}
    />
  )
}

/**
 * نموذج التعديل والإضافة.
 *
 * التصنيف قائمةٌ لا حقل حرّ: العجلة اثنا عشر تصنيفاً ثابتاً (SPEC ٧)، وتصنيف
 * جديد يعني سؤالاً لا تصل إليه العجلة أبداً.
 *
 * ومفتاح الصورة يُحمل كما هو ولا يُحرَّر: الصور مُجمَّعة في حزمة التطبيق،
 * فمفتاحٌ لا ملفّ له يعرض صورة العنصر النائب.
 */
export function QuestionForm({
  row,
  categories,
  onClose,
  onSaved,
}: {
  row: Row | null
  categories: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const base = row?.q
  const [category, setCategory] = useState(base?.category ?? categories[0] ?? '')
  const [level, setLevel] = useState(base?.level ?? 'متوسط')
  const [topic, setTopic] = useState(base?.topic ?? '')
  const [question, setQuestion] = useState(base?.question ?? '')
  const [answer, setAnswer] = useState(base?.answer ?? '')
  const [image, setImage] = useState<string | null>(base?.image ?? null)
  const [answerImage, setAnswerImage] = useState<string | null>(base?.answerImage ?? null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await saveQuestion({
        id: base?.id ?? null,
        category,
        level,
        topic,
        question,
        answer,
        image,
        answerImage,
      })
      onSaved()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر الحفظ')
      setBusy(false)
    }
  }

  return (
    <div className="q-veil" onClick={onClose}>
      <form className="q-box" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <header className="a-top" style={{ margin: 0 }}>
          <b>{base ? 'تعديل سؤال' : 'سؤال جديد'}</b>
          {base && <span className="muted ltr">{base.id}</span>}
        </header>

        <div className="a-bar">
          <div className="a-field">
            <label htmlFor="q-cat">التصنيف</label>
            <select
              id="q-cat"
              className="a-in"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="q-lvl">المستوى</label>
            <select
              id="q-lvl"
              className="a-in"
              value={level}
              onChange={(e) => setLevel(e.target.value as Question['level'])}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="q-topic">الموضوع</label>
            <input
              id="q-topic"
              className="a-in"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="اختياري"
            />
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="q-text">السؤال</label>
          <textarea
            id="q-text"
            className="a-in"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="a-field">
          <label htmlFor="q-ans">الإجابة</label>
          <input id="q-ans" className="a-in" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>

        <div className="a-field">
          <label>الصورة</label>
          <ArtCell
            src={image ? resolveImage(image) : null}
            uploaded={image !== null}
            onPick={async (f) => {
              setErr(null)
              try {
                setImage(await uploadArt(f, 'questions'))
              } catch (e2) {
                setErr(e2 instanceof Error ? e2.message : 'تعذّر رفع الصورة')
              }
            }}
            onClear={() => setImage(null)}
          />
          {/* الصورة تغيّر شكل السؤال كلّه، لا تزيّنه: `QuestionView` يعرضها
              بدل النصّ وفوقها «من صاحب الصورة؟». */}
          <p className="a-note" style={{ padding: 0 }}>
            سؤالٌ بصورة يُعرض صورةً فوقها «من صاحب الصورة؟» — والنصّ لا يظهر، والإجابة اسم صاحبها.
          </p>
        </div>

        <div className="a-field">
          <label>صورة الإجابة</label>
          <ArtCell
            src={answerImage ? resolveImage(answerImage) : null}
            uploaded={answerImage !== null}
            onPick={async (f) => {
              setErr(null)
              try {
                setAnswerImage(await uploadArt(f, 'questions'))
              } catch (e2) {
                setErr(e2 instanceof Error ? e2.message : 'تعذّر رفع الصورة')
              }
            }}
            onClear={() => setAnswerImage(null)}
          />
          {/* عكسُ الحقل الذي فوقه: السؤال يبقى نصّاً، والوجه لا يظهر إلّا في
              شاشة الكشف إلى جانب الاسم. فسؤالٌ عن شيءٍ مشهور واسمٍ مجهول
              يبقى تعجيزيّاً، ويُكافأ المجلس بالوجه حين يُكشف. */}
          <p className="a-note" style={{ padding: 0 }}>
            تظهر في شاشة الكشف إلى جانب الإجابة — والسؤال يبقى نصّاً. لا تضع الاثنتين معاً.
          </p>
        </div>

        {err && <p className="a-err">{err}</p>}

        <div className="a-bar" style={{ marginBlockEnd: 0 }}>
          <button className="a-btn go" type="submit" disabled={busy || !question.trim() || !answer.trim()}>
            {busy ? '…' : 'حفظ'}
          </button>
          <button className="a-btn" type="button" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * خانة صورة: معاينة، واختيار ملفّ، وإزالة.
 *
 * الإزالة تظهر للمرفوعة وحدها — الصورة المشحونة في الحزمة لا تُحذف من هنا،
 * وأقصى ما يفعله المدير أن يضع فوقها غيرها.
 */
export function ArtCell({
  src,
  uploaded,
  onPick,
  onClear,
}: {
  src: string | null
  uploaded: boolean
  onPick: (f: File) => void
  onClear: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    await Promise.resolve(onPick(f))
    setBusy(false)
  }

  return (
    <span className="art-cell">
      {src ? <img className="art-thumb" src={src} alt="" /> : <span className="art-thumb empty" />}
      <label className="a-btn art-pick">
        {busy ? '…' : uploaded ? 'تبديل' : 'رفع'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
      </label>
      {uploaded && (
        /* `type="button"`: الخانة داخل نموذج التعديل، وزرٌّ بلا نوع يُرسله —
           فكانت «إزالة» تحفظ التعديل نصفَ المكتوب وتغلق النموذج. */
        <button type="button" className="a-btn danger" onClick={onClear}>
          إزالة
        </button>
      )}
      <style>{`
        .art-cell { display:inline-flex; align-items:center; gap:6px; }
        .art-thumb {
          width:56px; height:38px; object-fit:cover; border-radius:8px;
          background:var(--n-surface-2); display:block;
        }
        .art-thumb.empty { box-shadow:inset 0 0 0 1px var(--n-line); }
        .art-pick { cursor:pointer; }
      `}</style>
    </span>
  )
}
