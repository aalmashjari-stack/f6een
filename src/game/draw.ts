import type { Level, Question } from './types'
import { BOARD_LEVELS } from './levels'
import { familiesOf, hiddenCategories, poolByCatLevel, poolByLevels, poolDerby } from './bank'
import { isCharadesCategory } from './charades'

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* صفوف اللوح من موضعها الواحد — انظر `levels.ts`. */
const LEVELS = BOARD_LEVELS

/**
 * قيود السحب — صنفان لا صنف واحد (٧ سبتمبر ٢٠٢٦):
 *
 * - **صلبة لا تُكسر:** ما عُرض في هذه الجلسة، وما حُجز لطابور الحق ما تلحق،
 *   وقوالب الجلسة وموضوعاتها. هذه هي الضمانتان اللتان يحرسهما الاختبار —
 *   «لا سؤال مرّتين ولا قالبان من عائلة» — وكانتا تسقطان عند ضيق المخزون:
 *   سلّمُ التنازل القديم كان ينزل من القالب إلى الحجز إلى التكرار، فيعيد
 *   عند الجلسة الحادية والثلاثين سؤالاً سُمع في الليلة نفسها.
 * - **ليّنة تُعاد:** ذاكرة الحساب عبر الجلسات. حين تفرغ الخليّة منها يُعاد
 *   **الأقدم استخداماً** (SPEC ٨) لا أيُّ سؤال — والترتيب هو ترتيب
 *   المجموعة نفسها: أوّل ما فيها أقدمُ ما سُمع، لأنّ الخادم يرتّب بـ`used_at`
 *   والحرقُ يضيف في الذيل.
 */
export interface DrawGuards {
  /** ذاكرة الحساب بترتيب الاستعمال، وفيها أسئلة هذه الجلسة أيضاً. */
  used: Set<string>
  /** ما لا يُسحب أبداً في هذه الجلسة: المعروض فيها والمحجوز لطابورها. */
  excluded: Set<string>
  /** قوالب وموضوعات ظهرت في الجلسة أو تنتظر في الطابور. */
  spentFamilies: Set<string>
}

const EMPTY: Set<string> = new Set()

const eligible = (pool: Question[], g: DrawGuards): Question[] =>
  pool.filter(
    (q) => !g.excluded.has(q.id) && familiesOf(q).every((fam) => !g.spentFamilies.has(fam)),
  )

/**
 * يختار من مجموعة: جديدٌ عشوائيّ إن وُجد، وإلّا أقدمُ ما استُعمل منها.
 * ويعود بـ`null` إن لم يبقَ فيها ما يجوز عرضه — والمنادي هو من يقرّر البديل.
 */
function pickFrom(pool: Question[], g: DrawGuards): Question | null {
  const ok = eligible(pool, g)
  if (ok.length === 0) return null
  const fresh = ok.filter((q) => !g.used.has(q.id))
  if (fresh.length > 0) return fresh[Math.floor(Math.random() * fresh.length)]
  return oldestUsed(ok, g.used)
}

/** أقدم سؤالٍ في `pool` بحسب ترتيب الذاكرة — أوّل معرّفٍ فيها يقع في المجموعة. */
function oldestUsed(pool: Question[], used: Set<string>): Question | null {
  const byId = new Map(pool.map((q) => [q.id, q]))
  for (const id of used) {
    const q = byId.get(id)
    if (q) return q
  }
  return null
}

/**
 * آخر ملاذٍ حين تفرغ الخليّة نفسها: المستوى بلا تصنيف، ثمّ البنك كلّه.
 *
 * الخليّة تفرغ في اللعب فعلاً لا في النظريّة: `playableCategories` تحرس
 * الإعداد، لكنّ بلاغاً يصل بعد بدء الجلسة — من هذا الجهاز أو من غيره —
 * يحجز آخر سؤالٍ في خليّةٍ ضيّقة (فئات الصور فيها سؤالٌ واحد في المستوى)،
 * فكان `drawOne` يعود بلا سؤال ويسقط المحرّك على `q.id` أمام المجلس.
 * سؤالٌ من فئةٍ أخرى بالمستوى نفسه خيرٌ من شاشةٍ بيضاء.
 *
 * والقيود الصلبة تبقى صلبةً هنا أيضاً: سؤالٌ من فئةٍ أخرى أهون من سؤالٍ
 * سُمع قبل دقائق.
 */
