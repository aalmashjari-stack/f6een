import { supabase } from './supabase'

/**
 * «تواصل معنا» — الرسالة تُكتب في القاعدة لا تُرسل بريداً.
 *
 * `mailto:` كان يفتح تطبيق بريد الجهاز، وأكثر اللاعبين على الجوال بلا
 * حسابٍ مضبوط فيه — فلا الرسالة تصل ولا المرسِل يعلم. وهذا الملف ينادي
 * ويترجم فقط: السقف (خمس في الساعة) وطول النصّ والبريد البديل كلّها
 * مفروضة في `send_message` داخل القاعدة، حيث لا يُلتفّ عليها.
 */
export async function sendMessage(body: string, email?: string): Promise<void> {
  const { error } = await supabase.rpc('send_message', {
    p_body: body,
    p_email: email?.trim() || null,
  })
  if (error) throw error
}

/** رسائل اللوحة — أحدث أوّلاً. لا يردّها الخادم إلا لمدير. */
export interface AdminMessage {
  id: string
  email: string
  body: string
  status: 'new' | 'read' | 'done'
  createdAt: string
}

export async function fetchMessages(limit = 200): Promise<AdminMessage[]> {
  const { data, error } = await supabase.rpc('admin_messages', { p_limit: limit })
  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    email: (r.email as string) ?? '',
    body: (r.body as string) ?? '',
    status: r.status as AdminMessage['status'],
    createdAt: r.created_at as string,
  }))
}

export async function setMessageStatus(
  id: string,
  status: AdminMessage['status'],
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_message_status', {
    p_id: id,
    p_status: status,
  })
  if (error) throw error
}
