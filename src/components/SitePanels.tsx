/**
 * صفحتا القائمة خارج اللعب: «شراء الألعاب» و«تواصل معنا» (١ سبتمبر ٢٠٢٦).
 *
 * الشراء **عرضٌ لا بيع** بعد: الأسعار محسومة (SPEC §٩) لكنّ مسار الدفع —
 * متجرا آبل وغوغل أم الويب — بندٌ مفتوح في §١٣. فالبطاقات تعرض الحزم
 * بأسعارها المعتمدة وزرّها موقوف بـ«قريباً»، والسطر الأخير يدلّ على الطريق
 * القائم فعلاً: كود الهدية من «حسابي». حين يُحسم المسار يستبدل الزرُّ
 * الموقوف نداءَ الدفع ولا يتغيّر سواه.
 *
 * والتواصل بريدٌ واحد هو الموجود فعلاً على النطاق (privacy@ — أُنشئ لصفحة
 * الخصوصية). حين يُنشأ صندوق دعمٍ مستقلّ يتبدّل سطرٌ واحد هنا.
 */

const PACKS = [
  { games: 1, price: '2.000', per: null },
  { games: 2, price: '3.500', per: '1.750' },
  { games: 5, price: '7.500', per: '1.500' },
  { games: 10, price: '13.500', per: '1.350' },
]

const CONTACT_EMAIL = 'privacy@f6een.com'

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

        .sp-mail {
          align-self:center;
          display:inline-block;
          padding:10px 22px; border-radius:14px;
          background:var(--n-brand, #E8542F); color:#fff;
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 4px 5px 0 var(--n-ink, #22201C);
          font-weight:800; font-size:clamp(14px,1.8vw,17px);
          text-decoration:none; direction:ltr;
        }
      `}</style>
    </div>
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

export function ContactPanel({ onClose }: { onClose: () => void }) {
  return (
    <Veil onClose={onClose} label="تواصل معنا">
      <p className="sp-note">
        ملاحظة، مشكلة، أو فكرة — راسلنا وسنردّ عليك:
      </p>
      <a className="sp-mail" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </Veil>
  )
}
