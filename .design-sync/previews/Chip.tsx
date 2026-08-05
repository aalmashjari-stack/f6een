import { Chip } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** صفّ إحصائي كما يظهر في الختام: اللون يحمل الحكم فلا تُقرأ الكلمة. */
export const TeamTally = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <Chip tone="gold" count={4}>صحيحة</Chip>
    <Chip tone="coral" count={2}>خاطئة</Chip>
  </div>
)

/** لاعباً لاعباً في الديربي. */
export const PlayerTally = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <Chip tone="gold" count={2}>صح</Chip>
    <Chip tone="coral" count={0}>غلط</Chip>
  </div>
)

/** المحايدة: عدّ بلا حكم. */
export const Neutral = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', gap: 8 }}>
    <Chip count={9}>تصنيفات</Chip>
    <Chip>لم يُختر بعد</Chip>
  </div>
)
