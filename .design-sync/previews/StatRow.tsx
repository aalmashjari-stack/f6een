import { StatRow } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** جدول «من أين جاءت النقاط» — الأرقام تُجمع فتساوي المجموع، فالقارئ يتحقّق بنفسه. */
export const PointsBreakdown = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 560 }}>
    <StatRow variant="head" right="الصقور" label="المرحلة" left="النواخذة" />
    <StatRow right="+30" label="الجولة الجماعية" left="+30" />
    <StatRow right="+40" label="راس براس" left="−10" highlight="right" />
    <StatRow right="+15" label="الحق ما تلحق" left="+20" highlight="left" />
    <StatRow variant="total" right={55} label="المجموع" left={40} />
  </div>
)

/** صفّ مفرد خارج الجدول. */
export const SingleRow = () => (
  <div dir="rtl" style={{ ...stage, minWidth: 480 }}>
    <StatRow right="+20" label="سؤال الحسم" left="0" highlight="right" />
  </div>
)
