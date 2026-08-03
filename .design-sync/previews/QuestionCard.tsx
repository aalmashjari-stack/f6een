import { QuestionCard } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** سؤال قصير — الحالة الغالبة في بنك الأسئلة. */
export const Short = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 720 }}>
    <QuestionCard>ما اسم العملة القطرية؟</QuestionCard>
  </div>
)

/** أطول سؤال في البنك يجب أن يُقرأ من آخر المجلس — هذا شرط تشغيل. */
export const LongQuestion = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 720 }}>
    <QuestionCard>
      من هو أول من وضع علم الجبر بشكله المعروف اليوم، والذي اشتُقّ اسم الخوارزمية من اسمه؟
    </QuestionCard>
  </div>
)
