import { AnswerReveal, Button, Eyebrow, ScoreBar, Screen } from '@sahsahli/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** شاشة كشف كاملة: الشريط فوق، السياق، الإجابة، ثم الفعل الوحيد الظاهر. */
export const RevealScreen = () => (
  <div dir="rtl" style={{ ...stage, width: 760, height: 520, display: 'flex' }}>
    <Screen>
      <ScoreBar
        teams={[{ name: 'الصقور', score: 50 }, { name: 'النواخذة', score: 30 }]}
        label="الديربي · جولة 2 / 4"
      />
      <Eyebrow>من بادر بالإجابة أولاً هو وحده الذي يُنقَّط</Eyebrow>
      <AnswerReveal question="ما أكبر شريان في جسم الإنسان؟" answer="الشريان الأورطي" />
      <Button>الجولة التالية</Button>
    </Screen>
  </div>
)

/** شاشة إعلان موسّطة رأسياً — للفواصل وشاشات الاستعداد. */
export const CenteredScreen = () => (
  <div dir="rtl" style={{ ...stage, width: 620, height: 420, display: 'flex' }}>
    <Screen center>
      <Eyebrow>الحق ما تلحق</Eyebrow>
      <Button variant="coral">ابدأ الساعة</Button>
    </Screen>
  </div>
)
