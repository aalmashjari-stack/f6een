import { supabase } from './supabase'
import { setBlockedQuestionIds } from '../game/bank'
import { readScoped, removeScoped, writeScoped } from '../game/session'

/**
 * الأسئلة المحجوزة — بلاغٌ من لاعب يوقف السؤال حتى يراجعه المدير.
 *
 * **الجهاز يبقى مصدر اللعب.** اللعبة تعمل بلا إنترنت بعد التحميل (SPEC ٦)،
 * فلا يجوز أن ينتظر سحبُ سؤالٍ شبكةً: القائمة تُقرأ من `localStorage` فوراً
 * عند الإقلاع، ثمّ تُحدَّث من الخادم في الخلفية للمرّة القادمة. وكل فشل
 * شبكة يُبتلع — أسوأ أثره أن يتأخّر حجزٌ جلسةً واحدة.
 */

/* قائمة المحجوز عامّة لا باسم حساب: السؤال المعطوب معطوبٌ لكل مجلس (SPEC ١٠). */
const KEY = 'f6een.blockedQuestionIds'

function loadLocal(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveLocal(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* تجاهل */
  }
}

/** تُنادى عند الإقلاع قبل أي سحب — بلا شبكة. */
export function applyCachedBlocked() {
  setBlockedQuestionIds(loadLocal())
}

/**
 * ما حجبه **هذا الجهاز** ببلاغه — منفصلٌ عن نسخة الخادم. كان يعيش في القائمة
 * نفسها فتمحوه أوّلُ مزامنة، والبلاغُ الذي ردّه الخادم ردّاً نهائيّاً (`FINAL`)
 * يعود سؤالُه في الجلسة التالية خلافاً لما يعد به التعليق هناك.
 */
const OWN_KEY = 'f6een.ownBlockedIds'

function loadOwn(): string[] {
  try {
    const raw = readScoped(OWN_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/**
 * قائمة المحجوز من الخادم. `blocked_question_ids()` قيمةٌ jsonb واحدة؛
 * و`blocked_questions()` القديمة صفوفٌ يقصّها PostgREST عند ألف بصمت — وفي
 * ٢٣ سبتمبر ٢٠٢٦ كان المحجوز 1184، فنحو مئتي سؤالٍ معطَّل يُسحب في كلّ جهاز.
 * فالقديمة للقاعدة التي لم تُرقَّ وحدها (`PGRST202`: لا دالّة بهذا الاسم).
 */
async function fetchBlocked(): Promise<string[]> {
  const res = await supabase.rpc('blocked_question_ids')
  if (!res.error) return Array.isArray(res.data) ? (res.data as string[]) : []
  if (res.error.code !== 'PGRST202') throw res.error
  const legacy = await supabase.rpc('blocked_questions')
  if (legacy.error) throw legacy.error
  return (legacy.data ?? []).map((r: { question_id: string }) => r.question_id)
}

/** تُنادى بعد توفّر الجلسة: تُحدّث القائمة من الخادم وتخزّنها. */
export async function syncBlocked(): Promise<void> {
  const ids = await fetchBlocked()
  /* ما بلّغ عنه هذا الجهاز — بلغ الخادمَ أم لم يبلغ أم ردّه — يبقى محجوزاً هنا. */
  const pending = pendingReports().map((p) => p.id)
  const merged = [...new Set([...ids, ...pending, ...loadOwn()])]
  saveLocal(merged)
  setBlockedQuestionIds(merged)
}

function blockLocally(questionId: string) {
  writeScoped(OWN_KEY, JSON.stringify([...new Set([...loadOwn(), questionId])]))
  const ids = [...new Set([...loadLocal(), questionId])]
  saveLocal(ids)
  setBlockedQuestionIds(ids)
}

/* ======================= صندوق البلاغات الصادر ======================= */
/**
 * البلاغ الذي لم يبلغ الخادم — باسم الحساب، لأنّ الخادم يقبله من صاحب
 * الجلسة وحده.
 *
 * كان الحجز المحلّي يقع **بعد** نجاح الطلب رغم تعليقٍ يقول عكسه، والشاشة
 * تقول «بُلّغ» بمجرّد الضغطة: بلا شبكة كان البلاغ يضيع بمغادرة الختام،
 * والسؤال يعود في الجلسة التالية (تدقيق ٦ سبتمبر ٢٠٢٦). الآن الحجز فوريّ،
 * والبلاغ يُكتب هنا قبل الطلب ويُمحى بعد نجاحه، ويُعاد عند الإقلاع.
 */
const PENDING_KEY = 'f6een.pendingReports'

export interface PendingReport {
  id: string
  sessionId: string | null
}

export function pendingReports(): PendingReport[] {
  try {
    const raw = readScoped(PENDING_KEY)
    const list = raw ? (JSON.parse(raw) as PendingReport[]) : []
    return Array.isArray(list) ? list.filter((p) => typeof p?.id === 'string') : []
  } catch {
    return []
  }
}

function savePending(list: PendingReport[]) {
  if (list.length === 0) removeScoped(PENDING_KEY)
  else writeScoped(PENDING_KEY, JSON.stringify(list))
}

/**
 * ردودٌ نهائيّة لا تُعاد بعدها المحاولة: الخادم رفض البلاغ عن علم لا عن
 * عطل — والحجز المحلّي يبقى، فصاحبُ الجهاز لا يريد السؤال على أيّ حال.
 */
const FINAL = ['not_shown', 'unknown_question', 'no_session', 'no_question']

async function send(p: PendingReport): Promise<void> {
  const { error } = await supabase.rpc('report_question', {
    p_question_id: p.id,
    p_session_id: p.sessionId ?? null,
  })
  if (error) throw error
}

const isFinal = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? '')
  return FINAL.some((code) => msg.includes(code))
}

/**
 * تبليغ عن سؤال — يحجزه محلّياً في اللحظة نفسها، ويرفعه ليُحجز عن الجميع
 * حتى يراجعه المدير. يُعيد الوعد بالرفع؛ فشلُه يُبقي البلاغ في الصندوق.
 */
export async function reportQuestion(questionId: string, sessionId?: string | null): Promise<void> {
  blockLocally(questionId)
  const p: PendingReport = { id: questionId, sessionId: sessionId ?? null }
  const rest = pendingReports().filter((x) => x.id !== questionId)
  savePending([...rest, p])
  try {
    await send(p)
  } catch (e) {
    if (!isFinal(e)) throw e
  }
  savePending(pendingReports().filter((x) => x.id !== questionId))
}

/** يعيد ما في الصندوق واحداً واحداً. ما فشل بعطلٍ يبقى إلى المرّة القادمة. */
export async function flushPendingReports(): Promise<void> {
  for (const p of pendingReports()) {
    try {
      await send(p)
    } catch (e) {
      if (!isFinal(e)) continue
    }
    savePending(pendingReports().filter((x) => x.id !== p.id))
  }
}
