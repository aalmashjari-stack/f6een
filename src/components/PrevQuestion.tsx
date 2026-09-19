import { useMemo, useState } from 'react'
import type { GameState } from '../game/session'
import { allQuestions } from '../game/bank'
import { celebSrc } from '../game/celebs'

/**
 * «السؤال السابق» — زرٌّ بجانب «اكشف الإجابة» يعرض آخرَ سؤالٍ مرّ في الجلسة
 * مع جوابه (طلب علي ٢٠ سبتمبر ٢٠٢٦): يُختلف في المجلس على ما قيل قبل
 * دقيقة، فيُستحضر بضغطةٍ ويُغلق بضغطة.
 *
 * طبقةُ عرضٍ محضة: لا تمسّ الحالة ولا المؤقّت — الجلسة تمضي تحتها. والسابق
 * يُقرأ من `askedQuestionIds` (ترتيب العرض في هذه الجلسة) لا من الذاكرة
 * التراكميّة. وحين لا سابق (أوّل سؤال) لا يظهر الزرّ أصلاً بدل أن يُعطَّل —
 * الزرّ المطفأ يُقرأ معطوباً.
 */
export function PrevQuestion({ state }: { state: GameState }) {
  const [open, setOpen] = useState(false)
  const prev = useMemo(() => {
    const ids = state.askedQuestionIds
    const cur = state.currentQuestion?.id
    const at = cur ? ids.lastIndexOf(cur) : ids.length
    const id = at > 0 ? ids[at - 1] : undefined
    if (!id) return null
    return allQuestions().find((q) => q.id === id) ?? null
  }, [state.askedQuestionIds, state.currentQuestion])

  if (!prev) return null

  return (
    <>
      <button className="action compact ghost pq-btn" onClick={() => setOpen(true)}>
        السؤال السابق
      </button>
      {open && (
        <div className="pq-veil" onClick={() => setOpen(false)}>
          <div
            className="pq"
            role="dialog"
            aria-label="السؤال السابق"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="pq-head">
              <b>السؤال السابق</b>
              <span className="pq-cat">{prev.category}</span>
            </header>
            {prev.image && <img className="pq-img" src={celebSrc(prev.image)} alt="" />}
            <p className="pq-q">{prev.question}</p>
            <p className="pq-a">{prev.answer}</p>
            <button className="action compact pq-close" onClick={() => setOpen(false)}>
              رجوع
            </button>
          </div>
        </div>
      )}
      <style>{`
        .pq-veil {
          position:fixed; inset:0; z-index:80;
          display:flex; align-items:center; justify-content:center; padding:16px;
          background:rgba(10,8,20,.55);
        }
        .pq {
          display:flex; flex-direction:column; align-items:center; gap:10px;
          width:min(720px, 100%); max-height:min(88dvh, 640px);
          padding:18px 20px; overflow:auto;
          background:var(--n-surface, #fff); color:var(--n-ink, #1A1626);
          border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.3);
          text-align:center;
        }
        .pq-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; width:100%; }
        .pq-head b { font-size:15px; font-weight:900; color:var(--n-ink-3, #948CA8); }
        .pq-cat { font-size:13px; font-weight:800; color:var(--n-ink-3, #948CA8); }
        .pq-img {
          max-height:min(34dvh, 240px); max-width:100%; object-fit:contain;
          border-radius:12px;
        }
        .pq-q { margin:0; font-size:clamp(16px, 2.2vw, 24px); font-weight:800; line-height:1.5; }
        .pq-a {
          margin:0; font-size:clamp(18px, 2.6vw, 28px); font-weight:900; line-height:1.4;
          color:var(--n-brand, #7A3E9D);
        }
        .pq-close { margin-top:4px; }
        @media (max-height:480px) {
          .pq { gap:6px; padding:10px 14px; }
          .pq-img { max-height:30dvh; }
        }
      `}</style>
    </>
  )
}
