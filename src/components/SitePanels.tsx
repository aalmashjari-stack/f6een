import { useState } from 'react'
import { sendMessage } from '../lib/messages'
import { STAGES } from '../game/stages'
import {
  STAGE1_CONSULT_MS,
  STAGE1_LEVEL_POINTS,
  STAGE1_QUESTIONS,
  STAGE1_TEAM_CATEGORIES,
  STAGE2_TIMER_MS,
  STAGE3_TIMER_MS,
} from '../game/session'

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


function Veil({ onClose, label, children }: { onClose: () => void; label: string; children: React.ReactNode }) {
  return (
    <div className="sp-veil" onClick={onClose}>
      <div className="sp-panel" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <header className="sp-head">
          <h2 className="sp-title">{label}</h2>
          <button className="sp-x" onClick={onClose} aria-label="إغلاق">✕</button>
        </header>
        {children}
      </div>

      <style>{`
        .sp-veil {
          position:fixed; inset:0; z-index:60;
          display:flex; align-items:center; justify-content:center;
          padding:clamp(8px,2vh,24px);
          background:rgba(20,16,10,.5);
        }
        .sp-panel {
          width:min(680px, 100%);
          max-height:min(92vh, 640px);
          overflow:auto;
          display:flex; flex-direction:column; gap:clamp(10px,2vh,18px);
          padding:clamp(14px,2.6vh,24px) clamp(16px,3vw,28px);
          border-radius:22px;
          background:var(--n-surface, #fff);
          box-shadow:0 0 0 3px var(--n-ink, #22201C), 7px 8px 0 var(--n-ink, #22201C);
        }
        .sp-head { display:flex; align-items:center; justify-content:space-between; }
        .sp-title { margin:0; font-size:clamp(18px,2.4vw,24px); font-weight:800; color:var(--n-ink, #22201C); }
        .sp-x {
          font:inherit; font-weight:800; cursor:pointer;
          width:34px; height:34px; border:0; border-radius:50%;
          background:var(--n-bg, #FFF8EE); color:var(--n-ink, #22201C);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
        }

        .sp-packs { display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:clamp(8px,1.4vw,14px); }
        .sp-pack {
          display:flex; flex-direction:column; align-items:center; gap:2px;
          padding:clamp(10px,1.8vh,16px) 8px;
          border-radius:16px;
          background:var(--n-bg, #FFF8EE);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
          text-align:center;
        }
        /* حزمة الخمس هي المعروضة للدفع الأمثل — تلبس الأصفر لتُقرأ أولاً */
        .sp-pack.hot { background:var(--n-a-tint, #FFCE3C); box-shadow:0 0 0 2.5px var(--n-ink,#22201C), 4px 5px 0 var(--n-ink,#22201C); }
        .sp-count { font-weight:800; font-size:clamp(14px,1.7vw,18px); color:var(--n-ink, #22201C); }
        .sp-price { font-weight:800; font-size:clamp(20px,2.6vw,28px); color:var(--n-brand, #E8542F); direction:ltr; }
        .sp-price small { font-size:.5em; font-weight:700; color:var(--n-ink-2, #57524A); }
        .sp-per { font-size:clamp(10px,1.2vw,12px); font-weight:700; color:var(--n-ink-2, #57524A); }

        .sp-soon {
          align-self:center;
          padding:6px 18px; border-radius:999px;
          background:var(--n-ink, #22201C); color:#fff;
          font-weight:800; font-size:clamp(12px,1.5vw,15px);
          opacity:.85;
        }
        .sp-note { margin:0; text-align:center; font-size:clamp(12px,1.5vw,14px); font-weight:700; color:var(--n-ink-2, #57524A); line-height:1.8; }
        .sp-note b { color:var(--n-ink, #22201C); }

        .sp-form { display:flex; flex-direction:column; gap:clamp(8px,1.6vh,14px); }
        .sp-field { display:flex; flex-direction:column; gap:5px; }
        .sp-field > span { font-weight:800; font-size:clamp(12px,1.4vw,14px); color:var(--n-ink-2, #57524A); }
        .sp-in {
          font:inherit; font-weight:700; font-size:clamp(13px,1.5vw,16px);
          padding:10px 14px; border:0; border-radius:12px;
          background:var(--n-bg, #FFF8EE); color:var(--n-ink, #22201C);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
        }
        .sp-in::placeholder { color:var(--n-ink-3, #8A8578); font-weight:600; }
        .sp-in:focus { outline:none; box-shadow:0 0 0 2.5px var(--n-brand, #E8542F); background:#fff; }
        .sp-area { resize:vertical; min-height:110px; line-height:1.7; }
        .sp-send {
          align-self:center;
          font:inherit; font-weight:800; font-size:clamp(14px,1.8vw,17px); cursor:pointer;
          padding:10px 34px; border:0; border-radius:14px;
          background:var(--n-brand, #E8542F); color:#fff;
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 4px 5px 0 var(--n-ink, #22201C);
          transition:transform .14s var(--ease-spring), box-shadow .14s ease;
        }
        .sp-send:active:not(:disabled) { transform:translate(2px,3px); box-shadow:0 0 0 2.5px var(--n-ink,#22201C); }
        .sp-send:disabled { background:var(--spent, #F0E9DB); color:var(--spent-text, #A39C8D); box-shadow:0 0 0 2px var(--n-ink,#22201C); cursor:default; }
        .sp-err { margin:0; text-align:center; font-weight:800; font-size:clamp(12px,1.5vw,14px); color:var(--n-bad, #CE2F1E); }
        .sp-done { margin:0; text-align:center; font-weight:800; font-size:clamp(18px,2.4vw,24px); color:var(--n-good, #1D9E5F); }

        /* الجوال الأفقيّ: حقل النصّ ذو الارتفاع الثابت كان يدفع زرَّ «أرسل»
           خارج اللوحة فيُقصّ — والزرّ هو الغرض كلّه. يتنازل الحقل عن
           ارتفاعه ويرقّ الحشو، فيبقى الزرّ ظاهراً بلا تمرير. */
        @media (max-height: 480px) {
          .sp-panel { gap:8px; padding:10px clamp(14px,2.6vw,22px); }
          .sp-form { gap:7px; }
          .sp-area { min-height:0; height:clamp(52px, 15vh, 88px); }
          .sp-note { line-height:1.5; }
          .sp-send { padding:8px 30px; }
        }
      `}</style>
    </div>
  )
}

