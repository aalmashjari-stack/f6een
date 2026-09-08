import { AUTH_CSS } from './authStyles'

/**
 * رابط التأكيد وصل ولم ينفع — منتهيَ الصلاحية، أو مستهلَكاً بضغطةٍ سابقة.
 *
 * **والنجاح لا شاشة له**: من تأكّد حسابه تُفتح جلسته فيدخل لعبته، ولا يُوقَف
 * أمام بشارةٍ يضغط عليها. والفشل وحده يحتاج قولاً وطريقاً: شاشةُ الدخول
 * وفيها «أعد إرسال رسالة التأكيد».
 */
export function ConfirmEmail({ onDone }: { onDone: () => void }) {
  return (
    <div className="screen su">
      <style>{AUTH_CSS}</style>
      <div className="su-card su-done">
        <h1 className="su-title">الرابط لم يعد صالحاً</h1>
        <p className="su-sub">
          رابط التأكيد يُفتح مرّة واحدة وتنتهي صلاحيتُه بسرعة. اطلب رسالةً
          جديدة من شاشة الدخول.
        </p>
        <button className="su-submit" onClick={onDone}>
          اذهب إلى الدخول
        </button>
      </div>
    </div>
  )
}
