import { supabase } from './supabase'

/**
 * الدفع على الموقع عبر ماي فاتورة (SPEC §١٣ بند ٢، قرار علي ٢٦ نوفمبر ٢٠٢٦).
 *
 * هذا الملفّ ينادي ولا يقرّر — كما `games.ts`: السعرُ والتحقّقُ وإضافةُ
 * الرصيد كلُّها في القاعدة (`20261126120000_web_payments.sql`)، والقاعدةُ
 * نفسها تسأل ماي فاتورة. فلا مفتاح هنا، ولا ثقة بما في عنوان الرجوع: معرّفُ
 * الشراء فيه يقول «اسأل عن هذا» لا «هذا مدفوع».
 */

/** اسم معامل الرجوع في العنوان — `pay_create` يكتبه بالاسم نفسه. */
export const PAY_PARAM = 'pay'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** يبدأ الشراء ويُرجع رابط صفحة الدفع. `amount` هو ما رآه اللاعب — يُقارَن هناك بالسعر الحقّ. */
export async function createPayment(games: number, amount: string): Promise<string> {
  const { data, error } = await supabase.rpc('pay_create', {
    p_games: games,
    p_amount: Number(amount),
    p_return_url: `${location.origin}/`,
  })
  if (error) throw new Error(error.message)
  if (typeof data !== 'string' || !data.startsWith('https://')) throw new Error('bad_payment_url')
  return data
}

export type PayStatus = 'paid' | 'pending' | 'canceled'

/** بعد الرجوع من صفحة الدفع: تسأل القاعدةُ ماي فاتورة، وتضيف الرصيد إن دُفع. */
export async function verifyPayment(id: string): Promise<{ status: PayStatus; games: number }> {
  const { data, error } = await supabase.rpc('pay_verify', { p_purchase: id })
  if (error) throw new Error(error.message)
  return data as { status: PayStatus; games: number }
}

/**
 * تسويةُ شراءٍ معلّق — دفع ثمّ أغلق الصفحة قبل أن يرجع. تُنادى عند كلّ دخول
 * (الموقع والتطبيق)، ولا نداء خارجيّ إن لم يكن عنده معلّق. تُرجع عدد الألعاب
 * التي أُضيفت، وتبتلع الفشل: هي تتمّة لا شرط.
 */
export async function reconcilePayments(): Promise<number> {
  const { data, error } = await supabase.rpc('pay_reconcile')
  if (error) return 0
  return typeof data === 'number' ? data : 0
}

/**
 * يقرأ معرّف الشراء من عنوان الرجوع ويمحوه من العنوان فوراً — فتحديثُ
 * الصفحة لا يعيد التحقّق، والرابطُ المنسوخ لا يحمله.
 */
export function takeReturnedPayment(): string | null {
  const url = new URL(location.href)
  const id = url.searchParams.get(PAY_PARAM)
  if (id === null) return null
  url.searchParams.delete(PAY_PARAM)
  /* ماي فاتورة تُلحق paymentId؛ لا نحتاجه — القاعدة تسأل برقم الفاتورة المحفوظ. */
  url.searchParams.delete('paymentId')
  url.searchParams.delete('Id')
  history.replaceState(history.state, '', url.pathname + url.search + url.hash)
  return UUID.test(id) ? id : null
}

/** رسائل القاعدة إلى نصٍّ يُعرض — نصّها الخام إنجليزيّ تقنيّ. */
export function paymentErrorText(message: string): string {
  if (message.includes('not_authenticated')) return 'سجّل دخولك أولاً'
  if (message.includes('price_changed')) return 'تغيّرت الأسعار — أعد فتح الصفحة'
  if (message.includes('too_many_payments')) return 'محاولات كثيرة — جرّب بعد دقائق'
  if (message.includes('payments_not_configured')) return 'الدفع غير متاح الآن'
  return 'تعذّر فتح صفحة الدفع، تحقّق من اتصالك'
}
