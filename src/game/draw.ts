import type { Level, Question } from './types'
import { familyOf, poolByCatLevel, poolByLevels } from './bank'

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * خوارزمية السحب — القسم ٨.
 * pool = أسئلة (التصنيف، المستوى) ناقص المستخدمة. إن نفد، نرجع لأقدم مستخدم.
 * في النسخة الحالية "الأقدم استخداماً" مبسّط: أي سؤال من الخلية (لأننا لا نحفظ ترتيب الاستخدام بعد).
 *
 * لا يمسّ `used`: الحرق مسؤولية المحرك، يعيده في حالة جديدة. لو أضاف السحبُ
 * المعرّفَ هنا لاحترق سؤالٌ لم يُعرض كلما استُدعي المحرك مرّتين على الحالة
 * نفسها — وهو ما يفعله StrictMode في التطوير للكشف عن الآثار الجانبية.
 *
 * `reserved` = معرّفات محجوزة لطابور الحق ما تلحق. الطابور يُسحب عند إنشاء الجلسة
 * ولا يُضاف إلى used (يحترق عند العرض فقط)، فبدون استثنائه هنا قد تُسحب منه ورقة
 * وتُعرض في الجولة الجماعية ثم تعود وتظهر ثانيةً في الحق ما تلحق — نفس السؤال مرتين.
 *
 * `spentFamilies` = قوالب ظهرت في هذه الجلسة (أو محجوزة في الطابور) — انظر familyOf.
 *
 * سلّم التنازل عند ضيق المخزون: القالب أولاً، ثم الحجز، ثم عدم التكرار أخيراً.
 * لأن سؤالاً من قالب مطروق يُحسّ متشابهاً، أما كسر الحجز فيعيد السؤال نفسه حرفياً.
 */
export function drawOne(
  category: string,
  level: Level,
  used: Set<string>,
  reserved: Set<string> = new Set(),
  spentFamilies: Set<string> = new Set(),
): Question {
  const cell = poolByCatLevel(category, level)
  const unused = cell.filter((q) => !used.has(q.id))
  const free = unused.filter((q) => !reserved.has(q.id))
  const best = free.filter((q) => {
    const fam = familyOf(q)
    return fam === null || !spentFamilies.has(fam)
  })
  const pool = best.length > 0 ? best : free.length > 0 ? free : unused.length > 0 ? unused : cell
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * سحب مسبق لطابور الحق ما تلحق — القرار المعماري: 40 احتياطاً عند إنشاء الجلسة
 * لتعمل المرحلة كاملة بلا إنترنت. من مخزون سهل + متوسط بلا تصنيف (القسم ٦/٨).
 *
 * لا يضيف المعرّفات إلى `used`: الطابور احتياطي، ويُستهلك منه ١٠–١٤ سؤالاً فقط.
 * الحرق يقع عند العرض الفعلي (انظر S3_JUDGE) — وإلا احترق ٤٠ سؤالاً في الجلسة
 * بدل ١٢، فينكمش أفق «٤٢ جلسة بلا تكرار» في القسم ١٢ إلى نحو ١٢ جلسة.
 *
 * الطابور نفسه بلا تكرار قوالب: أسئلته تُعرض متتابعة في ثلاثين ثانية، فتشابه
 * صيغتين فيه أوضح ما يكون على المسامع.
 */
export function drawStage3Queue(count: number, used: Set<string>): Question[] {
  const pool = poolByLevels(['سهل', 'متوسط']).filter((q) => !used.has(q.id))
  const queue: Question[] = []
  const seenFamilies = new Set<string>()
  const spare: Question[] = []
  for (const q of shuffle(pool)) {
    if (queue.length >= count) break
    const fam = familyOf(q)
    if (fam !== null && seenFamilies.has(fam)) {
      spare.push(q)
      continue
    }
    if (fam !== null) seenFamilies.add(fam)
    queue.push(q)
  }
  // إن لم يكتمل العدد (مخزون شحيح) نكمل من المُستبعَد — الاحتياطي أولى من طابور ناقص.
  return queue.concat(spare.slice(0, count - queue.length))
}
