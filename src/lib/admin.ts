import { supabase } from './supabase'

/**
 * لوحة الإدارة — نداءات القاعدة.
 *
 * **كل صلاحية هنا مفروضة في القاعدة لا في هذا الملفّ.** المفتاح العلنيّ
 * نفسه في يد كل لاعب، فلو كان الحارس شرطاً في جافاسكربت لفُتحت اللوحة
 * بتعديل سطرٍ في المتصفّح. الحارس صفٌّ في `public.admins` تقرؤه `is_admin()`،
 * ودوالّ الإدارة كلّها تشترطه: من ليس مديراً يرى صفر صفوف أو `not_admin`.
 *
 * ولهذا لا يضرّ أن تُشحن هذه الشاشة في نفس الحزمة العلنيّة.
 */

/** هل الحساب الحاليّ مدير؟ سؤال القاعدة لا سؤال الرمز. */
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return data === true
}

export interface AdminUser {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  birth_date: string | null
  joined_at: string
  balance: number | null
  games: number
  last_game: string | null
  questions_seen: number
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_users')
  if (error) throw error
  return (data ?? []) as AdminUser[]
}

/** الرصيد يُكتب كاملاً لا فرقاً — انظر تعليل الدالّة في الهجرة. */
export async function setBalance(userId: string, balance: number): Promise<number> {
  const { data, error } = await supabase.rpc('admin_set_balance', {
    p_user: userId,
    p_balance: balance,
  })
  if (error) throw new Error(translate(error.message))
  return data as number
}

export interface AdminSession {
  id: string
  user_id: string
  email: string | null
  status: 'open' | 'finished' | 'abandoned'
  created_at: string
  updated_at: string
  teams: { name: string; score: number }[] | null
}

export async function listSessions(limit = 200): Promise<AdminSession[]> {
  const { data, error } = await supabase.rpc('admin_sessions', { p_limit: limit })
  if (error) throw error
  return (data ?? []) as AdminSession[]
}

export interface AdminCode {
  code: string
  games: number
  max_redemptions: number | null
  expires_at: string | null
  owner: string | null
  created_at: string
  redeemed: number
}

export async function listCodes(): Promise<AdminCode[]> {
  const { data, error } = await supabase.rpc('admin_gift_codes')
  if (error) throw error
  return (data ?? []) as AdminCode[]
}

export interface NewCode {
  code: string
  games: number
  max: number | null
  expires: string | null
  owner: string | null
}

export async function createCode(c: NewCode): Promise<string> {
  const { data, error } = await supabase.rpc('admin_create_gift_code', {
    p_code: c.code,
    p_games: c.games,
    p_max: c.max,
    /* التاريخ يصل يوماً (YYYY-MM-DD) ويُقرأ في القاعدة لحظةً — فبلا نهاية
       اليوم ينتهي الكود فجراً، وصاحبه يظنّه صالحاً طوال اليوم الأخير. */
    p_expires: c.expires ? `${c.expires}T23:59:59` : null,
    p_owner: c.owner,
  })
  if (error) throw new Error(translate(error.message))
  return data as string
}

export async function deleteCode(code: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_gift_code', { p_code: code })
  if (error) throw new Error(translate(error.message))
}

export type FlagStatus = 'pending' | 'ok' | 'disabled'

export interface AdminFlag {
  question_id: string
  status: FlagStatus
  reports: number
  first_at: string
  last_at: string
  note: string | null
  reviewed_at: string | null
}

/** طابور المراجعة — المحجوز أوّلاً، ثمّ الأحدث بلاغاً. */
export async function listFlags(): Promise<AdminFlag[]> {
  const { data, error } = await supabase.rpc('admin_flags')
  if (error) throw error
  return (data ?? []) as AdminFlag[]
}

/**
 * قرار المراجعة. `ok` يعيد السؤال إلى السحب، و`disabled` يلغيه نهائياً،
 * و`pending` يعيد حجزه.
 *
 * ولا يُعدَّل نصّ السؤال من هنا: البنك ملفٌّ يُشحن مع التطبيق، فالتصحيح يقع
 * فيه ويصل الأجهزة مع التحديث — والقرار المسجَّل بعده `ok`.
 */
export async function setFlag(questionId: string, status: FlagStatus, note?: string) {
  const { error } = await supabase.rpc('admin_set_flag', {
    p_question_id: questionId,
    p_status: status,
    p_note: note ?? null,
  })
  if (error) throw new Error(translate(error.message))
}

export interface AdminStats {
  users: number
  balance: number
  sessions: number
  open: number
  finished: number
  abandoned: number
  codes: number
  redemptions: number
  played_today: number
}

export async function fetchStats(): Promise<AdminStats | null> {
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw error
  return (data ?? null) as AdminStats | null
}

/* أخطاء القاعدة إنجليزيّة بطبعها، واللوحة عربيّة كبقيّة التطبيق. */
const ERRORS: Record<string, string> = {
  not_admin: 'هذا الحساب ليس مديراً',
  bad_balance: 'الرصيد رقم صحيح لا يقلّ عن صفر',
  no_such_user: 'لا حساب بهذا المعرّف',
  code_too_short: 'الكود ثلاثة أحرف فأكثر',
  bad_games: 'عدد الألعاب واحد فأكثر',
  code_exists: 'هذا الكود موجود',
  code_not_found: 'هذا الكود غير موجود',
  bad_status: 'حالة غير معروفة',
}

function translate(msg: string): string {
  for (const [key, ar] of Object.entries(ERRORS)) if (msg.includes(key)) return ar
  return msg
}
