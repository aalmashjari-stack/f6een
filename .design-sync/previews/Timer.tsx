import { Timer } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const row = { display: 'flex', gap: 28, alignItems: 'flex-end', flexWrap: 'wrap' as const }

/** الذهبي هو الأصل: مهلة تشاور أو مواجهة، الوقت فيها ليس خصماً. */
export const Gold = () => (
  <div dir="rtl" style={{ ...stage, ...row }}>
    <Timer remainingMs={30000} totalMs={30000} />
    <Timer remainingMs={18000} totalMs={30000} />
  </div>
)

/** المرجاني للمرحلة التي تكون فيها الساعة خصماً وحدها. */
export const Coral = () => (
  <div dir="rtl" style={{ ...stage, ...row }}>
    <Timer remainingMs={22000} totalMs={30000} coral />
  </div>
)

/** تحت خمس ثوانٍ: الرقم ينبض والحلقة تخفت — يُرى من آخر المجلس. */
export const LastSeconds = () => (
  <div dir="rtl" style={{ ...stage, ...row }}>
    <Timer remainingMs={4000} totalMs={30000} coral />
    <Timer remainingMs={2000} totalMs={60000} />
  </div>
)
