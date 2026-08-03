import { VersusPair } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** أثناء الاختيار العشوائي — الاسمان كريميان. */
export const Rolling = () => (
  <div dir="rtl" style={{ ...stage, minWidth: 620 }}>
    <VersusPair right="سالم" left="ناصر" />
  </div>
)

/** بعد الاستقرار: ذهبيان متوهّجان، و«ضد» مرجانية بينهما. */
export const Settled = () => (
  <div dir="rtl" style={{ ...stage, minWidth: 620 }}>
    <VersusPair right="فهد" left="عبدالله" settled />
  </div>
)

/** اسمان طويلان: يلتفّان ولا يُبتران — بتر اسم لاعب أسوأ من سطرين. */
export const LongNames = () => (
  <div dir="rtl" style={{ ...stage, minWidth: 620 }}>
    <VersusPair right="عبدالرحمن" left="أمّ عبدالله" settled />
  </div>
)
