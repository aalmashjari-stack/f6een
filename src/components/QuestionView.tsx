import type { Question } from '../game/types'
import { celebSrc } from '../game/celebs'
import { QuestionText } from './QuestionText'

/**
 * مواضيع «أمثال وألغاز» التي تُعرض صدرَ المثل وحده — «من جد وجد…» — فالمطلوب
 * إكمالُه لا الإجابة عنه. وحدها هذه تحتاج تلميحاً: بقيّة البنك أسئلةٌ تامّة
 * تنتهي بعلامة استفهام، والألغاز منها كذلك، فتدلّ على نفسها بلا معين.
 * القيمتان حصريّتان لهذه الفئة، فلا يتسرّب التلميح إلى سؤال آخر.
 */
const PROVERB_TOPICS = new Set(['إكمال مثل', 'إكمال مثل تراثي'])

/**
 * جسم السؤال — نصٌّ أو صورة. سؤال «من صاحب الصورة؟» يعرض الصورة كبيرةً وفوقها
 * السطر السائل، فالصورة هي السؤال والإجابة اسمُ صاحبها. غيرها نصٌّ يقيس نفسه.
 *
 * التلميح فوق النصّ بنفس موضع السطر السائل فوق الصورة — كلاهما يقول للمجلس
 * ما المطلوبُ حين لا يقوله السؤال بنفسه. ولا يظهر في شاشات الكشف: هناك يُقرأ
 * صدرُ المثل مع عجزه فيتّضح من نفسه.
 */
export function QuestionView({ q }: { q: Question }) {
  if (q.image) {
    return (
      <div className="q-photo-wrap">
        <div className="q-prompt">من صاحب الصورة؟</div>
        <img className="q-photo" src={celebSrc(q.image)} alt="" />
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
