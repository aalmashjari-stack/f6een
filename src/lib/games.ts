import { supabase } from './supabase'
import { currentUserId } from './auth'
import type { StoredState } from '../game/session'

/**
 * الرصيد والجلسات — SPEC القسمان ٣ و٩.
 *
 * **الخصم عند إنشاء الجلسة لا عند إتمامها.** والقاعدة كلّها مفروضة في
 * `start_session` داخل القاعدة لا هنا: هذا الملفّ ينادي ويترجم، ولا يقرّر.
 * لو وُضع الفحص هنا لكفى تعديلُ نداءٍ في المتصفّح لتخطّيه — ولهذا لا سياسة
 * كتابة على `profiles` أصلاً، ولا سياسة إضافة على `sessions`.
 */

/** الرصيد الحالي. `null` لا تعني صفراً بل «لم يُقرأ بعد» — والفرق يقرّر هل يُمنع البدء. */
export async function fetchBalance(): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('games_balance')
    .eq('id', await currentUserId())
    .single()
  if (error) throw error
  return data.games_balance as number
}

export interface ServerSession {
  id: string
  state: StoredState
}

/**
 * الجلسة المفتوحة إن وُجدت — نافذة الاستكمال عبر الأجهزة.
 *
 * الحفظ المحلّي يكفي على الجهاز نفسه، وهذه للحالة التي لا يغطّيها: جهاز آخر،
 * أو متصفّح مُسِح تخزينه. بدونها يجد اللاعب لعبةً مخصومة لا يصل إليها،
 * وجلستُه المفتوحة تمنعه من بدء غيرها (فهرس «مفتوحة واحدة لكل حساب»).
 */
export async function fetchOpenSession(): Promise<ServerSession | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, state')
    .eq('user_id', await currentUserId())
    .eq('status', 'open')
    .maybeSingle()
  if (error) throw error
  return data ? { id: data.id as string, state: data.state as StoredState } : null
}

/** يُرفع حين يردّ `start_session` بـ`no_balance` — ليفرزه النداء عن أعطال الشبكة. */
export class NoBalanceError extends Error {
  constructor() {
    super('no_balance')
    this.name = 'NoBalanceError'
  }
}

/**
 * بدء جلسة: استئنافٌ بلا خصم إن كانت هناك مفتوحة، وإلّا خصمُ لعبةٍ وإنشاء.
 *
 * القرار كلّه في القاعدة، والحالة المعادة قد لا تكون التي أُرسلت — فمن بدأ
 * جلسةً على جهاز ونسيها يستأنفها هنا بدل أن يُخصم مرّتين.
 */
export async function startSession(state: StoredState): Promise<ServerSession> {
  const { data, error } = await supabase.rpc('start_session', { initial_state: state })
  if (error) {
    if (error.message.includes('no_balance')) throw new NoBalanceError()
    throw error
  }
  return { id: data.id as string, state: data.state as StoredState }
}

/**
 * حفظ لقطة الحالة على الخادم.
 *
 * الحفظ المحلّي هو الأساس وهذا فوقه، فالفشل هنا يُبتلع عند النداء: لعبةٌ
 * قائمة لا تتوقّف لأنّ الشبكة انقطعت.
 */
export async function saveSessionState(id: string, state: StoredState): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/**
 * إغلاق الجلسة — وهو ما يُطلق الحساب ليبدأ التالية.
 *
 * بدونه تبقى الجلسة مفتوحة أبداً، فيردّ `start_session` نفسَها في كل مرّة
 * ولا يبدأ اللاعب لعبةً جديدة ولو دفع. ولقطة الحالة تُكتب مع الإغلاق في
 * طلبٍ واحد كي لا تضيع نتيجة الختام في مؤقّت الحفظ المؤجَّل.
 *
 * و`abandoned` لا تُعيد الرصيد: «الخصم عند الإنشاء لا عند الإتمام» (SPEC ٣).
 */
