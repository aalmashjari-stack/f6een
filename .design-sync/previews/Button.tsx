import { Button } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const wrap = { display: 'flex', flexDirection: 'column' as const, gap: 14, maxWidth: 520 }

/** الفعل الوحيد الظاهر في الشاشة — نصّه يسمّي الخطوة التالية لا الحالية. */
export const Primary = () => (
  <div dir="rtl" style={{ ...stage, ...wrap }}>
    <Button>ابدأ اللعبة</Button>
    <Button>انتهى التشاور — إجابة الصقور</Button>
  </div>
)

/** مرجاني: للمرحلة التي تكون فيها الساعة خصماً وحدها. */
export const Coral = () => (
  <div dir="rtl" style={{ ...stage, ...wrap }}>
    <Button variant="coral">ابدأ الساعة</Button>
  </div>
)

/** شبح: فعل ثانوي بجانب فعل أساسي — لا زر أساسي ثانٍ. */
export const Ghost = () => (
  <div dir="rtl" style={{ ...stage, ...wrap }}>
    <Button variant="ghost">قرعة البدء</Button>
    <Button>ابدأ اللعبة</Button>
  </div>
)

/** تابع: خيار ثالث بحجم النص لا بحجم الزر. */
export const Sub = () => (
  <div dir="rtl" style={{ ...stage, ...wrap }}>
    <Button variant="sub">لا أحد أصاب</Button>
  </div>
)

/** المعطّل: قبل اكتمال شرط الانتقال — القرعة هنا. */
export const Disabled = () => (
  <div dir="rtl" style={{ ...stage, ...wrap }}>
    <Button disabled>ابدأ اللعبة</Button>
  </div>
)
