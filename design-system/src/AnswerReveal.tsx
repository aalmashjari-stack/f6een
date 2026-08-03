export interface AnswerRevealProps {
  /** الإجابة — أكبر عنصر في الشاشة عند الكشف */
  answer: string
  /** السؤال يبقى فوقها منكمشاً وباهتاً: الجمهور يحتاجه ليفهم الإجابة */
  question?: string
  label?: string
}

/**
 * لحظة الكشف — ذروة السؤال.
 *
 * الإجابة أكبر عنصر (حتى 52px) والإطار ذهبي متوهّج. والسؤال لا يختفي: ينكمش
 * ويبهت ويبقى فوقها، لأن من دخل متأخراً يقرأ الإجابة بلا سؤال فلا يفهم شيئاً.
 */
export function AnswerReveal({ answer, question, label = 'الإجابة' }: AnswerRevealProps) {
  return (
    <div className="sh-answer">
      {question && <p className="sh-answer__question">{question}</p>}
      <span className="sh-answer__label">{label}</span>
      <span className="sh-answer__text">{answer}</span>
    </div>
  )
}
