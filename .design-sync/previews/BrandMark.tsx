import { BrandMark } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** الأيقونة كما ترفعها المتاجر: لوحة ليل الغوص بزوايا مدوّرة. */
export const AppIcon = () => (
  // اللوحة نفسها ليل الغوص، فلا تُرى على خلفية ليلية — تُعرض على فاتح كما على شاشة الجهاز
  <div dir="rtl" style={{ ...stage, background: 'var(--sh-cream)', display: 'flex', gap: 20, alignItems: 'center' }}>
    <BrandMark size={160} />
    <BrandMark size={72} />
    <BrandMark size={40} />
  </div>
)

/** بلا لوحة: العلامة وحدها لتوضع بجانب الكلمة أو داخل رأس الصفحة. */
export const BareMark = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', gap: 24, alignItems: 'center' }}>
    <BrandMark size={110} plate={false} />
    <BrandMark size={56} plate={false} />
  </div>
)
