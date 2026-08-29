import { useRef, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { STAGES } from '../game/stages'
import { signInWithGoogle } from '../lib/auth'

/**
 * شاشة التعريف — تلي شاشة الشعار.
 *
 * لوحان فوق بعضهما في ممرّ واحد يُمرَّر: الشرح، ثم الدخول. زرّ «تسجيل الدخول»
 * لا ينقل إلى شاشة أخرى بل ينزل باللوح الثاني إلى مكانه (قرار علي ٢٦ أغسطس
 * ٢٠٢٦) — فيبقى الشرح خلفه يُرجَع إليه بالتمرير لا بزرّ رجوع.
 *
 * وهي بذلك ثاني شاشة تُمرَّر بعد الإعداد، خارج قاعدة «الشاشة لقطة واحدة»
 * (SPEC القسم ١٢) — استثناء مقصود لا سهو.
 *
 * ألوانها من رموز «نيو» (--n-*) لا من theme.css: الهويّة ثُبِّتت في ٢٧ أغسطس
 * ٢٠٢٦، وشاشة جديدة تُبنى عليها مباشرةً لا تُبنى على القديم ثم تُصحَّح.
 *
 * الشرح مصدره `game/stages.ts` نفسه الذي يغذّي الإعداد، فأرقام التنقيط تتبع
 * ثوابت المحرّك ولا تُكتب هنا بيد.
 *
 * **غوغل يعمل فعلاً** عبر Supabase. وApple والبريد معطّلان بسببين مختلفين:
 * آبل تحتاج حساب مطوّر مدفوعاً لم يُسجَّل بعد، والبريد يحتاج شاشة إدخال
 * ورمز تحقّق لم تُصمَّم. زرٌّ معطّل بسبب مكتوب خيرٌ من زرٍّ يعد بما لا يفي.
 *
 * ولم يعد هنا طريق إلى اللعبة بلا حساب: هذا ما يشترطه SPEC القسم ٩
 * (التسجيل إجباريّ)، وما قرّره علي بحذف زرّ «ابدأ».
 */
export function Intro({ onDone }: { onDone?: () => void }) {
  const signinRef = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState(false)
  /* رجوعٌ فاشل من غوغل يحمل سببه في العنوان. بدون قراءته يجد اللاعب نفسه
     في شاشة التعريف ثانيةً بلا كلمة تفسّر — فيظنّ الزرّ معطّلاً. */
  const [err, setErr] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const q = new URLSearchParams(window.location.search)
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const code = q.get('error') ?? h.get('error')
    if (!code) return null
    const why = q.get('error_description') ?? h.get('error_description')
    return why ? decodeURIComponent(why.replace(/\+/g, ' ')) : code
  })

  async function google() {
    setErr(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      /* لا إفراغ لـbusy عند النجاح: الصفحة تغادر إلى غوغل، وإعادته تُظهر
         الزرّ نشطاً للحظة قبل أن تختفي الشاشة. */
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذّر فتح دخول غوغل')
      setBusy(false)
    }
  }

  return (
    <div className="screen intro">
      {/* اللوح الأول — الشرح */}
      <section className="intro-pane">
        <header className="intro-head">
          <BrandLogo className="intro-logo" />
          <p className="intro-tag">شاشة واحدة · فريقان · ثلاث مراحل</p>
        </header>

        <ol className="intro-stages">
          {STAGES.map((s, i) => (
            <li key={s.name} className="intro-stage">
              <span className="intro-no" aria-hidden="true">{i + 1}</span>
              <div>
                <h2 className="intro-name">{s.name}</h2>
                <p className="intro-desc">{s.desc}</p>
              </div>
              <span className="intro-points">{s.points}</span>
            </li>
          ))}
        </ol>

        <button
          className="intro-go"
          onClick={() => signinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          تسجيل الدخول
        </button>
      </section>

      {/* اللوح الثاني — الدخول */}
      <section className="intro-pane signin" ref={signinRef}>
        <h2 className="signin-title">تسجيل الدخول</h2>
        <p className="signin-sub">حسابك يحفظ رصيدك، ولا يعيد عليك سؤالاً سمعته</p>

        {onDone ? (
          /* الدخول موقوف: زرٌّ واحد يمرّ منه، ولا تُعرض أزرار مزوّدين لا تعمل.
             زرٌّ يعد بما لا يفي أسوأ من زرٍّ غائب. */
          <div className="signin-methods">
            <button className="method go-now" onClick={onDone}>ابدأ</button>
            <p className="signin-note">الدخول موقوف مؤقّتاً</p>
          </div>
        ) : (
          <div className="signin-methods">
            <button
              className="method apple"
              disabled
              title="يحتاج حساب مطوّر آبل — لم يُسجَّل بعد"
            >
              المتابعة عبر Apple
            </button>

            <button className="method google" onClick={google} disabled={busy}>
              {busy ? 'جارٍ التحويل…' : 'المتابعة عبر Google'}
            </button>

            <button className="method mail" disabled title="قريباً">
              المتابعة بالبريد
            </button>
          </div>
        )}

        {err && <p className="signin-err">{err}</p>}
      </section>

      <style>{`
        /* ممرٌّ يُمرَّر رأسياً بلوحين، كلٌّ منهما بملء الشاشة ويستقرّ عندها.
           البادئة "body .screen" ضرورية لا زينة: theme.css يضبط عليها
           overflow:hidden بوزن (0,2,0)، و".intro" وحدها (0,1,0) تخسر أمامه —
           وهذا ما يفعله الإعداد بـ"body .screen.setup". */
        body .screen.intro {
          overflow-y:auto;
          scroll-snap-type:y mandatory;
          scroll-behavior:smooth;
        }
        .intro-pane {
          min-height:100%;
          scroll-snap-align:start;
          display:flex; flex-direction:column; justify-content:center;
          gap:clamp(10px,2.2vh,26px);
          padding:clamp(12px,3vh,32px) clamp(14px,4vw,48px);
          position:relative;
        }

        .intro-head { text-align:center; }
        .intro-logo { font-size:clamp(34px,7vw,68px); }
        .intro-tag {
          margin:clamp(4px,1vh,10px) 0 0;
          color:var(--n-ink-2); font-weight:700;
          font-size:clamp(12px,1.7vw,18px);
        }

        .intro-stages {
          list-style:none; margin:0; padding:0;
          display:flex; flex-direction:column; gap:clamp(6px,1.4vh,14px);
          max-width:820px; width:100%; margin-inline:auto;
        }
        /* صفٌّ واحد لكل مرحلة: الرقم، ثم الاسم والشرح، ثم التنقيط في الطرف.
           رأسيّاً لا شبكةً أفقيّة — القراءة هنا تعليمية تُقرأ بالترتيب. */
        .intro-stage {
          display:grid; grid-template-columns:auto 1fr auto; align-items:center;
          gap:clamp(8px,1.6vw,18px);
          background:var(--n-surface); border-radius:var(--n-r2);
          box-shadow:var(--n-e1);
          padding:clamp(8px,1.5vh,16px) clamp(10px,2vw,20px);
        }
        .intro-no {
          font-weight:800; color:var(--n-brand);
          font-size:clamp(20px,3.4vw,34px); line-height:1;
          min-width:1.2em; text-align:center;
        }
        .intro-name { margin:0; font-size:clamp(14px,2.1vw,22px); font-weight:800; }
        .intro-desc {
          margin:2px 0 0; color:var(--n-ink-2); font-weight:600;
          font-size:clamp(11px,1.5vw,16px); line-height:1.5;
        }
        .intro-points {
          font-weight:800; color:var(--n-a); white-space:nowrap;
          font-size:clamp(12px,1.7vw,18px);
        }

        .intro-go {
          font:inherit; font-weight:800; cursor:pointer; border:none;
          border-radius:var(--n-r3);
          background:var(--n-ink); color:#fff; box-shadow:var(--n-e2);
          padding:clamp(10px,1.8vh,18px) clamp(16px,3vw,34px);
          font-size:clamp(14px,2vw,22px);
          max-width:820px; width:100%; margin-inline:auto;
          transition:transform .15s var(--ease-spring);
        }
        .intro-go:hover { background:#26262F; transform:translateY(-2px); box-shadow:var(--n-e3); }
        .intro-go:active { transform:translateY(0) scale(.99); box-shadow:var(--n-e1); }

        .signin { justify-content:center; text-align:center; }
        .signin-title { margin:0; font-size:clamp(20px,3.6vw,36px); font-weight:800; color:var(--n-brand); }
        .signin-sub {
          margin:0; color:var(--n-ink-2); font-weight:600;
          font-size:clamp(12px,1.7vw,18px);
        }
        .signin-methods {
          display:flex; flex-direction:column; gap:clamp(8px,1.6vh,14px);
          max-width:480px; width:100%; margin-inline:auto;
        }
        .method {
          font:inherit; font-weight:800; cursor:pointer;
          border-radius:var(--n-r2);
          padding:clamp(10px,1.8vh,16px) clamp(14px,2.6vw,24px);
          font-size:clamp(13px,1.9vw,19px);
          border:0; box-shadow:var(--n-e1);
          background:var(--n-surface); color:var(--n-ink);
          transition:transform .15s var(--ease-spring), border-color .2s ease;
        }
        .method:active { transform:scale(.98); }
        .method:not(:disabled):hover { background:var(--n-surface-2); box-shadow:var(--n-e2); }
        .method:disabled {
          background:rgba(23,23,31,.05); color:var(--n-ink-3);
          box-shadow:none; cursor:not-allowed;
        }
        .method.go-now { background:var(--n-ink); color:#fff; box-shadow:var(--n-e2); }
        .method.go-now:not(:disabled):hover { background:#26262F; box-shadow:var(--n-e3); }
        .signin-note {
          margin:0; color:var(--n-ink-3); font-weight:700;
          font-size:clamp(11px,1.5vw,15px);
        }
        .signin-err {
          margin:0; color:var(--n-bad); font-weight:700;
          font-size:clamp(12px,1.6vw,16px);
        }

        /* الجوال الأفقي قصير (ارتفاعه ٤٤٠px) — والشرح هو سبب اللوح الأول،
           فلا يُخفى. ينكمش الشعار والحشو بدله. */
        @media (max-height:460px) {
          .intro-logo { font-size:clamp(26px,5vw,40px); }
          .intro-stage { padding-block:clamp(5px,1vh,10px); }
          .intro-desc { font-size:clamp(10px,1.35vw,14px); }
          /* الحشو والفجوات تنكمش أيضاً — بدونها يفيض اللوح فيُقصّ الشعار. */
          .intro-pane { gap:clamp(6px,1.2vh,12px); padding-block:clamp(8px,1.4vh,14px); }
          .intro-tag { font-size:clamp(11px,1.5vw,15px); }
        }
      `}</style>
    </div>
  )
}
