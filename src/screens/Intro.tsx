import { useRef, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { STAGES } from '../game/stages'
import { authErrorText, signInWithGoogle } from '../lib/auth'
import { isNativeApp } from '../lib/platform'
import { SignUp } from './SignUp'
import { ExplainerInline } from '../components/ExplainerVideo'
import welcomeCats from '../../assets/backgrounds/welcome-cats.jpg'

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
 * ورمز تحقّق. والبريد صار يفتح شاشة `SignUp` (طلب علي ٢٧ أغسطس ٢٠٢٦)،
 * وبقيت آبل معطّلةً بسبب مكتوب — زرٌّ معطّل بسبب خيرٌ من زرٍّ يعد بما لا يفي.
 *
 * ولم يعد هنا طريق إلى اللعبة بلا حساب: هذا ما يشترطه SPEC القسم ٩
 * (التسجيل إجباريّ)، وما قرّره علي بحذف زرّ «ابدأ».
 */
export function Intro({ onDone }: { onDone?: () => void }) {
  const signinRef = useRef<HTMLElement>(null)
  const [openStage, setOpenStage] = useState<number | null>(null)
  /* قبل أيّ رجوعٍ مبكّر: خطّافٌ بعد `if (email) return` يُسقط الشاشة كلّها. */
  const [signinPage, setSigninPage] = useState(false)
  const [email, setEmail] = useState<false | 'signup' | 'signin'>(false)
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
    if (!why) return code
    /* `URLSearchParams` فكّ الترميز أصلاً؛ فكٌّ ثانٍ يلتقط ما بقي مرمَّزاً
       مرّتين، ويرمي على `%` عاريةٍ في نصٍّ فُكّ فعلاً — ورميةٌ هنا داخل
       مُهيّئ الحالة تُسقط شاشة التعريف كلّها. */
    try {
      return decodeURIComponent(why.replace(/\+/g, ' '))
    } catch {
      return why
    }
  })

  async function google() {
    setErr(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      /* لا إفراغ لـbusy عند النجاح: الصفحة تغادر إلى غوغل، وإعادته تُظهر
         الزرّ نشطاً للحظة قبل أن تختفي الشاشة. لكنّ المغادرة قد لا تقع
         (الويب: الوعد يُحلّ قبل التحويل، والتحويل يفشل بلا شبكة) — فبعد
         عشر ثوانٍ وما زلنا هنا يعود الزرّ، وإلّا بقي الوحيدُ في الشاشة مطفأً. */
      window.setTimeout(() => setBusy(false), 10_000)
    } catch (e) {
      setErr(authErrorText(e, 'تعذّر فتح دخول غوغل'))
      setBusy(false)
    }
  }

  if (email) return <SignUp initialMode={email} onBack={() => setEmail(false)} />

  /* التطبيق: الدخول صفحةٌ مستقلّة لا نزولٌ إلى لوحٍ تحت (علي ١ أكتوبر ٢٠٢٦).
     الموقع على حاله: ينزل إلى اللوح الثاني. */
  const toSignin = () =>
    isNativeApp
      ? setSigninPage(true)
      : signinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className={'screen intro' + (isNativeApp ? ' native' : '') + (signinPage ? ' signin-open' : '')}>
      {/* التطبيق: رأسُ كتلةٍ بدل صفحة الدخول القديمة — الشعار و«تسجيل الدخول»
          (علي ١ أكتوبر ٢٠٢٦، على مثالٍ أرسله بألوان فطين). الموقع لا يُمسّ. */}
      {isNativeApp && !signinPage && (
        <header className="welcome-bar">
          <BrandLogo className="welcome-logo" />
          <button className="welcome-login" onClick={toSignin}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
              <path d="M3 12h11M10 8l4 4-4 4" />
            </svg>
            تسجيل الدخول
          </button>
        </header>
      )}
      {/* اللوح الأول — الشرح */}
      <section className="intro-pane">
        <header className="intro-head">
          <BrandLogo className="intro-logo" />
          <p className="intro-tag">شاشة واحدة · فريقان · ثلاث مراحل</p>
        </header>

        {/* التطبيق: كتلةٌ واحدة بنصّ الموقع، والمراحل كبسولاتٍ فوق بعض، ثمّ
            الفيديو وزرّ التسجيل (علي ١ أكتوبر ٢٠٢٦). النصوص نصوصه. */}
        {isNativeApp && (
          <section className="welcome-box" style={{ ['--welcome-cats' as string]: `url(${welcomeCats})` }}>
            {/* «فطين» المكتوبة سقطت (علي ١ أكتوبر ٢٠٢٦): الشعار في الرأس فوقها. */}
            {/* الجملة نفسها حرفاً، مقسومةً عند معناها: ما هي، ثمّ ما تفعله. */}
            <p className="welcome-line">
              <span className="welcome-what">لعبة ثقافية اجتماعية</span>
              <span className="welcome-why">هدفها تخلي جمعاتكم اونس و تتكون من 3 مراحل</span>
            </p>
            <div className="welcome-stages">
              {STAGES.map((st, i) => {
                const open = openStage === i
                return (
                  <article key={st.name} className={'w-stage tone-' + i + (open ? ' open' : '')}>
                    <button className="w-stage-head" onClick={() => setOpenStage(open ? null : i)} aria-expanded={open}>
                      <span className="w-stage-no" aria-hidden="true">{i + 1}</span>
                      <h2 className="w-stage-name">{st.name}</h2>
                      <span className="w-stage-info" aria-label={open ? 'أخفِ الشرح' : 'اعرض الشرح'}>i</span>
                    </button>
                    {open && <p className="w-stage-desc">{st.desc}</p>}
                  </article>
                )
              })}
            </div>
            <p className="welcome-video-line"><span aria-hidden="true">▶</span> شوف الفيديو عشان تفهم اللعبة</p>
            <ExplainerInline />
            <button className="welcome-cta" onClick={toSignin}>سجل و احصل على لعبة مجانية</button>
          </section>
        )}

        <ol className="intro-stages">
          {STAGES.map((s, i) => (
            <li key={s.name} className="intro-stage">
              <span className="intro-no" aria-hidden="true">{i + 1}</span>
              <div>
                <h2 className="intro-name">{s.name}</h2>
                <p className="intro-desc">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <button className="intro-go" onClick={toSignin}>
          تسجيل الدخول
        </button>
      </section>

      {/* اللوح الثاني — الدخول */}
      <section className="intro-pane signin" ref={signinRef}>
        {/* صفحة الدخول في التطبيق بلا رأس: الشعار كبيراً فوقها (علي ١ أكتوبر ٢٠٢٦). */}
        {isNativeApp && <BrandLogo className="signin-logo" />}
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
              {/* التطبيق: «سجل دخولك عبر…» (علي ١ أكتوبر ٢٠٢٦)؛ الموقع على «المتابعة». */}
              {isNativeApp ? 'سجل دخولك عبر Apple' : 'المتابعة عبر Apple'}
            </button>

            <button className="method google" onClick={google} disabled={busy}>
              {/* الشعار لا الكلمة (طلب علي ٢٧ سبتمبر ٢٠٢٦): حرف G بألوانه
                  الأربعة كما في إرشادات غوغل، والاسم في aria-label. */}
              {busy ? 'جارٍ التحويل…' : (
                <>
                  {isNativeApp ? 'سجل دخولك عبر' : 'المتابعة عبر'}
                  <svg className="g-logo" viewBox="0 0 48 48" role="img" aria-label="Google">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </>
              )}
            </button>

            <button className="method mail" onClick={() => setEmail(isNativeApp ? 'signin' : 'signup')}>
              {isNativeApp ? 'سجل دخولك عبر البريد' : 'المتابعة بالبريد'}
            </button>
          </div>
        )}

        {/* التطبيق: الأزرار «سجل دخولك»، فمن لا حساب له يجد طريقه تحتها. وغوغل
            يُنشئ الحساب بأوّل دخول، فالتسجيل هنا للبريد. */}
        {isNativeApp && !onDone && (
          <button className="signin-first" onClick={() => setEmail('signup')}>
            أول مرة؟ <u>اضغط هنا للتسجيل</u>
          </button>
        )}
        {err && <p className="signin-err">{err}</p>}
        {/* والرجوع تحت الأزرار لا في رأسٍ سقط. */}
        {isNativeApp && (
          <button className="welcome-back" onClick={() => setSigninPage(false)}>→ رجوع</button>
        )}
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
          /* ارتفاعٌ صريح لا flex:1 وحده: نسبةُ اللوح (min-height:100%) لا
             تُحسب إلا على ارتفاعٍ محدَّد، وبدونها يتكدّس اللوحان صفحةً واحدة
             على الشاشة الطويلة — زرّ «تسجيل الدخول» وتحته عنوانُه مباشرة
             (قِيس على 402×874: اللوح 476px لا 834). */
          height:100%;
        }
        /* التوسيط بهامشٍ تلقائيّ لا بـjustify-content:center: حين يطول اللوح
           عن الشاشة (سفاري الأفقيّ، 292 بكسلاً) يقصّ التوسيطُ الفلكسيّ أوّلَه
           فيختفي الشعار فوق الحافّة ولا يبلغه تمرير. والهامش التلقائيّ يوسّط
           حين يتّسع المكان ويبدأ من الأعلى حين يضيق. */
        .intro-pane {
          min-height:100%;
          scroll-snap-align:start;
          display:flex; flex-direction:column; justify-content:flex-start;
          gap:clamp(10px,2.2dvh,26px);
          padding:clamp(12px,3dvh,32px) clamp(14px,4vw,48px);
          position:relative;
        }

        .intro-pane > :first-child { margin-top:auto; }
        .intro-pane > :last-child { margin-bottom:auto; }
        .intro-head { text-align:center; }
        .intro-logo { font-size:clamp(34px,7vw,68px); }
        .intro-tag {
          margin:clamp(4px,1dvh,10px) 0 0;
          color:var(--n-ink-2); font-weight:700;
          font-size:clamp(12px,1.7vw,18px);
        }

        .intro-stages {
          list-style:none; margin:0; padding:0;
          display:flex; flex-direction:column; gap:clamp(6px,1.4dvh,14px);
          max-width:820px; width:100%; margin-inline:auto;
        }
        /* صفٌّ واحد لكل مرحلة: الرقم، ثم الاسم والشرح. رأسيّاً لا شبكةً
           أفقيّة — القراءة هنا تعليمية تُقرأ بالترتيب. عمود التنقيط في الطرف
           سقط في ١٧ سبتمبر ٢٠٢٦ (علي: «شيل سطر النقاط») بعد أن صارت الأرقام
           داخل شرح المرحلة نفسه. */
        .intro-stage {
          display:grid; grid-template-columns:auto 1fr; align-items:center;
          gap:clamp(8px,1.6vw,18px);
          background:var(--n-surface); border-radius:var(--n-r2);
          box-shadow:var(--n-e1);
          padding:clamp(8px,1.5dvh,16px) clamp(10px,2vw,20px);
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

        .intro-go {
          font:inherit; font-weight:800; cursor:pointer; border:none;
          border-radius:var(--n-r3);
          background:var(--n-ink); color:#fff; box-shadow:var(--n-e2);
          padding:clamp(10px,1.8dvh,18px) clamp(16px,3vw,34px);
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
          display:flex; flex-direction:column; gap:clamp(8px,1.6dvh,14px);
          max-width:480px; width:100%; margin-inline:auto;
        }
        .method {
          font:inherit; font-weight:800; cursor:pointer;
          border-radius:var(--n-r2);
          padding:clamp(10px,1.8dvh,16px) clamp(14px,2.6vw,24px);
          font-size:clamp(13px,1.9vw,19px);
          border:0; box-shadow:var(--n-e1);
          background:var(--n-surface); color:var(--n-ink);
          transition:transform .15s var(--ease-spring), border-color .2s ease;
        }
        .method.google { display:flex; align-items:center; justify-content:center; gap:.5em; }
        .g-logo { width:1.3em; height:1.3em; flex:none; }
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

        /* ─── التطبيق: الرأس ─── مستطيل الإعداد الأبيض نفسه بظلّه الناعم (علي ١
           أكتوبر ٢٠٢٦: «الخلفيّة البيضاء لا تغيّرها، الصورة مثال») — الشعار
           يميناً و«تسجيل الدخول» برتقاليّاً في الطرف الآخر مكانَ ☰. لاصقٌ في
           الأعلى: الممرّ يستقرّ على لوحيه (scroll-snap)، ورأسٌ لا يلصق يُمرَّر
           من فوقه فلا يُرى (قِيس في المحاكي). */
        .welcome-bar {
          position:sticky; top:0; z-index:5; flex:none;
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          margin:0 16px; padding:12px 4px;
          /* بلا كونتينر: على الخلفيّة نفسها (علي ١ أكتوبر ٢٠٢٦: «شيل كونتينر
             البانر»). لونُها لا شفافيّة: لاصقٌ يمرّ تحته المحتوى عند التمرير. */
          background:var(--n-bg, #F6F5F2);
          border-bottom:1.5px solid rgba(34,32,28,.14); /* خطٌّ رماديّ خفيف بين الشعار والكونتينر (علي ١ أكتوبر ٢٠٢٦) */
        }
        .welcome-logo { font-size:clamp(33px,9vw,38px); }
        .welcome-login {
          display:flex; align-items:center; gap:8px; height:40px;
          font:inherit; font-weight:800; font-size:15px; cursor:pointer;
          padding:0 16px; border:0; border-radius:999px;
          background:var(--n-brand, #E8542F); color:#fff;
        }
        .welcome-login svg { width:19px; height:19px; display:block; }
        .welcome-login:active { transform:scale(.97); }
        /* في التطبيق الرأسُ يقول الاسم ويدعو إلى الدخول: شعار اللوح الأوّل
           وزرُّه القديم يسقطان. */
        body .screen.intro.native { scroll-padding-top:96px; }
        body .screen.intro.native .intro-head,
        body .screen.intro.native .intro-go,
        body .screen.intro.native .intro-stages { display:none; }
        /* الكتلة أطول من الشاشة: الاستقرار الإجباريّ على اللوحين يعيق تمريرها. */
        body .screen.intro.native { scroll-snap-type:none; }
        /* صفحتان لا لوحان: التعريف وحده، أو الدخول وحده بعد الضغطة. */
        body .screen.intro.native:not(.signin-open) .intro-pane.signin,
        body .screen.intro.native.signin-open .intro-pane:not(.signin) { display:none; }
        .welcome-back {
          height:40px; padding:0 18px; border:0; border-radius:999px; cursor:pointer;
          font:inherit; font-weight:800; font-size:15px;
          background:var(--n-bg, #F6F5F2); color:var(--n-ink, #22201C);
        }
        /* والكتلة تبدأ تحت الرأس لا في منتصف ما بقي. */
        /* الكتلة تملأ ما بقي تحت الرأس إلى أسفل الشاشة، بلا فراغٍ في آخرها
           (علي ١ أكتوبر ٢٠٢٦: «خلّها كاملة»). 96 = الرأس وهامشه. */
        body .screen.intro.native .intro-pane:first-of-type {
          padding-top:16px; padding-bottom:16px; min-height:calc(100% - 96px);
        }
        body .screen.intro.native .welcome-box { flex:1; justify-content:space-evenly; }
        /* صفحة الدخول بهيئة صفحة التعريف (علي: «ضبّط صفحة تسجيل الدخول»):
           الكتلة البيضاء نفسها بظلّها الأسود، تملأ ما تحت الرأس، والأزرار
           في وسطها. */
        body .screen.intro.native .intro-pane.signin {
          min-height:calc(100% - 32px);
          margin:16px; padding:28px 18px;
          background:var(--n-surface, #fff); border-radius:22px;
          box-shadow:var(--n-e2, 0 0 0 2.5px #22201C, 5px 6px 0 #22201C); /* حدُّ حبرٍ كبطاقة «إنشاء حساب» */
          justify-content:center; gap:14px;
        }
        body .screen.intro.native .intro-pane.signin > :first-child,
        body .screen.intro.native .intro-pane.signin > :last-child { margin-block:0; }
        body .screen.intro.native .signin-logo { font-size:clamp(72px,22vw,96px); margin:0 auto 6px; }
        /* «تسجيل الدخول» والجملة تحتها سقطتا في التطبيق: الشعار والأزرار تكفي (علي ١ أكتوبر ٢٠٢٦). */
        body .screen.intro.native .signin-title,
        body .screen.intro.native .signin-sub { visibility:hidden; } /* مكانهما باقٍ: الشعار في موضعه كما كان (علي: «ارفع الشعار نفس ما كان») */
        .signin-first {
          margin-top:4px; padding:6px; border:0; background:none; cursor:pointer;
          font:inherit; font-weight:700; font-size:16px; color:var(--n-ink-2, #57524A);
        }
        .signin-first u { color:var(--n-brand, #E8542F); text-underline-offset:4px; }
        body .screen.intro.native .signin .welcome-back { align-self:center; margin-top:8px; }
        body .screen.intro.native .signin-sub { font-size:16px; margin-bottom:10px; }
        body .screen.intro.native .signin-methods { gap:12px; }
        body .screen.intro.native .method { font-size:17px; padding:15px 18px; }

        /* ─── كتلة التعريف ─── بيضاء كالرأس، والمراحل
           كبسولات الإعداد نفسها (رقمٌ في لسانٍ ملوّن، والاسم، وi تفتح الشرح). */
        .welcome-box {
          display:flex; flex-direction:column; gap:14px;
          margin-top:0; padding:22px 16px 20px;
          /* أبيض بظلّ الرأس الناعم؛ جُرّب قبله الخوخيّ ثمّ الفيروزيّ الفاتح. */
          background:var(--n-surface, #fff); border-radius:22px;
          box-shadow:var(--n-e2, 0 0 0 2.5px #22201C, 5px 6px 0 #22201C); /* حدُّ حبرٍ وظلٌّ صلب كبطاقة «إنشاء حساب» (علي ١ أكتوبر ٢٠٢٦) */
          text-align:center;
        }
        /* لمسةٌ خفيفة جدّاً خلف الكتلة: رسوم الفئات شبكةً مائلة كافتتاحيّة فيديو
           الشرح (علي ١ أكتوبر ٢٠٢٦: «مثل صور الفئات بس خفيييفة»). صورةٌ واحدة
           مجمَّعة من assets/categories لا تسع عشرة. والمحتوى فوقها. */
        .welcome-box { position:relative; isolation:isolate; overflow:hidden; }
        .welcome-box::before {
          content:''; position:absolute; inset:0; z-index:-1; pointer-events:none;
          background:var(--welcome-cats) center / cover no-repeat;
          opacity:.07;
        }
        .welcome-name {
          margin:0; font-family:system-ui, -apple-system, sans-serif; font-weight:800;
          font-size:44px; line-height:1.1; color:var(--n-ink, #22201C);
        }
        /* رأس الكتلة بعد سقوط «فطين» المكتوبة (علي: «نسّق الجملة»): «لعبة
           ثقافية اجتماعية» عنواناً بالحبر، وما بعدها سطرٌ أهدأ تحته. */
        .welcome-line {
          display:flex; flex-direction:column; gap:6px;
          margin:4px 0 8px; font-family:system-ui, -apple-system, sans-serif;
        }
        .welcome-what { font-weight:800; font-size:24px; line-height:1.3; color:var(--n-ink, #22201C); }
        .welcome-why {
          font-weight:600; font-size:16px; line-height:1.6; color:var(--n-ink-2, #57524A);
          text-wrap:balance;
        }
        .welcome-stages { display:flex; flex-direction:column; gap:10px; margin-top:6px; text-align:start; }
        .w-stage {
          overflow:hidden; border-radius:18px; background:var(--n-surface, #fff);
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C); /* بلا ظلّ ملوّن (علي ١ أكتوبر ٢٠٢٦) */
        }
        .w-stage.tone-0 { --tone:#FFD966; --tone-soft:#FFF4CC; }
        .w-stage.tone-1 { --tone:#8FD9D6; --tone-soft:#E1F5F4; }
        .w-stage.tone-2 { --tone:#FFB399; --tone-soft:#FFE6DC; }
        .w-stage-head {
          display:flex; align-items:stretch; width:100%; padding:0;
          font:inherit; color:var(--n-ink, #22201C); background:transparent; border:0; cursor:pointer; text-align:start;
        }
        .w-stage-no {
          flex:none; width:50px; min-height:50px; display:grid; place-items:center;
          background:var(--tone); border-inline-end:2.5px solid var(--n-ink, #22201C);
          font-weight:800; font-size:21px;
        }
        .w-stage-name { flex:1; margin:0; align-self:center; padding-inline:14px; font-size:17px; font-weight:800; }
        .w-stage-info {
          flex:none; align-self:center; margin-inline-end:14px; width:26px; height:26px; border-radius:50%;
          display:grid; place-items:center; background:var(--tone-soft);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
          font-family:'Cairo', serif; font-style:italic; font-weight:800; font-size:15px;
        }
        .w-stage.open .w-stage-info { background:var(--n-ink, #22201C); color:#fff; }
        .w-stage-desc {
          margin:0 12px 12px; padding:10px 12px; border-radius:12px; background:var(--tone-soft);
          text-align:center; font-weight:600; font-size:14px; line-height:1.6; color:var(--n-ink, #22201C);
        }
        .welcome-video-line {
          margin:16px 0 0; font-family:system-ui, -apple-system, sans-serif; font-weight:600;
          font-size:17px; color:var(--n-ink, #22201C);
        }
        .welcome-box .xi-wrap { margin:0; }
        .welcome-cta {
          margin-top:6px; height:52px; border:0; border-radius:999px; cursor:pointer;
          font:inherit; font-weight:800; font-size:17px;
          background:var(--n-brand, #E8542F); color:#fff;
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 4px 5px 0 var(--n-ink, #22201C);
        }
        .welcome-cta:active { transform:translate(2px,3px); box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 1px 1px 0 var(--n-ink, #22201C); }

        /* الجوال الأفقي قصير (ارتفاعه ٤٤٠px) — والشرح هو سبب اللوح الأول،
           فلا يُخفى. ينكمش الشعار والحشو بدله. */
        @media (max-height:460px) {
          .intro-logo { font-size:clamp(26px,5vw,40px); }
          .intro-stage { padding-block:clamp(5px,1dvh,10px); }
          .intro-desc { font-size:clamp(10px,1.35vw,14px); }
          /* الحشو والفجوات تنكمش أيضاً — بدونها يفيض اللوح فيُقصّ الشعار. */
          .intro-pane { gap:clamp(6px,1.2dvh,12px); padding-block:clamp(8px,1.4dvh,14px); }
          .intro-tag { font-size:clamp(11px,1.5vw,15px); }
        }
      `}</style>
    </div>
  )
}