/**
 * سلّم التنازل حين تفرغ الخليّة — **والتصنيف يسبق المستوى فيه**.
 *
 * كان ينزل من الخليّة إلى المستوى مباشرةً، فيأتي بسؤالٍ من تصنيفٍ آخر:
 * ظهر سؤالُ تمثيلٍ في خليّة «أحياء وفلك» (بلاغ علي ٩ سبتمبر ٢٠٢٦). واللاعب
 * اختار التصنيف ويرى اسمه فوق الخليّة، فالخروجُ منه يُقرأ عطباً لا تنازلاً.
 * أمّا الخروج من المستوى — سؤالٌ متوسّط في خانة الصعب — فلا يراه أحد.
 *
 * فالترتيب: الخليّة، ثمّ **التصنيف نفسه بأيّ مستوى**، ثمّ المستوى نفسه بأيّ
 * تصنيف، ثمّ البنك كلُّه. ولا يعود بلا سؤال أبداً.
 */
function fallback(category: string | null, level: Level, g: DrawGuards): Question {
  const inCategory = category
    ? pickFrom(
        LEVELS.flatMap((l) => poolByCatLevel(category, l)),
        g,
      )
    : null
  /* الدرجتان الأخيرتان تعبران التصنيفات، فلا تجلبان ما لا يُجاب عنه نطقاً
     («ولا كلمة» تمثيلٌ بـQR — SPEC §٤) ولا فئةً استُبعدت من اللوح. */
  const sayable = (q: Question) => !isCharadesCategory(q.category) && !hiddenCategories().has(q.category)
  const q =
    inCategory ??
    pickFrom(poolByLevels([level]).filter(sayable), g) ??
    pickFrom(poolByLevels(LEVELS).filter(sayable), g)
  if (!q) throw new Error('بنك الأسئلة فارغ')
  return q
}

const guards = (used: Set<string>, excluded: Set<string>, spentFamilies: Set<string>): DrawGuards => ({
  used,
  excluded,
  spentFamilies,
})

/**
 * خوارزمية السحب — القسم ٨.
 * pool = أسئلة (التصنيف، المستوى) ناقص المستخدمة. إن نفد، نرجع لأقدم مستخدم.
 *
 * لا يمسّ `used`: الحرق مسؤولية المحرك، يعيده في حالة جديدة. لو أضاف السحبُ
 * المعرّفَ هنا لاحترق سؤالٌ لم يُعرض كلما استُدعي المحرك مرّتين على الحالة
 * نفسها — وهو ما يفعله StrictMode في التطوير للكشف عن الآثار الجانبية.
 *
 * `excluded` = ما لا يُسحب في هذه الجلسة مهما ضاق المخزون: ما عُرض فيها،
 * وما حُجز لطابور الحق ما تلحق. الطابور يُسحب عند إنشاء الجلسة ولا يُضاف إلى
 * used (يحترق عند العرض فقط)، فبدون استثنائه هنا تُسحب منه ورقة وتُعرض في
 * الجولة الجماعية ثم تعود وتظهر ثانيةً في الحق ما تلحق — نفس السؤال مرتين.
 *
 * `spentFamilies` = قوالب ظهرت في هذه الجلسة (أو محجوزة في الطابور) — انظر familiesOf.
 *
 * ولا يعود بلا سؤال أبداً: خليّةٌ فارغة تسقط إلى المستوى ثمّ إلى البنك (انظر `fallback`).
 */
export function drawOne(
  category: string,
  level: Level,
  used: Set<string>,
  excluded: Set<string> = EMPTY,
  spentFamilies: Set<string> = EMPTY,
): Question {
  const g = guards(used, excluded, spentFamilies)
  return pickFrom(poolByCatLevel(category, level), g) ?? fallback(category, level, g)
}

/**
 * سحب الديربي — سهل ومتوسط من فئات الديربي وحدها، بلا اختيار تصنيف
 * (SPEC ٥، قرار علي ١٥ سبتمبر ٢٠٢٦؛ كان «متوسط من المشحون» منذ ٤ سبتمبر).
 *
 * الفئات من القاعدة (`derbyCategories`)، والمخزون كلُّه دفعةً واحدة لا
 * خليّةً — فلا يجفّ أضعفُ تصنيفٍ ويسحب الجلسة معه. والقيود نفسها التي في
 * `drawOne`؛ وسؤالُ الحسم يُسحب منه أيضاً (قرار علي ٢٥ سبتمبر ٢٠٢٦). وآخر الملاذ إن نفد المخزون: متوسط بأيّ فئة ثمّ البنك كلّه —
 * سؤالٌ من خارج القائمة أهون من شاشةٍ بيضاء.
 */
