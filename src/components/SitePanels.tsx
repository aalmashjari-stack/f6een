import { useState } from 'react'
import { isNativeApp } from '../lib/platform'
import { createPayment, paymentErrorText, type PayStatus } from '../lib/payments'
import { sendMessage } from '../lib/messages'
import { STAGES } from '../game/stages'
import { ExplainerInline } from './ExplainerVideo'
import type { CategoryInfo } from './categoryInfo'
import sitePanelsVeilCss from './SitePanels.Veil.css?inline'
import sitePanelsCategoryInfoPanelCss from './SitePanels.CategoryInfoPanel.css?inline'
import sitePanelsRulesPanelCss from './SitePanels.RulesPanel.css?inline'

/**
 * صفحات القائمة خارج اللعب: «شراء الألعاب» و«شرح اللعبة» و«تواصل معنا».
 *
 * الشراء: **على الموقع يُدفع، وفي التطبيق عرضٌ لا بيع** (SPEC §١٣ بند ٢،
 * علي ٢٦ نوفمبر ٢٠٢٦). على الموقع كلُّ باقةٍ زرٌّ يفتح صفحة ماي فاتورة؛ وفي
 * التطبيق الأصليّ تبقى البطاقات معروضةً وزرّها «قريباً» — آبل تشترط شراءها
 * للمحتوى الرقميّ داخل التطبيق، وقرارُ ذلك لم يُحسم.
 *
 * والتواصل **نموذجٌ** لا رابط بريد: `mailto:` يفتح تطبيق بريد الجهاز،
 * وأكثر اللاعبين على الجوال بلا حسابٍ مضبوط فيه — فلا الرسالة تصل ولا
 * المرسِل يعلم. النموذج يكتب في القاعدة (`send_message`) ويؤكّد فوراً.
 */

/* الخصم (علي ١٠ نوفمبر ٢٠٢٦): اللعبة الواحدة «دينار وربع»، والباقات بأرقامٍ
   مدوّرة قريبة من نسبتها نفسها (37.5٪) — 35.7٪ إلى 37.5٪، فالوسم «يصل إلى».
   was السعر قبل الخصم يُعرض مشطوباً.
   **price هو ما يُعرض، والمحاسَبُ عليه في `purchase_packs` في القاعدة** —
   `payments.test.ts` يقارن الاثنين، و`pay_create` يرفض إن اختلفا. */
const DISCOUNT = 37
export const PACKS = [
  { games: 1, was: '2.000', price: '1.250', per: null },
  { games: 2, was: '3.500', price: '2.250', per: '1.125' },
  { games: 5, was: '7.500', price: '4.750', per: '0.950' },
  { games: 10, was: '13.500', price: '8.500', per: '0.850' },
]

function Veil({
  onClose,
  label,
  children,
}: {
  onClose: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="sp-veil" onClick={onClose}>
      <div className="sp-panel" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <header className="sp-head">
          <h2 className="sp-title">{label}</h2>
          <button className="sp-x" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </header>
        {children}
      </div>

      <style>{sitePanelsVeilCss}</style>
    </div>
  )
}

/**
 * نبذة الفئة وسؤالها المثال — من علامة (i) على بطاقتها في الإعداد (طلب علي
 * ٢٤ سبتمبر ٢٠٢٦). والجواب مخفيٌّ حتى يُطلب: المثال يُقرأ على المجلس، فيحزر
 * من يحزر قبل أن يُكشف. وفئات الصور لا جواب لها هنا — سؤالُها بلا صورته
 * وصفٌ للشكل لا سؤال.
 */
export function CategoryInfoPanel({
  name,
  info,
  onClose,
}: {
  name: string
  info: CategoryInfo
  onClose: () => void
}) {
  const [shown, setShown] = useState(false)
  return (
    <Veil onClose={onClose} label={name}>
      <p className="cip-brief">{info.brief}</p>
      {info.question && (
        <div className="cip-sample">
          <span className="cip-tag">مثال</span>
          <p className="cip-q">{info.question}</p>
          {info.answer &&
            (shown ? (
              <p className="cip-a">{info.answer}</p>
            ) : (
              <button className="cip-reveal" onClick={() => setShown(true)}>
                اكشف الإجابة
              </button>
            ))}
        </div>
      )}
      <style>{sitePanelsCategoryInfoPanelCss}</style>
    </Veil>
  )
}

