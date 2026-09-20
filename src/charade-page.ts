/**
 * منطق صفحة هاتف الممثّل (`k.html`) — فئة «ولا كلمة». يفكّ ما بعد ‎#‎
 * ويعرضه؛ لا شبكة ولا جلسة، انظر `game/charades.ts`.
 *
 * والرابطُ بلا جزءٍ أو بجزءٍ لا يُفكّ — مسحٌ لرمزٍ قديم أو فتحٌ للصفحة
 * عمداً — يقول ذلك بدل أن يعرض «…» إلى الأبد.
 */
import { decodeCharade } from './game/charades'

const wordEl = document.getElementById('word')!
const levelEl = document.getElementById('level')!
const ruleEl = document.getElementById('rule')!

function render() {
  const got = decodeCharade(location.hash)
  if (!got) {
    wordEl.textContent = 'لا كلمة هنا'
    wordEl.classList.add('bad')
    ruleEl.textContent = 'امسح الرمز الذي على الشاشة الكبيرة من جديد.'
    levelEl.hidden = true
    return
  }
  wordEl.textContent = got.text
  wordEl.classList.remove('bad')
  levelEl.textContent = got.level
  levelEl.hidden = false
  ruleEl.textContent = 'مثّلها لفريقك بلا كلمة ولا صوت ولا تخلي أحد يشوف الشاشة'
}

render()
/* الممثّل التالي قد يمسح رمزاً جديداً والصفحةُ نفسُها مفتوحة: سفاري يبدّل
   الجزء بلا إعادة تحميل. */
addEventListener('hashchange', render)
