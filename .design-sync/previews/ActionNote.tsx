import { ActionNote, Button } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** السطر يشرح القاعدة لا الزر: «نهائية بلا إعادة» معلومة، «اضغط للسحب» ضجيج. */
export const UnderPrimary = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
    <Button>ابدأ</Button>
    <ActionNote>السحبة نهائية — بلا إعادة</ActionNote>
  </div>
)

export const UnderReveal = () => (
  <div dir="rtl" style={{ ...stage, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
    <Button>كشف الإجابة</Button>
    <ActionNote>يُكشف تلقائياً عند انتهاء الوقت</ActionNote>
  </div>
)