/**
 * شرح اللعبة — لوحةٌ تُفتح من القائمة (٣ سبتمبر ٢٠٢٦، طلب علي).
 *
 * شرحُ كلّ مرحلة هو **جملة `STAGES` نفسُها** التي في التعريف والإعداد
 * (١٧ سبتمبر ٢٠٢٦، علي: «اكتب الشرح نفسه في قائمة شرح اللعبة») — كان
 * لهذه اللوحة نصٌّ أطول من عندها، فصار المجلس يقرأ صياغتين لقاعدةٍ
 * واحدة. والأرقام في الجملة من ثوابت المحرّك لا مكتوبةً بيد، للسبب الذي
 * يشرحه `game/stages.ts`.
 */
export function RulesPanel({ onClose }: { onClose: () => void }) {
  return (
    <Veil onClose={onClose} label="شرح اللعبة">
      <p className="sp-note">
        فريقان، شاشةٌ واحدة، وشخصٌ يشغّلها كحكم. <b>ثلاث مراحل</b> بالترتيب، والنقاط تتراكم إلى الختام.
      </p>

      <div className="sp-stages">
        {STAGES.map((st, i) => (
          <article key={st.name} className="sp-stage">
            <span className="sp-sn" aria-hidden="true">
              {i + 1}
            </span>
            <div className="sp-sbody">
              <h3 className="sp-sname">{st.name}</h3>
              <p className="sp-sdesc">{st.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {/* فيديو الشرح (علي ١ أكتوبر ٢٠٢٦): خرج من الإعداد بعد الدخول — في التطبيق
          ثمّ الموقع — فمكانه هنا تحت المراحل (علي: «حطّ الفيديو تحت البطاقات»). */}
      <div className="sp-video">
        <ExplainerInline />
      </div>

      <style>{sitePanelsRulesPanelCss}</style>
    </Veil>
  )
}

/** نتيجة الرجوع من صفحة الدفع، تُعرض في رأس الصفحة. */
export type PayReturn = 'checking' | 'failed' | { status: PayStatus; games: number }

function returnText(r: PayReturn): string {
  if (r === 'checking') return 'نتحقّق من الدفع…'
  if (r === 'failed') return 'تعذّر التحقّق من الدفع الآن — سيُضاف رصيدك تلقائياً إن تمّ'
  if (r.status === 'paid')
    return `تمّ الدفع — أُضيفت ${r.games === 1 ? 'لعبة واحدة' : r.games === 2 ? 'لعبتان' : `${r.games} ألعاب`} إلى رصيدك`
  if (r.status === 'canceled') return 'لم يكتمل الدفع، ولم يُخصم شيء'
  return 'الدفع قيد المعالجة — سيُضاف رصيدك تلقائياً حين يكتمل'
}

export function ShopPanel({
  onClose,
  signedIn,
  onSignIn,
  returned,
}: {
  onClose: () => void
  signedIn: boolean
  onSignIn: () => void
  returned?: PayReturn | null
}) {
  const [busy, setBusy] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const canPay = !isNativeApp

  async function buy(games: number, amount: string) {
    if (busy !== null) return
    if (!signedIn) {
      onSignIn()
      return
    }
    setBusy(games)
    setErr(null)
    try {
      location.assign(await createPayment(games, amount))
    } catch (e) {
      setErr(paymentErrorText(e instanceof Error ? e.message : ''))
      setBusy(null)
    }
  }

  return (
    <Veil onClose={onClose} label="شراء الألعاب">
      {returned && (
        <p
          className={'sp-return' + (typeof returned === 'object' && returned.status === 'paid' ? ' ok' : '')}
          role="status"
        >
          {returnText(returned)}
        </p>
      )}
      <span className="sp-off">خصم يصل إلى {DISCOUNT}٪</span>
      <div className="sp-packs">
        {PACKS.map((p) => {
          const body = (
            <>
              <span className="sp-count">
                {p.games === 1 ? 'لعبة واحدة' : p.games === 2 ? 'لعبتان' : `${p.games} ألعاب`}
              </span>
              <span className="sp-pct">−{Math.floor((1 - +p.price / +p.was) * 100)}٪</span>
              <s className="sp-was">{p.was}</s>
              <span className="sp-price">
                {p.price} <small>د.ك</small>
              </span>
              {p.per && <span className="sp-per">اللعبة بـ {p.per}</span>}
            </>
          )
          const cls = 'sp-pack' + (p.games === 5 ? ' hot' : '')
          return canPay ? (
            <button
              key={p.games}
              type="button"
              className={cls + ' sp-buy'}
              disabled={busy !== null}
              onClick={() => buy(p.games, p.price)}
            >
              {body}
              <span className="sp-cta">{busy === p.games ? 'لحظة…' : 'اشترِ'}</span>
            </button>
          ) : (
            <div key={p.games} className={cls}>
              {body}
            </div>
          )
        })}
      </div>
      {err && (
        <p className="sp-err" role="alert">
          {err}
        </p>
      )}
      {canPay ? (
        <p className="sp-note">
          اللعبة جلسة كاملة بمراحلها الثلاث، وتُخصم عند بدئها.
          <br />
          {signedIn
            ? 'الدفع عبر ماي فاتورة: كي نت والبطاقات وApple Pay.'
            : 'سجّل دخولك أولاً ليُضاف الرصيد إلى حسابك.'}
        </p>
      ) : (
        <>
          <span className="sp-soon">الدفع يُفتح قريباً</span>
          <p className="sp-note">
            اللعبة جلسة كاملة بمراحلها الثلاث، وتُخصم عند بدئها.
            <br />
            حالياً تُضاف الألعاب بـ<b>كود هدية</b> من صفحة «حسابي».
          </p>
        </>
      )}
    </Veil>
  )
}

/** حدّ القاعدة نفسه — يُفرض هناك، ويُعرض هنا كي لا يفاجئ الكاتبَ رفضٌ متأخّر. */
const MAX_BODY = 4000

export function ContactPanel({ onClose, email }: { onClose: () => void; email?: string }) {
  const [body, setBody] = useState('')
  const [from, setFrom] = useState(email ?? '')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !body.trim()) return
    setBusy(true)
    setErr(null)
    try {
      await sendMessage(body, from)
      setSent(true)
    } catch (e2) {
      /* رسائل القاعدة تُترجم هنا: نصّها إنجليزيّ تقنيّ لا يُعرض للاعب. */
      const m = e2 instanceof Error ? e2.message : ''
      setErr(
        m.includes('too_many_messages')
          ? 'وصلتنا رسائلك — أمهلنا ساعةً قبل رسالةٍ أخرى'
          : m.includes('invalid_email')
            ? 'البريد غير صالح'
            : m.includes('not_authenticated')
              ? 'سجّل دخولك أولاً لتصلنا رسالتك'
              : 'تعذّر الإرسال، تحقّق من اتصالك',
      )
      setBusy(false)
    }
  }

  /* بعد الإرسال تُستبدل الشاشة كلّها: إبقاءُ النموذج مملوءاً يُغري بضغطةٍ
     ثانية، وهي رسالةٌ مكرّرة تُحسب على سقف الساعة. */
  if (sent) {
    return (
      <Veil onClose={onClose} label="تواصل معنا">
        <p className="sp-done">وصلتنا رسالتك</p>
        <p className="sp-note">سنقرأها ونردّ عليك على بريدك.</p>
        <button className="sp-send" onClick={onClose}>
          تمام
        </button>
      </Veil>
    )
  }

  return (
    <Veil onClose={onClose} label="تواصل معنا">
      <p className="sp-note">ملاحظة، مشكلة، أو فكرة — اكتبها وسنردّ عليك.</p>

      <form className="sp-form" onSubmit={submit}>
        <label className="sp-field">
          <span>بريدك للردّ</span>
          <input
            className="sp-in"
            type="email"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
          />
        </label>

        <label className="sp-field">
          <span>رسالتك</span>
          <textarea
            className="sp-in sp-area"
            value={body}
            maxLength={MAX_BODY}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب هنا…"
            rows={5}
            required
          />
        </label>

        {err && <p className="sp-err">{err}</p>}

        <button className="sp-send" type="submit" disabled={busy || !body.trim()}>
          {busy ? 'يُرسل…' : 'أرسل'}
        </button>
      </form>
    </Veil>
  )
}
