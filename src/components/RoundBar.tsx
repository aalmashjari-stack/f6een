/**
 * شريطُ سياقِ الجولة — لغةٌ بصرية واحدة لكلّ شاشات اللعب: عنوانٌ بارز ثمّ
 * رقائقُ للوسائط (المستوى، القاعدة، رقم السؤال، صاحب الدور)، بدل سطرٍ مزدحمٍ
 * تفصله النقاط. أنماطُه في theme.css (‏.rd) فتُقرأ كلّ الشاشات بشكلٍ واحد.
 */
export function RoundBar({
  title,
  chips,
  turn,
}: {
  title: string
  /** الوسائط الثانوية — تُرمى الفارغة منها فيسهل تمرير قيمةٍ شرطية. */
  chips?: (string | false | null | undefined)[]
  /** رقاقة صاحب الدور — ذهبية، أهمّ معلومة في الشريط حين تُذكر. */
  turn?: string
}) {
  return (
    <div className="rd center">
      <span className="rd-mark" aria-hidden="true">◆</span>
      <span className="rd-title">{title}</span>
      <span className="rd-meta">
        {chips?.filter(Boolean).map((c, i) => (
          <span key={i} className="rd-chip">
            {c}
          </span>
        ))}
        {turn && <span className="rd-chip turn">{turn}</span>}
      </span>
    </div>
  )
}
