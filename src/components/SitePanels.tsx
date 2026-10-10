import { useState } from 'react'
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
 * الشراء **عرضٌ لا بيع** بعد: الأسعار محسومة (SPEC §٩) لكنّ مسار الدفع —
 * متجرا آبل وغوغل أم الويب — بندٌ مفتوح في §١٣. فالبطاقات تعرض الحزم
 * بأسعارها المعتمدة وزرّها موقوف بـ«قريباً»، والسطر الأخير يدلّ على الطريق
 * القائم فعلاً: كود الهدية من «حسابي». حين يُحسم المسار يستبدل الزرُّ
 * الموقوف نداءَ الدفع ولا يتغيّر سواه.
 *
 * والتواصل **نموذجٌ** لا رابط بريد: `mailto:` يفتح تطبيق بريد الجهاز،
 * وأكثر اللاعبين على الجوال بلا حسابٍ مضبوط فيه — فلا الرسالة تصل ولا
 * المرسِل يعلم. النموذج يكتب في القاعدة (`send_message`) ويؤكّد فوراً.
 */

const PACKS = [
  { games: 1, price: '2.000', per: null },
  { games: 2, price: '3.500', per: '1.750' },
  { games: 5, price: '7.500', per: '1.500' },
  { games: 10, price: '13.500', per: '1.350' },
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

export function ShopPanel({ onClose }: { onClose: () => void }) {
  return (
    <Veil onClose={onClose} label="شراء الألعاب">
      <div className="sp-packs">
        {PACKS.map((p) => (
          <div key={p.games} className={'sp-pack' + (p.games === 5 ? ' hot' : '')}>
            <span className="sp-count">
              {p.games === 1 ? 'لعبة واحدة' : p.games === 2 ? 'لعبتان' : `${p.games} ألعاب`}
            </span>
            <span className="sp-price">
              {p.price} <small>د.ك</small>
            </span>
            {p.per && <span className="sp-per">اللعبة بـ {p.per}</span>}
          </div>
        ))}
      </div>
      <span className="sp-soon">الدفع يُفتح قريباً</span>
      <p className="sp-note">
        اللعبة جلسة كاملة بمراحلها الثلاث، وتُخصم عند بدئها.
        <br />
        حالياً تُضاف الألعاب بـ<b>كود هدية</b> من صفحة «حسابي».
      </p>
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
