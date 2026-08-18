import { Eyebrow } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** سطر السياق: أين نحن في اللعبة. الفواصل نقاط وسطية فيُقرأ كسطر لا كقائمة. */
export const StageContext = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Eyebrow>الجولة الجماعية · سؤال 3 / 6 · متوسط · دور الصقور</Eyebrow>
    <Eyebrow>الديربي · جولة 2 / 4 · متوسط · لا تشاور</Eyebrow>
    <Eyebrow>الحق ما تلحق · النواخذة</Eyebrow>
  </div>
)

/** يُستعمل أيضاً كتعليمة للمشغّل فوق أدوات الحكم. */
export const Instruction = () => (
  <div dir="rtl" style={{ ...stage, ...stage }}>
    <Eyebrow>من بادر بالإجابة أولاً هو وحده الذي يُنقَّط — والآخر يبقى بلا شيء</Eyebrow>
  </div>
)