export async function closeSession(
  id: string,
  status: 'finished' | 'abandoned',
  state?: StoredState,
): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (state) patch.state = state
  const { error } = await supabase.from('sessions').update(patch).eq('id', id)
  if (error) throw error
}

/* رسائل أخطاء `redeem_gift_code` — تُترجَم هنا لا تُعرض خاماً: اللاعب لا
   يفهم `code_exhausted`، ونصُّ القاعدة إنجليزيّ بطبعه. */
const GIFT_ERRORS: Record<string, string> = {
  code_not_found: 'هذا الكود غير موجود',
  code_expired: 'انتهت صلاحية هذا الكود',
  code_exhausted: 'اكتمل عدد إضافات هذا الكود',
  code_already_used: 'أضفت هذا الكود من قبل',
}

/** إضافة كود هدية — يُرجع عدد الألعاب الممنوحة. */
export async function redeemGiftCode(code: string): Promise<number> {
  const { data, error } = await supabase.rpc('redeem_gift_code', { p_code: code.trim() })
  if (error) {
    for (const [key, msg] of Object.entries(GIFT_ERRORS)) {
      if (error.message.includes(key)) throw new Error(msg)
    }
    throw error
  }
  return data as number
}

/**
 * «لعبة» و«لعبتان» و«ألعاب» — العربية تُثنّي وتَجمع جمع قلّة، و«2 لعبة» ركيك
 * في شاشةٍ كلُّ نصّها عربيّ. والرقم يبقى لاتينياً كبقيّة أرقام الواجهة.
 */
export function gamesLabel(n: number): string {
  if (n <= 0) return 'لا شيء'
  if (n === 1) return 'لعبة واحدة'
  if (n === 2) return 'لعبتان'
  if (n >= 3 && n <= 10) return `${n} ألعاب`
  return `${n} لعبة`
}

/* ======================= صفحة الحساب — البيانات والألعاب ======================= */

/** بيانات صفّ الحساب. `createdAt` هو «عضو منذ» — تاريخ إنشاء الحساب لا أوّل لعبة. */
export interface Profile {
  balance: number
  createdAt: string
}

export async function fetchProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('games_balance, created_at')
    .eq('id', await currentUserId())
    .single()
  if (error) throw error
  return { balance: data.games_balance as number, createdAt: data.created_at as string }
}

export interface GameSummary {
  id: string
  status: 'open' | 'finished' | 'abandoned'
  createdAt: string
  /** أسماء الفريقين ونتيجتهما. `null` لجلسةٍ حُفظت بشكل حالةٍ لا يحمل الفرق. */
  teams: { name: string; score: number }[] | null
}

/**
 * ألعاب الحساب — الأحدث أوّلاً.
 *
 * **لا يُقرأ عمود `state` كاملاً.** فيه طابور المرحلة الثالثة (أربعون سؤالاً
 * بنصوصها) وذاكرة الأسئلة (مئات المعرّفات)، فقراءته لثلاثين جلسة تنقل
 * ميغابايتات لعرض سطرٍ فيه اسمان ورقمان. المسار `state->teams` يقتطع في
 * القاعدة ما يُعرض وحده.
 *
 * والسقف خمسون: صفحة الحساب تُقرأ لا تُدرَس، ومن تجاوزها فأقدم ألعابه لا
 * تُسأل عنها — ولو صارت تُسأل فالحلّ ترقيم لا رفع السقف.
 */
export async function fetchMyGames(limit = 50): Promise<GameSummary[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, status, created_at, teams:state->teams')
    .eq('user_id', await currentUserId())
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id as string,
    status: r.status as GameSummary['status'],
    createdAt: r.created_at as string,
    teams: Array.isArray(r.teams)
      ? (r.teams as { name: string; score: number }[]).map((t) => ({
          name: String(t?.name ?? ''),
          score: Number(t?.score ?? 0),
        }))
      : null,
  }))
}
