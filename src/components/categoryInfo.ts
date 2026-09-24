/**
 * نبذة كلّ فئة وسؤالها المثال — تظهر من علامة (i) على بطاقتها في الإعداد
 * (طلب علي ٢٤ سبتمبر ٢٠٢٦).
 *
 * تُقرأ من `categories` مع الصورة والتصنيف (`extra_categories`)، وتُحرَّر من
 * لسان «الفئات» في اللوحة. **والسؤال المثال مكتوبٌ لها وحدها لا مسحوبٌ من
 * البنك** (قراره): ما يُعرض قبل اللعب لا يُلعب، فلا يُحرق سؤالاً على المجلس.
 *
 * والفئة بلا نبذة لا علامة عليها — لا لوحٌ فارغ يُفتح.
 */
export interface CategoryInfo {
  brief: string
  /** السؤال المثال. في فئات الصور وصفٌ لشكل السؤال لا سؤالٌ يُجاب. */
  question: string | null
  /** `null` في فئات الصور: لا جواب يُكشف لسؤالٍ بلا صورته. */
  answer: string | null
}

let info: Record<string, CategoryInfo> = {}

export function setCategoryInfo(map: Record<string, CategoryInfo>) {
  info = map
}

export function categoryInfo(cat: string): CategoryInfo | undefined {
  return info[cat]
}
