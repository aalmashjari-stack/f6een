export interface ChoiceBoxProps {
  /** «إجابة صحيحة» / «إجابة خاطئة» */
  label: string
  /** النقاط كما تُعرض: «+20» أو «−10» */
  points: string
  tone?: 'gold' | 'coral'
  selected?: boolean
  /** يخفت لأن الخيار المقابل مُختار */
  dimmed?: boolean
  onClick?: () => void
}

/**
 * صندوق حكم واحد — «إجابة صحيحة +20» أو «إجابة خاطئة −10».
 *
 * الخياران يظهران **معاً** لا في بطاقة تدوّر حالتها: التدوير يُخفي «غلط» خلف
 * ضغطتين ويُلزم المشغّل بحفظ ترتيب الدورة، والضغطة الزائدة في لعبة سريعة خطأ.
 *
 * الضغط على المضيء نفسه يلغيه — التراجع بضغطة واحدة.
 */
export function ChoiceBox({ label, points, tone = 'gold', selected, dimmed, onClick }: ChoiceBoxProps) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={
        `sh-choice sh-choice--${tone}` +
        (selected ? ' sh-choice--on' : '') +
        (dimmed ? ' sh-choice--dim' : '')
      }
    >
      <span className="sh-choice__label">{label}</span>
      <span className="sh-choice__pts sh-num">{points}</span>
    </button>
  )
}
