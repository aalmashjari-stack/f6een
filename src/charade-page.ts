/**
 * منطق صفحة هاتف الممثّل (`k.html`) — فئة «ولا كلمة». يفكّ ما بعد ‎#‎
 * ويعرضه؛ لا شبكة ولا جلسة، انظر `game/charades.ts`.
 *
 * والرابطُ بلا جزءٍ أو بجزءٍ لا يُفكّ — مسحٌ لرمزٍ قديم أو فتحٌ للصفحة
 * عمداً — يقول ذلك بدل أن يعرض «…» إلى الأبد.
 *
 * **والنوعُ والملصق مع الكلمة** (قرار علي ٢٠ سبتمبر ٢٠٢٦): «مسرحية» فوق
 * «على هامان يا فرعون» — الممثّل يبدأ بإشارة النوع، والملصق يذكّره بالعمل.
 * الملصقات ملفّاتُ الفئة نفسُها (`assets/pics/pic-kilma-*`) تُضمّ في هذه
 * الحزمة كما تُضمّ في حزمة اللعب — Vite يبصم الملفّ باسمٍ واحد فلا يتكرّر.
 */
import { decodeCharade } from './game/charades'

const posters = import.meta.glob('../assets/pics/pic-kilma-*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const posterUrl = (key: string): string | undefined =>
  posters[Object.keys(posters).find((p) => p.endsWith('/' + key + '.jpg')) ?? '']

const wordEl = document.getElementById('word')!
const kindEl = document.getElementById('kind')!
const posterEl = document.getElementById('poster') as HTMLImageElement
const levelEl = document.getElementById('level')!
const ruleEl = document.getElementById('rule')!

function render() {
  const got = decodeCharade(location.hash)
  if (!got) {
    wordEl.textContent = 'لا كلمة هنا'
    wordEl.classList.add('bad')
    ruleEl.textContent = 'امسح الرمز الذي على الشاشة الكبيرة من جديد.'
    kindEl.hidden = true
    posterEl.hidden = true
    levelEl.hidden = true
    return
  }
  wordEl.textContent = got.text
  wordEl.classList.remove('bad')
  kindEl.textContent = got.kind ?? ''
  kindEl.hidden = !got.kind
  const src = got.image ? posterUrl(got.image) : undefined
  posterEl.hidden = !src
  posterEl.src = src ?? ''
  levelEl.textContent = got.level
  levelEl.hidden = false
  ruleEl.textContent = 'مثّلها لفريقك بلا كلمة ولا صوت ولا تخلي أحد يشوف الشاشة'
}

render()
/* الممثّل التالي قد يمسح رمزاً جديداً والصفحةُ نفسُها مفتوحة: سفاري يبدّل
   الجزء بلا إعادة تحميل. */
addEventListener('hashchange', render)
