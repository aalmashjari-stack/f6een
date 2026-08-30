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
  empty_question: 'السؤال والإجابة لا يكونان فارغين',
  no_category: 'اختر تصنيفاً',
  bad_level: 'المستوى: سهل أو متوسط أو صعب',
  no_such_question: 'لا تعديل محفوظاً لهذا السؤال',
  name_too_short: 'اسم الفئة حرفان فأكثر',
  category_exists: 'هذه الفئة موجودة',
  category_in_use: 'الفئة تحمل أسئلة — انقلها أو احذفها أوّلاً',
  no_such_category: 'لا فئة بهذا الاسم',
}

function translate(msg: string): string {
  for (const [key, ar] of Object.entries(ERRORS)) if (msg.includes(key)) return ar
  return msg
}

/* ===================== الأسئلة — التعديل والإضافة ===================== */

export interface AdminQuestionEdit {
  question_id: string
  category: string
  level: string
  topic: string | null
  question: string
  answer: string
  image: string | null
  origin: 'override' | 'new'
  updated_at: string
}

/** ما عُدّل أو أُضيف وحده. البنك المشحون تحمله اللوحة في المتصفّح وتدمجه. */
export async function listQuestionEdits(): Promise<AdminQuestionEdit[]> {
  const { data, error } = await supabase.rpc('admin_questions')
  if (error) throw error
  return (data ?? []) as AdminQuestionEdit[]
}

export interface QuestionInput {
  id?: string | null
  category: string
  level: string
  topic?: string | null
  question: string
  answer: string
  image?: string | null
}

/** معرّف فارغ = سؤال جديد يُولَّد له `ADM####`. يُرجع المعرّف. */
export async function saveQuestion(q: QuestionInput): Promise<string> {
  const { data, error } = await supabase.rpc('admin_save_question', {
    p_id: q.id ?? null,
    p_category: q.category,
    p_level: q.level,
    p_topic: q.topic ?? null,
    p_question: q.question,
    p_answer: q.answer,
    p_image: q.image ?? null,
  })
  if (error) throw new Error(translate(error.message))
  return data as string
}

/** حذف صفّ الطبقة: تراجعٌ إلى الأصل لسؤال البنك، ومحوٌ للسؤال المضاف. */
export async function deleteQuestionEdit(id: string): Promise<'override' | 'new'> {
  const { data, error } = await supabase.rpc('admin_delete_question', { p_id: id })
  if (error) throw new Error(translate(error.message))
  return data as 'override' | 'new'
}

/* ============================== الفئات ============================== */

export interface CategoryRow {
  name: string
  art_url: string | null
  /** false = صفٌّ لا يحمل إلّا صورةً بديلة لفئةٍ مشحونة، فلا يزيد في القائمة. */
  is_extra: boolean
}

/** صفوف جدول الفئات: المضافة، وصفوف الصور البديلة لفئات البنك. */
export async function listCategoryRows(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.rpc('extra_categories')
  if (error) throw error
  return (data ?? []) as CategoryRow[]
}

/** أسماء الفئات المضافة وحدها — لقائمة التصنيف في نموذج السؤال. */
export async function listExtraCategories(): Promise<string[]> {
  return (await listCategoryRows()).filter((r) => r.is_extra !== false).map((r) => r.name)
}

/** تعيين صورة فئة — `null` يعيدها إلى صورتها المشحونة. */
export async function saveCategoryArt(name: string, url: string | null): Promise<void> {
  const { error } = await supabase.rpc('admin_set_category_art', { p_name: name, p_url: url })
  if (error) throw new Error(translate(error.message))
}

export async function addCategory(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_add_category', { p_name: name })
  if (error) throw new Error(translate(error.message))
  return data as string
}

/** يُرفض ما دامت الفئة تحمل أسئلة — وإلّا ضاعت أسئلتها بلا عجلةٍ تصل إليها. */
export async function deleteCategory(name: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_category', { p_name: name })
  if (error) throw new Error(translate(error.message))
}
