import { HexCell } from './HexCell'
import type { HexCellProps } from './HexCell'

export interface HexGridProps {
  /** تسعة تصنيفات في ثلاثة صفوف — الصف الأوسط مُزاح بنصف خلية */
  cells: HexCellProps[]
}

/**
 * شبكة خلية النحل — بديل عجلة التصنيفات.
 *
 * الصفوف متداخلة رأسياً بربع الارتفاع والصف الأوسط مُزاح بنصف خلية، فتشتبك
 * كخلية نحل حقيقية. التصميم مبنيّ على تسع خلايا في ثلاثة صفوف.
 *
 * السحبة نهائية بلا إعادة: الشبكة تعرض ما خرج وما بقي، ولا تعطي المشغّل
 * سلطة تقديرية في الاختيار.
 */
export function HexGrid({ cells }: HexGridProps) {
  const rows = [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 9)]
  return (
    <div className="sh-hexgrid">
      {rows.map((row, r) => (
        <div key={r} className={'sh-hexgrid__row' + (r % 2 === 1 ? ' sh-hexgrid__row--offset' : '')}>
          {row.map((c, i) => (
            <HexCell key={i} {...c} />
          ))}
        </div>
      ))}
    </div>
  )
}
