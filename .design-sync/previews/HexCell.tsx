import { HexCell } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const row = { display: 'flex', gap: 10, alignItems: 'center' }

/** الحالات الأربع جنباً إلى جنب — الفرق بينها لون كامل لا درجة أفتح بقليل. */
export const AllStates = () => (
  <div dir="rtl" style={{ ...stage, ...row, ['--sh-hex-w' as string]: '150px' }}>
    <HexCell label="جغرافيا ومعالم" />
    <HexCell label="طب وصحة" state="active" />
    <HexCell label="أدب وفنون" state="landed" />
    <HexCell label="دين وسيرة" state="spent" />
  </div>
)

/** المستهلَك يبقى ظاهراً باهتاً لا يختفي — الإخفاء يفتح باب الاتهام بالتلاعب. */
export const Spent = () => (
  <div dir="rtl" style={{ ...stage, ...row, ['--sh-hex-w' as string]: '170px' }}>
    <HexCell label="تاريخ وحضارات" state="spent" />
    <HexCell label="رياضة وأرقام" />
  </div>
)
