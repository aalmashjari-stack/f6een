export interface StatRowProps {
  /** قيمة الفريق الأول — يميناً في RTL */
  right: string | number
  label: string
  /** قيمة الفريق الثاني — يساراً في RTL */
  left: string | number
  /** head = صفّ العناوين · total = صفّ المجموع بإطار ذهبي */
  variant?: 'default' | 'head' | 'total'
  /** يبرز الأعلى ذهبياً — الفرق يُقرأ بلمحة بلا مقارنة رقمين */
  highlight?: 'right' | 'left' | 'none'
}

/**
 * صفّ إحصائي بثلاثة أعمدة: قيمة · تسمية · قيمة.
 *
 * أساس جدول «من أين جاءت النقاط» في شاشة الختام. قاعدة واحدة تحكمه:
 * **الأرقام تُجمع فتساوي النتيجة النهائية** — القارئ يتحقّق بنفسه ولا يُطالَب
 * بتصديق رقم مشتق لا يستطيع مراجعته.
 */
export function StatRow({ right, label, left, variant = 'default', highlight = 'none' }: StatRowProps) {
  const cls = (side: 'right' | 'left') =>
    'sh-statrow__num sh-num' + (highlight === side ? ' sh-statrow__num--up' : '')
  return (
    <div className={'sh-statrow' + (variant !== 'default' ? ` sh-statrow--${variant}` : '')}>
      <span className={cls('right')}>{right}</span>
      <span className="sh-statrow__label">{label}</span>
      <span className={cls('left')}>{left}</span>
    </div>
  )
}