/**
 * شرح اللعبة — لوحةٌ تُفتح من القائمة (٣ سبتمبر ٢٠٢٦، طلب علي).
 *
 * **أرقامُها من ثوابت المحرّك لا مكتوبةً بيد**، للسبب الذي يشرحه
 * `game/stages.ts`: نسختان من التنقيط تفترقان بصمت أوّل ما يتغيّر رقم،
 * فيقرأ المجلسُ قاعدةً ويلعب أخرى. ولهذا `STAGES` تُعاد استعمالاً هنا
 * بدل نسخها — الاسم والوصف والنقاط تأتي منها كما تأتي إلى شاشة الإعداد.
 *
 * والشرحُ سطرٌ أو سطران لكل مرحلة لا نصُّ SPEC كاملاً: من يفتح هذه الصفحة
 * يريد أن يلحق باللعب لا أن يقرأ مستنداً.
 */
export function RulesPanel({ onClose }: { onClose: () => void }) {
  const s1 = `${STAGE1_CONSULT_MS / 1000}`
  const extra = [
    `كل فريق يختار ${STAGE1_TEAM_CATEGORIES} فئات في الإعداد، فيصير اللوح ${STAGE1_QUESTIONS} سؤالاً. صاحبُ الدور يختار الخليّة والحكم يضغطها، ثم يتشاور الفريقان ${s1} ثانية — والنقاط تتبع المستوى: ${STAGE1_LEVEL_POINTS['سهل']} · ${STAGE1_LEVEL_POINTS['متوسط']} · ${STAGE1_LEVEL_POINTS['صعب']}.`,
    `لاعبٌ من كل فريق وجهاً لوجه، ${STAGE2_TIMER_MS / 1000} ثانية مشتركة بينهما. لا تشاور إطلاقاً — ومن بادر بالإجابة أولاً هو صاحب الجولة وحده: يربح إن أصاب ويخسر إن أخطأ، ولا يرثها خصمه.`,
    `كل فريق وحده أمام الساعة ${STAGE3_TIMER_MS / 1000} ثانية لا تتوقّف — الكشفُ والحكمُ يُحسبان منها. أسئلةٌ متتابعة، والمجموع مفتوح.`,
  ]

  return (
    <Veil onClose={onClose} label="شرح اللعبة">
      <p className="sp-note">
        فريقان، شاشةٌ واحدة، وشخصٌ يشغّلها كحكم. <b>ثلاث مراحل</b> بالترتيب،
        والنقاط تتراكم إلى الختام.
      </p>

      <div className="sp-stages">
        {STAGES.map((st, i) => (
          <article key={st.name} className="sp-stage">
            <span className="sp-sn" aria-hidden="true">{i + 1}</span>
            <div className="sp-sbody">
              <h3 className="sp-sname">{st.name}</h3>
              <span className="sp-spts">{st.points}</span>
              <p className="sp-sdesc">{extra[i]}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="sp-note">
        <b>الحكم لا يعرف الإجابة</b> — تُكشف للجميع في اللحظة نفسها. ولا إعادة
        سحبٍ ولا تخطّي سؤال: السحبة نهائية.
      </p>

      <style>{`
        .sp-stages { display:flex; flex-direction:column; gap:clamp(8px,1.6vh,14px); }
        .sp-stage {
          display:flex; align-items:flex-start; gap:clamp(9px,1.6vw,15px);
          padding:clamp(10px,1.8vh,16px) clamp(11px,2vw,18px);
          border-radius:16px;
          background:var(--n-bg, #FFF8EE);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
        }
        .sp-sn {
          flex:none;
          display:grid; place-items:center;
          width:clamp(26px,3.4vw,34px); height:clamp(26px,3.4vw,34px);
          border-radius:50%;
          background:var(--n-brand, #E8542F); color:#fff;
          font-weight:900; font-size:clamp(13px,1.7vw,17px);
        }
        .sp-sbody { min-width:0; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 10px; }
        .sp-sname { margin:0; font-size:clamp(15px,2vw,19px); font-weight:800; color:var(--n-ink, #22201C); }
        /* النقاط رقاقةٌ لا سطر: هي أوّل ما تبحث عنه العينُ في شرح لعبة */
        .sp-spts {
          font-size:clamp(11px,1.4vw,14px); font-weight:800;
          padding:.14em .7em; border-radius:999px;
          background:var(--n-brand-tint, #FFE3D6); color:var(--n-brand, #E8542F);
        }
        .sp-sdesc {
          flex:1 0 100%; margin:0;
          font-size:clamp(12px,1.5vw,15px); font-weight:600; line-height:1.65;
          color:var(--n-ink-2, #57524A);
        }
        @media (max-height: 480px) {
          .sp-stage { padding:7px 10px; gap:8px; }
          .sp-sdesc { line-height:1.45; }
          .sp-stages { gap:6px; }
        }
      `}</style>
    </Veil>
  )
}

export function ShopPanel({ onClose }: { onClose: () => void }) {
  return (
    <Veil onClose={onClose} label="شراء الألعاب">
      <div className="sp-packs">
        {PACKS.map((p) => (
          <div key={p.games} className={'sp-pack' + (p.games === 5 ? ' hot' : '')}>
            <span className="sp-count">{p.games === 1 ? 'لعبة واحدة' : p.games === 2 ? 'لعبتان' : `${p.games} ألعاب`}</span>
            <span className="sp-price">{p.price} <small>د.ك</small></span>
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
        <button className="sp-send" onClick={onClose}>تمام</button>
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
