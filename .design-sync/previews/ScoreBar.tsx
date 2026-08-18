import { ScoreBar } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

const box = { display: 'flex', flexDirection: 'column' as const, gap: 18, minWidth: 560 }

/** الحالة الشائعة: فريق متصدّم — الإطار الذهبي والقرص الممتلئ للمتصدّر وحده. */
export const Leading = () => (
  <div dir="rtl" style={{ ...stage, ...box }}>
    <ScoreBar teams={[{ name: 'الصقور', score: 55 }, { name: 'النواخذة', score: 40 }]} />
  </div>
)

/** التساوي: لا يتصدّر فيه أحد، فلا ذهب على أي كبسولة. */
export const Tied = () => (
  <div dir="rtl" style={{ ...stage, ...box }}>
    <ScoreBar teams={[{ name: 'الصقور', score: 30 }, { name: 'النواخذة', score: 30 }]} />
  </div>
)

/** مع سطر السياق بين الكبسولتين — موضعه بينهما لا بعدهما. */
export const WithLabel = () => (
  <div dir="rtl" style={{ ...stage, ...box }}>
    <ScoreBar
      teams={[{ name: 'الصقور', score: 50 }, { name: 'النواخذة', score: 30 }]}
      label="الديربي · جولة 2 / 4"
    />
  </div>
)

/** النقاط تنزل تحت الصفر — مقصود ولا يُمنع، والإشارة تبقى قبل الرقم في RTL. */
export const NegativeScore = () => (
  <div dir="rtl" style={{ ...stage, ...box }}>
    <ScoreBar teams={[{ name: 'الصقور', score: 20 }, { name: 'النواخذة', score: -10 }]} />
  </div>
)
