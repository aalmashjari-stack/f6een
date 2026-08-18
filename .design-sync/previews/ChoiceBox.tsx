import { ChoiceBox } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const pair = { display: 'flex', gap: 12, width: 420 }

/** الخياران ظاهران معاً: التدوير يُخفي «غلط» خلف ضغطتين. */
export const BothIdle = () => (
  <div dir="rtl" style={{ ...stage, ...pair }}>
    <ChoiceBox label="إجابة صحيحة" points="+20" tone="gold" />
    <ChoiceBox label="إجابة خاطئة" points="−10" tone="coral" />
  </div>
)

/** المختار يمتلئ والمقابل يخفت — الفرق لون كامل لا درجة أفتح. */
export const CorrectSelected = () => (
  <div dir="rtl" style={{ ...stage, ...pair }}>
    <ChoiceBox label="إجابة صحيحة" points="+20" tone="gold" selected />
    <ChoiceBox label="إجابة خاطئة" points="−10" tone="coral" dimmed />
  </div>
)

export const WrongSelected = () => (
  <div dir="rtl" style={{ ...stage, ...pair }}>
    <ChoiceBox label="إجابة صحيحة" points="+20" tone="gold" dimmed />
    <ChoiceBox label="إجابة خاطئة" points="−10" tone="coral" selected />
  </div>
)
