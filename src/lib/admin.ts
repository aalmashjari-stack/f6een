import { supabase } from './supabase'
import type { ImportRow } from './importQuestions'

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

/** هل الحساب الحاليّ مدير (بأيّ دور)؟ سؤال القاعدة لا سؤال الرمز. */
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return data === true
}

/**
 * هل هو **مدير عامّ**؟ عليه تتوقّف ألسنةُ الحسابات والجلسات والأكواد
 * والرسائل — ومنحُ الأدوار.
 *
 * والإخفاء في الواجهة زينةٌ لا حماية: الحارس الحقيقيّ `is_super()` داخل كلّ
 * دالّة (انظر `20260904090000_admin_roles.sql`). فمن عدّل سطراً في المتصفّح
 * ليُظهر اللسان، وجد الدالّة تردّه بـ`not_super`.
 */
export async function isSuper(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_super')
  if (error) throw error
  return data === true
}

/** دور الإدارة: `super` كلّ شيء · `editor` الأسئلة وحدها · `null` ليس مديراً. */
export type AdminRole = 'super' | 'editor'

/** منحُ الدور أو سحبُه (`null`). للمدير العامّ وحده، ولا يغيّر دورَ نفسه. */
export async function setAdminRole(id: string, role: AdminRole | null): Promise<string> {
  const { data, error } = await supabase.rpc('admin_set_admin', { p_user: id, p_role: role })
  if (error) throw new Error(translate(error.message))
  return data as string
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
  role: AdminRole | null
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
  not_super: 'هذا الفعل للمدير العامّ وحده',
  cannot_change_self: 'لا تغيّر دورَ نفسك — اطلبه من مديرٍ عامّ آخر',
  bad_role: 'الدور: مدير عامّ أو محرّر أسئلة',
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
  bad_payload: 'صيغة الدفعة غير صالحة',
  too_many_rows: 'الرزمة فوق ألف صفّ',
  bank_incomplete: 'البنك في القاعدة ناقص — خليّة تحت الحدّ. أكمل الزرع أوّلاً',
  cell_floor: 'لا يمكن — تبقى الخليّة تحت عشرين سؤالاً. أفرِغها كلَّها أو أبقِ عشرين',
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
  family: string | null
  origin: 'bank' | 'override' | 'new'
  updated_at: string
}

/**
 * صفوفُ الأسئلة في القاعدة.
 *
 * **قيمةٌ واحدة لا صفوف.** الدالّة كانت تُرجع صفوفاً، وPostgREST يقصّها
 * عند ألف — فبعد نقل البنك رأت اللوحة ١٠٠٠ من ٢٢١١ وبدا الزرعُ ناقصاً
 * (`20260905180000_admin_questions_jsonb.sql`). ولا حدَّ على حجم قيمة jsonb.
 */
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

/**
 * حذف صفّ الطبقة.
 *
 * قبل نقل البنك: تراجعٌ إلى الأصل المشحون لسؤال البنك، ومحوٌ للمضاف.
 * بعده: محوٌ حقيقيّ للجميع — وتردّه القاعدة إن أنزل خليّةً تحت الحدّ.
 */
export async function deleteQuestionEdit(id: string): Promise<'bank' | 'override' | 'new'> {
  const { data, error } = await supabase.rpc('admin_delete_question', { p_id: id })
  if (error) throw new Error(translate(error.message))
  return data as 'bank' | 'override' | 'new'
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

/**
 * رفع دفعة أسئلة — تُقسَّم إلى رزم.
 *
 * كل رزمة معاملةٌ واحدة في القاعدة، ورزمةٌ من ثلاثمئة صفٍّ حمولةُ طلبٍ
 * معقولة. والألف حدُّ الدالّة نفسها، فالتقسيم هنا يحفظ الحدّ ويجعل شريط
 * التقدّم يتحرّك بدل أن يقف على ملفّ من ألفٍ وخمسمئة.
 */
export async function importQuestions(
  rows: ImportRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ added: number; updated: number }> {
  const CHUNK = 300
  let added = 0
  let updated = 0

  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK)
    const { data, error } = await supabase.rpc('admin_import_questions', { p_rows: slice })
    if (error) throw new Error(translate(error.message))
    const res = data as { added: number; updated: number }
    added += res.added
    updated += res.updated
    onProgress?.(Math.min(i + CHUNK, rows.length), rows.length)
  }

  return { added, updated }
}