export function drawDerby(
  used: Set<string>,
  excluded: Set<string> = EMPTY,
  spentFamilies: Set<string> = EMPTY,
): Question {
  const g = guards(used, excluded, spentFamilies)
  return pickFrom(poolDerby(), g) ?? fallback(null, 'متوسط', g)
}

/**
 * سحب مسبق لطابور الحق ما تلحق — القرار المعماري: 40 احتياطاً عند إنشاء الجلسة
 * لتعمل المرحلة كاملة بلا إنترنت. من مخزون سهل + متوسط بلا تصنيف (القسم ٦/٨).
 *
 * **ومن البنك المشحون وحده** (قرار علي ٤ سبتمبر ٢٠٢٦، كالديربي): المضافُ من
 * اللوحة يدخل اللعبة من باب لوح الجولة الجماعية — وهو الباب الذي يختاره
 * الفريقان بأنفسهما، فيعرفان من أيّ فئةٍ يأتي السؤال.
 *
 * لا يضيف المعرّفات إلى `used`: الطابور احتياطي، ويُستهلك منه ١٥–٢١ سؤالاً فقط.
 * الحرق يقع عند العرض الفعلي (انظر S3_JUDGE) — وإلا احترق ٦٠ سؤالاً في الجلسة
 * بدل ١٨، فينكمش أفق «٤٢ جلسة بلا تكرار» في القسم ١٢ إلى نحو ١٢ جلسة.
 *
 * الطابور نفسه بلا تكرار قوالب: أسئلته تُعرض متتابعة في خمسٍ وأربعين ثانية، فتشابه
 * صيغتين فيه أوضح ما يكون على المسامع.
 *
 * `avoidFamilies` = قوالب لا تدخل الطابور (ما طُرق في الجلسة) — يلزم حين
 * يُمدَّد الطابور في منتصف اللعب (انظر `ensureS3Queue` في المحرّك)، فطابورُ
 * الإنشاء يُسحب قبل أيّ سؤال ولا قوالب مطروقة بعد.
 *
 * `excluded` = ما لا يدخل الطابور أبداً: ما عُرض في الجلسة وما في الطابور
 * أصلاً. أمّا `used` فذاكرةٌ ليّنة: حين لا يبقى جديد يُكمَل من **أقدم** ما
 * سُمع — كان الطابور يُرجع صفراً لحسابٍ استنفد المخزون (نحو الجلسة الثالثة
 * والثلاثين)، فيقف الفريقان على «نفد الطابور» والساعةُ تعدّ على لا شيء.
 * والقوالب صلبةٌ إلى النهاية: طابورٌ أقصر خيرٌ من قالبين متلاحقين.
 */
const STAGE3_MAX_Q_LEN = 80

export function drawStage3Queue(
  count: number,
  used: Set<string>,
  avoidFamilies: Set<string> = EMPTY,
  excluded: Set<string> = EMPTY,
): Question[] {
  /* من فئات الديربي نفسها (قرار علي ١٥ سبتمبر ٢٠٢٦؛ كان من المشحون كلّه
     بلا فئة) — وبلا قائمة يعود إلى سهل ومتوسط المشحون. */
  const pool = poolDerby(['سهل', 'متوسط']).filter(
    (q) => !excluded.has(q.id) && q.question.length <= STAGE3_MAX_Q_LEN,
  )
  const fresh = pool.filter((q) => !used.has(q.id))
  const queue: Question[] = []
  const seenFamilies = new Set<string>(avoidFamilies)
  const take = (q: Question): boolean => {
    if (queue.length >= count) return false
    const fams = familiesOf(q)
    if (fams.some((fam) => seenFamilies.has(fam))) return true
    for (const fam of fams) seenFamilies.add(fam)
    queue.push(q)
    return true
  }
  for (const q of shuffle(fresh)) if (!take(q)) break
  if (queue.length < count) {
    /* الجديد لم يكفِ: يُكمَل بالأقدم فالأقدم من الذاكرة، بترتيبها لا عشوائياً. */
    const byId = new Map(pool.filter((q) => used.has(q.id)).map((q) => [q.id, q]))
    for (const id of used) {
      const q = byId.get(id)
      if (q && !take(q)) break
    }
  }
  return queue
}
