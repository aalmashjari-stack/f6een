import raw from '../../data/questions-bank-v5.json'
import extraRaw from '../../data/questions-extra.json'
import type { Level, Question } from './types'

interface Bank {
  categories: string[]
  total: number
  levels: Record<Level, number>
  questions: Question[]
}

const bank = raw as Bank
// بنكٌ مكمّل منفصل — بنك v5 معتمد للقراءة فقط، فالفئات الجديدة (مشاهير، صور…)
// تُضاف هنا وتُدمج. ترتيب الفئات: القديمة أولاً ثم الجديدة.
const extra = extraRaw as { categories: string[]; questions: Question[] }

/**
 * شخصيات سياسية مستبعدة من فئة «مشاهير» بقرار علي في ٢٠ أغسطس ٢٠٢٦.
 * يبقى الاستبعاد هنا، لا في بنك v5 المحمي ولا في ملف الصور، حتى لا تعيدها
 * أدوات توليد بنك المشاهير إلى اللعب في تحديث لاحق.
 */
export const EXCLUDED_POLITICAL_CELEBRITY_IDS = new Set([
  'X001', 'X002', 'X003', 'X004', 'X005', 'X006', 'X007', 'X008', 'X009', 'X010',
  'X011', 'X012', 'X013', 'X014', 'X015', 'X016', 'X017', 'X018', 'X019', 'X020',
  'X021', 'X022', 'X023', 'X024', 'X025', 'X026', 'X027', 'X028', 'X029', 'X030',
  'X031', 'X032', 'X033', 'X034', 'X035', 'X036', 'X037', 'X038', 'X039', 'X040',
  'X041', 'X042', 'X043', 'X047', 'X048', 'X049', 'X050',
  // سياسيون وردوا داخل أقسام الأعمال والاقتصاد والعلوم في المصدر.
  'X081', 'X098', 'X100', 'X102', 'X108', 'X126',
])

/** أسماء شديدة الغموض على جمهور اللعبة العربي والخليجي، فلا تصلح لسؤال صورة ممتع. */
export const EXCLUDED_OBSCURE_CELEBRITY_IDS = new Set([
  'X060', 'X064', 'X065', 'X066', 'X067', 'X068', 'X069', 'X070', 'X072',
  'X073', 'X074', 'X075', 'X079', 'X080', 'X083', 'X086', 'X087', 'X088',
  'X091', 'X092', 'X093', 'X099', 'X101', 'X103', 'X105', 'X106', 'X107',
  'X109', 'X110', 'X111', 'X112', 'X113', 'X117', 'X118', 'X119', 'X121',
  'X122', 'X127', 'X128', 'X130', 'X131', 'X132', 'X135', 'X136', 'X138',
  'X146',
])

export const CATEGORIES: string[] = [...bank.categories, ...extra.categories]
export const ALL_QUESTIONS: Question[] = [
  ...bank.questions,
  ...extra.questions.filter(
    (q) =>
      !EXCLUDED_POLITICAL_CELEBRITY_IDS.has(q.id) &&
      !EXCLUDED_OBSCURE_CELEBRITY_IDS.has(q.id),
  ),
]

/** فهرسة: تصنيف × مستوى ← أسئلة. جوهر السحب في القسم ٨. */
const byCatLevel = new Map<string, Question[]>()
/** فهرسة بالمستوى فقط — لسحب الحق ما تلحق (بلا تصنيف). */
const byLevel = new Map<Level, Question[]>()

const key = (category: string, level: Level) => `${category}|${level}`

for (const q of ALL_QUESTIONS) {
  const k = key(q.category, q.level)
  if (!byCatLevel.has(k)) byCatLevel.set(k, [])
  byCatLevel.get(k)!.push(q)
  if (!byLevel.has(q.level)) byLevel.set(q.level, [])
  byLevel.get(q.level)!.push(q)
}

