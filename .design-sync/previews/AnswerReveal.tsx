import { AnswerReveal } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** الكشف كما يقع في اللعبة: السؤال ينكمش ويبهت فوقها ولا يختفي. */
export const WithQuestion = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 720 }}>
    <AnswerReveal question="ما أكبر شريان في جسم الإنسان؟" answer="الشريان الأورطي" />
  </div>
)

/** الإجابة وحدها — حين يكون السؤال معروضاً في عنصر آخر فوقها. */
export const AnswerOnly = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 720 }}>
    <AnswerReveal answer="الريال القطري" />
  </div>
)

/** إجابة طويلة: النص يلتفّ ويبقى ذهبياً وأكبر عنصر في البطاقة. */
export const LongAnswer = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 720 }}>
    <AnswerReveal question="من أول امرأة صعدت إلى الفضاء؟" answer="فالنتينا تيريشكوفا" />
  </div>
)
