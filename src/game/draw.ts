import type { Level, Question } from './types'
import { familyOf, poolByCatLevel, poolByLevels, poolShippedByLevels } from './bank'

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const LEVELS: Level[] = ['سهل', 'متوسط', 'صعب']

/**
 * يختار من مجموعةٍ بسلّم التنازل عند ضيق المخزون: القالب أوّلاً، ثمّ الحجز،
 * ثمّ عدم التكرار أخيراً. لأنّ سؤالاً من قالب مطروق يُحسّ متشابهاً، أمّا كسر
 * الحجز فيعيد السؤال نفسه حرفياً.
 *
 * ويعود بـ`null` إن كانت المجموعة فارغة أصلاً — والمنادي هو من يقرّر البديل.
 */
function pickFrom(
  pool: Question[],
  used: Set<string>,
  reserved: Set<string>,
  spentFamilies: Set<string>,
): Question | null {
  if (pool.length === 0) return null
  const unused = pool.filter((q) => !used.has(q.id))
  const free = unused.filter((q) => !reserved.has(q.id))
  const best = free.filter((q) => {
    const fam = familyOf(q)
    return fam === null || !spentFamilies.has(fam)
  })
  const from = best.length > 0 ? best : free.length > 0 ? free : unused.length > 0 ? unused : pool
  return from[Math.floor(Math.random() * from.length)]
}

/**
 * آخر ملاذٍ حين تفرغ الخليّة نفسها: المستوى بلا تصنيف، ثمّ البنك كلّه.
 *
 * الخليّة تفرغ في اللعب فعلاً لا في النظريّة: `playableCategories` تحرس
 * الإعداد، لكنّ بلاغاً يصل بعد بدء الجلسة — من هذا الجهاز أو من غيره —
 * يحجز آخر سؤالٍ في خليّةٍ ضيّقة (فئات الصور فيها سؤالٌ واحد في المستوى)،
 * فكان `drawOne` يعود بلا سؤال ويسقط المحرّك على `q.id` أمام المجلس.
 * سؤالٌ من فئةٍ أخرى بالمستوى نفسه خيرٌ من شاشةٍ بيضاء.
 */
function fallback(
  level: Level,
  used: Set<string>,
  reserved: Set<string>,
  spentFamilies: Set<string>,
): Question {
  const q =
    pickFrom(poolByLevels([level]), used, reserved, spentFamilies) ??
    pickFrom(poolByLevels(LEVELS), used, reserved, spentFamilies)
  if (!q) throw new Error('بنك الأسئلة فارغ')
  return q
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
 * ولا يعود بلا سؤال أبداً: خليّةٌ فارغة تسقط إلى المستوى ثمّ إلى البنك (انظر `fallback`).
 */
export function drawOne(
  category: string,
  level: Level,
  used: Set<string>,
  reserved: Set<string> = new Set(),
  spentFamilies: Set<string> = new Set(),
): Question {
  return (
    pickFrom(poolByCatLevel(category, level), used, reserved, spentFamilies) ??
    fallback(level, used, reserved, spentFamilies)
  )
}

/**
 * سحبٌ بمستوىً واحد بلا تصنيف، **من البنك المشحون وحده** — الديربي
 * (SPEC ٥، قرار علي ٤ سبتمبر ٢٠٢٦).
 *
 * أخفُّ على البنك من السحب بالتصنيف لا أثقل: المخزون كلُّ أسئلة المستوى لا
 * خليّةٌ واحدة منه، فلا يجفّ أضعفُ تصنيفٍ ويسحب الجلسة معه.
 *
 * والمضافُ من اللوحة (`ADM####`) خارجَه: الديربي نجمةُ اللعبة وأسئلتُه
 * مُراجَعة، والمضافُ يدخل اللعبة من باب لوح الجولة الجماعية وحده.
 * أمّا التعديلُ فيبقى مركَّباً — سؤالُ بنكٍ صُحّح يبقى سؤالَ بنك.
 *
 * وسلّم التنازل نفسه الذي في `drawOne`، وآخر الملاذ نفسه إن حُجز المستوى كلّه.
 */
export function drawByLevel(
  level: Level,
  used: Set<string>,
  reserved: Set<string> = new Set(),
  spentFamilies: Set<string> = new Set(),
): Question {
  return (
    pickFrom(poolShippedByLevels([level]), used, reserved, spentFamilies) ??
    fallback(level, used, reserved, spentFamilies)
  )
}

/**
 * سحب مسبق لطابور الحق ما تلحق — القرار المعماري: 40 احتياطاً عند إنشاء الجلسة
 * لتعمل المرحلة كاملة بلا إنترنت. من مخزون سهل + متوسط بلا تصنيف (القسم ٦/٨).
 *
 * **ومن البنك المشحون وحده** (قرار علي ٤ سبتمبر ٢٠٢٦، كالديربي): المضافُ من
 * اللوحة يدخل اللعبة من باب لوح الجولة الجماعية — وهو الباب الذي يختاره
 * الفريقان بأنفسهما، فيعرفان من أيّ فئةٍ يأتي السؤال.
 *
 * لا يضيف المعرّفات إلى `used`: الطابور احتياطي، ويُستهلك منه ١٠–١٤ سؤالاً فقط.
 * الحرق يقع عند العرض الفعلي (انظر S3_JUDGE) — وإلا احترق ٤٠ سؤالاً في الجلسة
 * بدل ١٢، فينكمش أفق «٤٢ جلسة بلا تكرار» في القسم ١٢ إلى نحو ١٢ جلسة.
 *
 * الطابور نفسه بلا تكرار قوالب: أسئلته تُعرض متتابعة في ثلاثين ثانية، فتشابه
 * صيغتين فيه أوضح ما يكون على المسامع.
 *
 * `avoidFamilies` = قوالب لا تدخل الطابور (ما طُرق في الجلسة) — يلزم حين
 * يُمدَّد الطابور في منتصف اللعب (انظر `ensureS3Queue` في المحرّك)، فطابورُ
 * الإنشاء يُسحب قبل أيّ سؤال ولا قوالب مطروقة بعد.
 */
const STAGE3_MAX_Q_LEN = 80

export function drawStage3Queue(
  count: number,
  used: Set<string>,
  avoidFamilies: Set<string> = new Set(),
): Question[] {
  const pool = poolShippedByLevels(['سهل', 'متوسط']).filter(
    (q) => !used.has(q.id) && q.question.length <= STAGE3_MAX_Q_LEN,
  )
  const queue: Question[] = []
  const seenFamilies = new Set<string>(avoidFamilies)
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
