export interface HexCellProps {
  label: string
  /** idle = متاح · active = الضوء يمرّ عليه الآن · landed = وقع الاختيار · spent = خرج سابقاً */
  state?: 'idle' | 'active' | 'landed' | 'spent'
}

/**
 * خلية سداسية واحدة — وحدة اختيار التصنيف.
 *
 * السداسي مدبّب الرأس ليبقى النص أفقياً: القرص الدوّار كان يقلب نصّ القطاعات
 * السفلية فيصعب قراءتها، والوضوح شرط تشغيل.
 *
 * **المستهلَك يبقى ظاهراً باهتاً لا يختفي.** الإخفاء يجعل الشبكة تتقلّص بلا
 * تفسير ويفتح باب الاتهام بالتلاعب — وهذه لعبة يديرها حكم أمام فريقين.
 */
export function HexCell({ label, state = 'idle' }: HexCellProps) {
  return (
    <div className={'sh-hex' + (state !== 'idle' ? ` sh-hex--${state}` : '')}>
      <span className="sh-hex__face">
        <span className="sh-hex__label">{label}</span>
      </span>
    </div>
  )
}