/**
 * حذفُ جملةٍ في معاملةٍ واحدة — إمّا كلُّها أو لا شيء.
 *
 * كان الحكم يحذف صفّاً صفّاً، فيقيس حارسُ الخليّة كلَّ حذفٍ وحده ولا يرى
 * أنّ الحكم يفرغ الخليّة كلّها: يقف عند عشرين ويردّ ما بعده. وحذفُ فئة
 * «سيارات» توقّف فعلاً عند ستّين — عشرين في كل مستوى.
 *
 * وهنا تُقاس الخلايا على حالتها النهائية بعد الحذف كلِّه، فالإفراغ يمرّ
 * (الفئة تخرج من اللعب ولا تُكسر) والنحافةُ تُردّ. ومئة نداءٍ متتابع صارت
 * نداءً واحداً.
 */
export async function deleteQuestions(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const { data, error } = await supabase.rpc('admin_delete_questions', { p_ids: ids })
  if (error) throw new Error(translate(error.message))
  return (data as { deleted: number }).deleted
}

/* ===================== نقل البنك إلى القاعدة ===================== */
/**
 * البنك كان ملفّاً في التطبيق، فصار صفوفاً في القاعدة (قرار علي ٥ سبتمبر
 * ٢٠٢٦). والنقل من هنا لا من محرّر SQL: اللوحة تحمل البنك في المتصفّح
 * أصلاً وهي مسجَّلةُ الدخول مديراً — فلا يُنسخ ستّمئة كيلوبايت بيدٍ، ولا
 * يُطلب مفتاحٌ يتجاوز حرّاس القاعدة.
 *
 * وخطوتان لا واحدة: `seedBank` تزرع، و`setBankMode` تقلب المفتاح — ولا
 * تقلبه القاعدة إلّا بعد أن تتأكّد أنّ كل خليّة بلغت حدّها.
 */

export interface SeedRow {
  id: string
  category: string
  level: string
  topic: string
  question: string
  answer: string
  image: string | null
  family: string | null
}

/** هل القاعدة هي مرجع الأسئلة الآن؟ */
export async function bankMode(): Promise<boolean> {
  const { data, error } = await supabase.rpc('bank_mode')
  if (error) throw new Error(translate(error.message))
  return data === true
}

/** الخلايا التي لم تبلغ حدّها — سببُ رفض قلب المفتاح، معروضاً لا مخفيّاً. */
export async function bankFloorBreaches(): Promise<
  { category: string; level: string; n: number; floor: number }[]
> {
  const { data, error } = await supabase.rpc('bank_floor_breaches')
  if (error) throw new Error(translate(error.message))
  return (data ?? []) as { category: string; level: string; n: number; floor: number }[]
}

/**
 * زرعُ البنك — **لا يمسّ صفّاً قائماً**. فما عدّلتَه من اللوحة قبل النقل
 * يبقى كما عدّلته، وتشغيلُ الزرع مرّتين يُكمل ما نقص ولا يكرّر.
 */
export async function seedBank(
  rows: SeedRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ inserted: number; total: number }> {
  const CHUNK = 300
  let inserted = 0
  let total = 0

  for (let i = 0; i < rows.length; i += CHUNK) {
    const { data, error } = await supabase.rpc('admin_seed_bank', {
      p_rows: rows.slice(i, i + CHUNK),
    })
    if (error) throw new Error(translate(error.message))
    const res = data as { inserted: number; total: number }
    inserted += res.inserted
    total = res.total
    onProgress?.(Math.min(i + CHUNK, rows.length), rows.length)
  }

  return { inserted, total }
}

/**
 * قلبُ المرجع.
 *
 * `expect` = عدد أسئلة ملفّ التطبيق. القاعدة تعدّ صفوفها وتردّ القلبَ إن
 * كانت أقلّ — فزرعٌ انقطع في منتصفه لا يصير مرجعاً. والإطفاء رجوعٌ آمن
 * فلا يُفحص.
 */
export async function setBankMode(on: boolean, expect = 0): Promise<number> {
  const { data, error } = await supabase.rpc('admin_set_bank_mode', {
    p_on: on,
    p_expect: expect,
  })
  if (error) throw new Error(translate(error.message))
  return (data as { total: number }).total
}
