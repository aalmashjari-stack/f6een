/**
 * فئة «إيموجي» — سؤالُها رموزٌ تعبيريّة يليها ذيلٌ يحدّد المطلوب:
 * «🦁 👑 — ما الفيلم؟» (قرار علي ١٥ سبتمبر ٢٠٢٦).
 *
 * الرموز في **أوّل** السؤال عمداً: عائلةُ المحرّك أوّلُ أربع كلمات، فلو
 * تقدّم الذيل لصارت الفئة كلُّها عائلةً واحدة «ما الفيلم؟» ولا يُسحب منها
 * غيرُ سؤالٍ في الجلسة. وهذا الملفّ يعرف الشكل ليُكبِّر الرموز على الشاشة
 * («كبّر الرموز» — علي): الرمز بحجم الحرف يُقرأ لكنّه لا يبدو لغزاً.
 *
 * والاسم مفتاحٌ ثابت كأسماء الفئات كلّها — مكتوبٌ في كلّ سؤالٍ من أسئلتها.
 */
export const EMOJI_CATEGORY = 'إيموجي'

export function isEmojiCategory(category: string): boolean {
  return category === EMOJI_CATEGORY
}

/** الفاصل بين الرموز والذيل كما تُكتب الدفعات: شرطة طويلة بين مسافتين. */
const SEPARATOR = ' — '

/**
 * يفصل الرموز عن الذيل. الشرط أن يخلو الصدر من الحروف — فسؤالٌ كُتب بلا
 * رموز أو بلا فاصل يعود كما هو ولا يُكبَّر منه شيء.
 */
export function splitEmojiQuestion(text: string): { lead: string; tail: string } {
  const i = text.indexOf(SEPARATOR)
  if (i < 0) return { lead: '', tail: text }
  const lead = text.slice(0, i).trim()
  if (!lead || /\p{L}/u.test(lead)) return { lead: '', tail: text }
  return { lead, tail: text.slice(i + SEPARATOR.length).trim() }
}
