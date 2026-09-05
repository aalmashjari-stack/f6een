import { supabase } from './supabase'
import { setExtraCategories, setQuestionOverlay } from '../game/bank'
import { setCategoryArt } from '../components/categoryArt'
import type { Level, Question } from '../game/types'

/**
 * طبقة الأسئلة — ما عدّلته اللوحة أو أضافته فوق البنك المشحون.
 *
 * **نفس عقد قائمة المحجوز:** تُقرأ من التخزين المحلّي فوراً عند الإقلاع،
 * ثمّ تُحدَّث من الخادم في الخلفية. اللعبة تعمل بلا إنترنت (SPEC ٦)، فلا
 * ينتظر سحبُ سؤالٍ شبكةً — وأسوأ ما يقع بلا اتّصال أن يتأخّر تعديلُ سؤالٍ
 * جلسةً واحدة.
 */

const KEY = 'f6een.questionOverlay'
const CATS_KEY = 'f6een.extraCategories'

interface Row {
  question_id: string
  category: string
  level: string
  topic: string | null
  question: string
  answer: string
  image: string | null
  /** الموضوع المصرَّح به — يمنع سؤالين جوابهما واحد في جلسة. قد يغيب. */
  family?: string | null
}

/** ما تُرجعه `question_bank()`: الوضع وصفوفه في نداءٍ واحد. */
interface BankPayload {
  mode: 'db' | 'overlay'
  rows: Row[]
  /** توقيعُ ما نُزّل — به يُعرف أنّ ما في التخزين لا يزال هو الأحدث. */
  sig?: string
}

const LEVELS: Level[] = ['سهل', 'متوسط', 'صعب']

/** صفٌّ من القاعدة إلى سؤال. الصفّ الفاسد يُطرح ولا يُسقط الطبقة كلّها. */
function toQuestion(r: Row): Question | null {
  if (!r?.question_id || !r.question || !r.answer) return null
  if (!LEVELS.includes(r.level as Level)) return null
  return {
    id: r.question_id,
    category: r.category,
    level: r.level as Level,
    topic: r.topic ?? '',
    question: r.question,
    answer: r.answer,
    ...(r.image ? { image: r.image } : {}),
    ...(r.family ? { family: r.family } : {}),
  }
}

/**
 * المخزون المحلّي شكلان: مصفوفةُ صفوفٍ (ما قبل ٥ سبتمبر ٢٠٢٦) وكائنٌ يحمل
 * الوضع معها. الشكل القديم يُقرأ ولا يُسقط الطبقة — من حدّث التطبيق ولم
 * يتّصل بعدُ يبقى لاعباً بما كان عنده.
 */
function loadLocal(): BankPayload {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { mode: 'overlay', rows: [] }
    const parsed = JSON.parse(raw) as Row[] | BankPayload
    if (Array.isArray(parsed)) return { mode: 'overlay', rows: parsed }
    return {
      mode: parsed.mode === 'db' ? 'db' : 'overlay',
      rows: parsed.rows ?? [],
      sig: parsed.sig,
    }
  } catch {
    return { mode: 'overlay', rows: [] }
  }
}

function apply(p: BankPayload) {
  setQuestionOverlay(
    p.rows.map(toQuestion).filter((q): q is Question => q !== null),
    p.mode,
  )
}

/** تُنادى عند الإقلاع قبل أي سحب — بلا شبكة. */
export function applyCachedOverlay() {
  apply(loadLocal())
}

/**
 * تُنادى بعد توفّر الجلسة.
 *
 * `question_bank()` تُرجع الوضع والصفوف معاً — لا نداءان قد يصل أحدهما
 * دون الآخر فيُقلب الوضعُ على صفوفٍ قديمة. وإن لم تكن الدالّة موجودة بعد
 * (قاعدةٌ لم تُرقَّ) نسقط إلى `question_overlay()` القديمة، وهي الوضع
 * `overlay` بطبعها.
 */
export async function syncOverlay(): Promise<void> {
  const cached = loadLocal()

  /**
   * التوقيع **قبل** الصفوف لا بعدها.
   *
   * لو قُرئ بعدها ثمّ عُدّل سؤالٌ بينهما، لخُتمت حمولةٌ قديمة بتوقيعٍ جديد —
   * فيطابق توقيعَ الخادم في كل إقلاعٍ بعده، ويتجمّد الجهاز على نسخةٍ قديمة
   * إلى الأبد. وقراءتُه أوّلاً تقلب الخطأ إلى جهته الآمنة: توقيعٌ أقدم من
   * صفوفه يعني تنزيلاً زائداً مرّةً واحدة، لا تجمّداً.
   *
   * وفشلُه لا يوقف شيئاً: نمضي إلى التنزيل الكامل بلا توقيع.
   */
  const sign = await supabase.rpc('bank_signature')
  const sig = !sign.error && sign.data ? JSON.stringify(sign.data) : undefined

  if (sig !== undefined && sig === cached.sig) {
    apply(cached)
    return
  }

  const bank = await supabase.rpc('question_bank')
  let payload: BankPayload

  if (bank.error) {
    const legacy = await supabase.rpc('question_overlay')
    if (legacy.error) throw legacy.error
    payload = { mode: 'overlay', rows: (legacy.data ?? []) as Row[] }
  } else {
    const d = bank.data as BankPayload | null
    payload = { mode: d?.mode === 'db' ? 'db' : 'overlay', rows: d?.rows ?? [] }
  }

  payload.sig = sig

  try {
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* تجاهل — الطبقة تُطبَّق في هذه الجلسة على أي حال. */
  }
  apply(payload)
}

/* ========================= الفئات المضافة ========================= */
/**
 * فئة أضافها المدير من اللوحة. لا تدخل العجلة إلّا حين تكتمل مستوياتها
 * الثلاثة — الشرط في `playableCategories`، وهو الذي يمنع لعبةً تسقط عند
 * أوّل سؤالٍ «صعب» في فئةٍ ليس فيها صعب.
 */
interface CatRow {
  name: string
  art_url: string | null
  is_extra: boolean
}

function loadCats(): CatRow[] {
  try {
    const raw = localStorage.getItem(CATS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    /* الشكل القديم كان مصفوفة أسماء — تُقرأ ولا تُسقط الفئات بتحديث. */
    return Array.isArray(parsed)
      ? parsed.map((r) =>
          typeof r === 'string' ? { name: r, art_url: null, is_extra: true } : (r as CatRow),
        )
      : []
  } catch {
    return []
  }
}

function applyCats(rows: CatRow[]) {
  /* الصفّ الذي لا يحمل إلّا صورةً بديلة لفئةٍ مشحونة لا يدخل قائمة الفئات —
     وإلّا ظهرت الفئة مرّتين. */
  setExtraCategories(rows.filter((r) => r.is_extra !== false).map((r) => r.name))
  setCategoryArt(
    Object.fromEntries(rows.filter((r) => r.art_url).map((r) => [r.name, r.art_url as string])),
  )
}

export function applyCachedCategories() {
  applyCats(loadCats())
}

export async function syncCategories(): Promise<void> {
  const { data, error } = await supabase.rpc('extra_categories')
  if (error) throw error
  const rows = (data ?? []) as CatRow[]
  try {
    localStorage.setItem(CATS_KEY, JSON.stringify(rows))
  } catch {
    /* تجاهل */
  }
  applyCats(rows)
}