/* ===================== الأسئلة المحجوزة — بلاغات اللاعبين ===================== */
/**
 * معرّفات لا تُسحب: سؤال بُلّغ عنه محجوز حتى يراجعه المدير، أو ملغى نهائياً
 * (`question_flags` في القاعدة).
 *
 * **الترشيح هنا لا في `drawOne`** لأنّ هذه هي المنابع كلّها: السحب العاديّ،
 * وطابور الحق ما تلحق، وحتى «الأقدم استخداماً» حين ينفد المستوى. لو رُشّح
 * في السحب وحده لعاد السؤال المعطوب من باب التنازل الأخير.
 *
 * ومجموعة في الذاكرة لا نداء شبكة: القائمة تُقرأ مرّة عند الإقلاع وتُخزَّن
 * محلّياً (`src/lib/questionFlags.ts`) — واللعبة تعمل بلا إنترنت (SPEC ٦).
 */
let blocked: Set<string> = new Set()

export function setBlockedQuestionIds(ids: Iterable<string>) {
  blocked = new Set(ids)
}

export function blockedQuestionIds(): Set<string> {
  return blocked
}

const allowed = (list: Question[]): Question[] =>
  blocked.size === 0 ? list : list.filter((q) => !blocked.has(q.id))

export function poolByCatLevel(category: string, level: Level): Question[] {
  return allowed(byCatLevel.get(key(category, level)) ?? [])
}

export function poolByLevels(levels: Level[]): Question[] {
  return allowed(levels.flatMap((l) => byLevel.get(l) ?? []))
}

/* ========================= عائلات القوالب ========================= */
/**
 * البنك فيه أسئلة تتشارك صيغة واحدة وتختلف إجاباتها — «ما العنصر الذي رمزه الكيميائي…؟»
 * أربع عشرة مرة، «في أي دولة تقع…؟» عشر مرات. سؤالان من عائلة واحدة في جلسة واحدة
 * يجعل اللعبة تُحسّ مكرّرة وإن لم يتكرّر سؤال. فنمنع أكثر من واحد من كل عائلة (القسم ٨).
 *
 * العائلة = أول أربع كلمات من نص السؤال بعد تجريد التشكيل وتوحيد الهمزة والتاء والألف
 * المقصورة. أربع كلمات لأن ثلاثاً تجمع أسئلة لا صلة بينها (٣٤١ سؤالاً بدل ١٠٣).
 * وتُعتبر عائلة فقط إن ضمّت ثلاثة أسئلة فأكثر — ما دون ذلك تشابه عابر لا قالب.
 */
const FAMILY_PREFIX_WORDS = 4
const FAMILY_MIN_SIZE = 3

const normalizeAr = (s: string) =>
  s
    .replace(/[ً-ْـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')

const prefixKey = (q: Question) =>
  normalizeAr(q.question).split(/\s+/).slice(0, FAMILY_PREFIX_WORDS).join(' ')

const familyById = new Map<string, string>()
{
  const counts = new Map<string, number>()
  // أسئلة الصور («من صاحب الصورة؟») نصّها واحد فتتجمّع كلّها في عائلة واحدة
  // فيُسمح بواحدة في الجلسة — وهو خطأ: العبرة بالصورة لا بالنصّ. تُستثنى فلا
  // عائلة لها، وتمييزها بالصورة يحرسه المحرك (لا صورة تتكرّر عبر عدم التكرار).
  const textual = ALL_QUESTIONS.filter((q) => !q.image)
  for (const q of textual) {
    const k = prefixKey(q)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  for (const q of textual) {
    const k = prefixKey(q)
    if ((counts.get(k) ?? 0) >= FAMILY_MIN_SIZE) familyById.set(q.id, k)
  }
}

/** مفتاح عائلة السؤال، أو null إن لم ينتمِ إلى قالب متكرّر. */
export function familyOf(q: Question): string | null {
  return familyById.get(q.id) ?? null
}

/* ========================= أسماء عرض مختصرة ========================= */
const DISPLAY_NAMES: Record<string, string> = {
  'جغرافيا ومعالم': 'جغرافيا',
  'تاريخ وحضارات': 'تاريخ',
  'دين وسيرة': 'إسلاميات',
  'علوم واختراعات': 'علوم',
  'طب وصحة': 'صحة',
  'أدب وفنون': 'أدب',
  'تقنية ومنوعات': 'تقنية',
  'رياضة وأرقام': 'رياضة',
  'سينما ودراما': 'سينما',
}

export function displayName(cat: string): string {
  return DISPLAY_NAMES[cat] ?? cat
}
