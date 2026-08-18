import { IntervalCard } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** أهم سطر في الشاشة هو القاعدة: الفريق الذي لم يستوعب أنها تغيّرت يخالفها. */
export const NextStage = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 760 }}>
    <IntervalCard
      eyebrow="المرحلة القادمة"
      title="الديربي"
      rule="هذه مواجهة فردية: لاعب من كل فريق وجهاً لوجه. لا يجوز لأي فرد من الفريقين أن يتدخّل — لا كلام ولا همس ولا إشارة. ومن بادر بالإجابة أولاً هو صاحبها وحده."
    />
  </div>
)

/** قاعدة مختصرة: ما لا يُحفظ في سطرين لا يُحفظ في خمسة. */
export const ShortRule = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 760 }}>
    <IntervalCard
      eyebrow="المرحلة القادمة"
      title="الحق ما تلحق"
      rule="30 ثانية دون توقف لكل فريق، و+5 نقاط لكل إجابة صحيحة."
    />
  </div>
)

/** المرجاني للحظة المعلّقة بسؤال واحد — وهي اللحظة الوحيدة التي تكون فيها كذلك. */
export const Tiebreak = () => (
  <div dir="rtl" style={{ ...stage, maxWidth: 760 }}>
    <IntervalCard
      tone="coral"
      eyebrow="انتهت المراحل الثلاث والنتيجة"
      title="تعادل"
      rule="سؤال صعب واحد يحسم اللعبة. أول فريق يصيبه يفوز — وإن لم يصبه أحد، يأتي سؤال آخر حتى يُحسم."
    />
  </div>
)
