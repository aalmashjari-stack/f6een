import { HexGrid } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const CATS = [
  'جغرافيا ومعالم', 'تاريخ وحضارات', 'دين وسيرة',
  'علوم واختراعات', 'طب وصحة', 'أحياء وفلك',
  'أدب وفنون', 'تقنية ومنوعات', 'رياضة وأرقام',
]

/** بداية المرحلة: التسعة كلها متاحة. */
export const AllAvailable = () => (
  <div dir="rtl" style={{ ...stage, ['--sh-hex-w' as string]: '120px' }}>
    <HexGrid cells={CATS.map((label) => ({ label }))} />
  </div>
)

/** منتصف المرحلة: ثلاثة خرجت، والضوء يمرّ على رابع. */
export const MidRound = () => (
  <div dir="rtl" style={{ ...stage, ['--sh-hex-w' as string]: '120px' }}>
    <HexGrid
      cells={CATS.map((label, i) => ({
        label,
        state: i === 0 || i === 4 || i === 8 ? ('spent' as const)
          : i === 5 ? ('active' as const) : ('idle' as const),
      }))}
    />
  </div>
)

/** لحظة الاستقرار: التصنيف المسحوب ذهبي، والسحبة نهائية. */
export const Landed = () => (
  <div dir="rtl" style={{ ...stage, ['--sh-hex-w' as string]: '120px' }}>
    <HexGrid
      cells={CATS.map((label, i) => ({
        label,
        state: i === 2 ? ('landed' as const) : i === 0 || i === 8 ? ('spent' as const) : ('idle' as const),
      }))}
    />
  </div>
)
