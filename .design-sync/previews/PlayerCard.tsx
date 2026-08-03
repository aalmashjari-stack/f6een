import { ChoiceBox, PlayerCard } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const board = { display: 'flex', gap: 16, minWidth: 640 }

/** شاشة تنقيط المواجهة كما تُعرض فعلاً: بطاقتان متقابلتان. */
export const JudgingBoard = () => (
  <div dir="rtl" style={{ ...stage, ...board }}>
    <PlayerCard team="الصقور" name="فهد" mark="gold">
      <ChoiceBox label="إجابة صحيحة" points="+20" tone="gold" selected />
      <ChoiceBox label="إجابة خاطئة" points="−10" tone="coral" dimmed />
    </PlayerCard>
    <PlayerCard team="النواخذة" name="ناصر">
      <ChoiceBox label="إجابة صحيحة" points="+20" tone="gold" />
      <ChoiceBox label="إجابة خاطئة" points="−10" tone="coral" />
    </PlayerCard>
  </div>
)

/** لاعب أخطأ: الإطار مرجاني — الحكم يُقرأ من آخر المجلس بلمحة. */
export const MarkedWrong = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', gap: 16, minWidth: 380 }}>
    <PlayerCard team="النواخذة" name="عبدالله" mark="coral">
      <ChoiceBox label="إجابة صحيحة" points="+20" tone="gold" dimmed />
      <ChoiceBox label="إجابة خاطئة" points="−10" tone="coral" selected />
    </PlayerCard>
  </div>
)

/** بلا حكم بعد — الحالة الابتدائية، والصمت لا يكلّف شيئاً. */
export const Silent = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', gap: 16, minWidth: 380 }}>
    <PlayerCard team="الصقور" name="سالم" />
  </div>
)
