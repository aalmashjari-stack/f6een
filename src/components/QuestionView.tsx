import type { Question } from '../game/types'
import { celebSrc } from '../game/celebs'
import { QuestionText } from './QuestionText'
import { ZoomablePhoto } from './ZoomablePhoto'

/**
 * مواضيع «أمثال وألغاز» التي تُعرض صدرَ المثل وحده — «من جد وجد…» — فالمطلوب
 * إكمالُه لا الإجابة عنه. وحدها هذه تحتاج تلميحاً: بقيّة البنك أسئلةٌ تامّة
 * تنتهي بعلامة استفهام، والألغاز منها كذلك، فتدلّ على نفسها بلا معين.
 * القيمتان حصريّتان لهذه الفئة، فلا يتسرّب التلميح إلى سؤال آخر.
 */
const PROVERB_TOPICS = new Set(['إكمال مثل', 'إكمال مثل تراثي'])

/**
 * سؤالُ الصورة حين لا يحمل نصّاً — ملفّ رفعٍ قديم أو صفٌّ ناقص. لا يقع في
 * البنك (كلُّ أسئلة صوره نصُّها هذا حرفياً)، لكنّ الطبقة تأتي من القاعدة
 * ولا يحرسها `bank.test.ts`.
 */
const PHOTO_PROMPT = 'من صاحب الصورة؟'

/**
 * جسم السؤال — نصٌّ أو صورة. سؤال الصورة يعرضها كبيرةً وفوقها سطرُه السائل،
 * فالصورة هي السؤال.
 *
 * **والسطرُ نصُّ السؤال لا ثابتاً في الشيفرة.** كان مكتوباً «من صاحب الصورة؟»
 * ويُهمل `q.question` كلَّه — فحبس الصورَ في سؤالٍ واحد: لا «من أي مسلسل هذا
 * المشهد؟» ولا «شنو الجملة المشهورة من هذا المقطع؟». والتبديل بلا أثرٍ على ما
 * في البنك: أسئلةُ صوره الـ223 نصُّها هذا حرفياً، ويحرسه `celebs.test.ts`.
 *
 * التلميح فوق النصّ بنفس موضع السطر السائل فوق الصورة — كلاهما يقول للمجلس
 * ما المطلوبُ حين لا يقوله السؤال بنفسه. ولا يظهر في شاشات الكشف: هناك يُقرأ
 * صدرُ المثل مع عجزه فيتّضح من نفسه.
 */
export function QuestionView({ q }: { q: Question }) {
  if (q.image) {
    return (
      <div className="q-photo-wrap">
        <div className="q-prompt">{q.question.trim() || PHOTO_PROMPT}</div>
        <ZoomablePhoto className="q-photo" src={celebSrc(q.image)} />
      </div>
    )
  }
  return (
    <>
      {PROVERB_TOPICS.has(q.topic) && <div className="q-hint">أكمل المثل</div>}
      <QuestionText>{q.question}</QuestionText>
    </>
  )
}
