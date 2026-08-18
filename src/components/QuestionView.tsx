import type { Question } from '../game/types'
import { celebSrc } from '../game/celebs'
import { QuestionText } from './QuestionText'

/**
 * جسم السؤال — نصٌّ أو صورة. سؤال «من صاحب الصورة؟» يعرض الصورة كبيرةً وفوقها
 * السطر السائل، فالصورة هي السؤال والإجابة اسمُ صاحبها. غيرها نصٌّ يقيس نفسه.
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
  return <QuestionText>{q.question}</QuestionText>
}
