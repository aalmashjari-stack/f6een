export interface IntervalCardProps {
  /** «المرحلة القادمة» — أو خبر آخر مثل «انتهت المراحل والنتيجة» */
  eyebrow: string
  title: string
  /** أهم سطر في الشاشة: قاعدة المرحلة القادمة بصيغة يفهمها من لم يلعبها قبل */
  rule: string
  /** coral للحظة معلّقة بسؤال واحد (التعادل) */
  tone?: 'gold' | 'coral'
}

/**
 * بطاقة الفاصل بين المراحل — تعلن ما هو قادم وتذكّر بقاعدته.
 *
 * سطر القاعدة هو سبب وجود الشاشة: قواعد المرحلة تتغيّر، والفريق الذي لم
 * يستوعب أنها تغيّرت يخالفها في أول سؤال ثم يشعر بالظلم.
 *
 * اكتب القاعدة بصيغة يفهمها من لم يلعبها قبل، لا باختصار يفهمه من يعرفها.
 */
export function IntervalCard({ eyebrow, title, rule, tone = 'gold' }: IntervalCardProps) {
  return (
    <div className={'sh-interval' + (tone === 'coral' ? ' sh-interval--coral' : '')}>
      <div className="sh-interval__eyebrow">{eyebrow}</div>
      <div className="sh-interval__title">{title}</div>
      <div className="sh-interval__rule">{rule}</div>
    </div>
  )
}
