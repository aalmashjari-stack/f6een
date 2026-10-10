import { useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { STAGES } from '../game/stages'
import { authErrorText, knownAuthErrorText, signInWithGoogle } from '../lib/auth'
import { SignUp } from './SignUp'
import { ExplainerInline } from '../components/ExplainerVideo'
import welcomeCats from '../../assets/backgrounds/welcome-cats.jpg'
import introCss from './Intro.css?inline'

/**
 * شاشة التعريف — تلي شاشة الشعار.
 *
 * صفحتان: التعريف برأسٍ فيه «تسجيل الدخول»، ثمّ صفحة الدخول برجوعٍ تحتها
 * (علي ١ أكتوبر ٢٠٢٦، في التطبيق ثمّ الموقع). كانت لوحين في ممرٍّ يُمرَّر
 * ينزل الزرّ إلى الثاني (٢٦ أغسطس ٢٠٢٦).
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
  const [openStage, setOpenStage] = useState<number | null>(null)
  /* قبل أيّ رجوعٍ مبكّر: خطّافٌ بعد `if (email) return` يُسقط الشاشة كلّها. */
  /* رجوعٌ فاشل من غوغل يفتح صفحة الدخول نفسها: سببه مكتوبٌ فيها. */
  const [signinPage, setSigninPage] = useState(
    () => typeof window !== 'undefined' && /[?&#]error=/.test(window.location.search + window.location.hash),
  )
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
    const why = q.get('error_description') ?? h.get('error_description') ?? ''
    /* النصُّ من العنوان لا يُعرض كما هو — يكتبه من يصنع الرابط؛ يُطابَق
       بالمعروف وإلّا فالاحتياطيّ. */
    return knownAuthErrorText(code, why.replace(/\+/g, ' '), 'تعذّر فتح دخول غوغل')
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

  /* الدخول صفحةٌ مستقلّة لا نزولٌ إلى لوحٍ تحت (علي ١ أكتوبر ٢٠٢٦: في
     التطبيق، ثمّ «انقل شاشة الدخول للموقع»). */
  const toSignin = () => setSigninPage(true)

  return (
    <div className={'screen intro native' + (signinPage ? ' signin-open' : '')}>
      {/* رأسُ كتلةٍ بدل صفحة الدخول القديمة — الشعار و«تسجيل الدخول» (علي ١
          أكتوبر ٢٠٢٦، على مثالٍ أرسله بألوان فطين؛ في التطبيق ثمّ الموقع). */}
      {!signinPage && (
        <header className="welcome-bar">
          <BrandLogo className="welcome-logo" />
          <button className="welcome-login" onClick={toSignin}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
              <path d="M3 12h11M10 8l4 4-4 4" />
            </svg>
            تسجيل الدخول
          </button>
        </header>
      )}
      {/* اللوح الأول — الشرح */}
      <section className="intro-pane">
        {/* كتلةٌ واحدة بنصّ الموقع، والمراحل كبسولاتٍ فوق بعض، ثمّ
            الفيديو وزرّ التسجيل (علي ١ أكتوبر ٢٠٢٦). النصوص نصوصه. */}
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
                  <button
                    className="w-stage-head"
                    onClick={() => setOpenStage(open ? null : i)}
                    aria-expanded={open}
                  >
                    <span className="w-stage-no" aria-hidden="true">
                      {i + 1}
                    </span>
                    <h2 className="w-stage-name">{st.name}</h2>
                    <span className="w-stage-info" aria-label={open ? 'أخفِ الشرح' : 'اعرض الشرح'}>
                      i
                    </span>
                  </button>
                  {open && <p className="w-stage-desc">{st.desc}</p>}
                </article>
              )
            })}
          </div>
          {/* زرّ التسجيل قبل الفيديو لا بعده (علي ٥ أكتوبر ٢٠٢٦، من تدقيق
              التجربة): بعده كان تحت حافّة الشاشة في كلّ مقاسٍ أفقيّ — 996px
              على 900 — فلا يرى الزائر «لعبة مجانية» إلّا إن مرّر. */}
          <button className="welcome-cta" onClick={toSignin}>
            سجل و احصل على لعبة مجانية
          </button>
          <p className="welcome-video-line">
            <span aria-hidden="true">▶</span> شوف الفيديو عشان تفهم اللعبة
          </p>
          <ExplainerInline />
        </section>
      </section>

      {/* اللوح الثاني — الدخول */}
      <section className="intro-pane signin" style={{ ['--welcome-cats' as string]: `url(${welcomeCats})` }}>
        {/* صفحة الدخول بلا رأس: الشعار كبيراً فوقها (علي ١ أكتوبر ٢٠٢٦). */}
        <BrandLogo className="signin-logo" />
        <h2 className="signin-title">تسجيل الدخول</h2>
        <p className="signin-sub">حسابك يحفظ رصيدك، ولا يعيد عليك سؤالاً سمعته</p>

        {onDone ? (
          /* الدخول موقوف: زرٌّ واحد يمرّ منه، ولا تُعرض أزرار مزوّدين لا تعمل.
             زرٌّ يعد بما لا يفي أسوأ من زرٍّ غائب. */
          <div className="signin-methods">
            <button className="method go-now" onClick={onDone}>
              ابدأ
            </button>
            <p className="signin-note">الدخول موقوف مؤقّتاً</p>
          </div>
        ) : (
          <div className="signin-methods">
            <button className="method apple" disabled title="يحتاج حساب مطوّر آبل — لم يُسجَّل بعد">
              {/* «سجل دخولك عبر…» (علي ١ أكتوبر ٢٠٢٦). */}
              سجل دخولك عبر Apple
            </button>

            <button className="method google" onClick={google} disabled={busy}>
              {/* الشعار لا الكلمة (طلب علي ٢٧ سبتمبر ٢٠٢٦): حرف G بألوانه
                  الأربعة كما في إرشادات غوغل، والاسم في aria-label. */}
              {busy ? (
                'جارٍ التحويل…'
              ) : (
                <>
                  سجل دخولك عبر
                  <svg className="g-logo" viewBox="0 0 48 48" role="img" aria-label="Google">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </>
              )}
            </button>

            <button className="method mail" onClick={() => setEmail('signin')}>
              سجل دخولك عبر البريد
            </button>
          </div>
        )}

        {/* الأزرار «سجل دخولك»، فمن لا حساب له يجد طريقه تحتها. وغوغل
            يُنشئ الحساب بأوّل دخول، فالتسجيل هنا للبريد. */}
        {!onDone && (
          <button className="signin-first" onClick={() => setEmail('signup')}>
            أول مرة؟ <u>اضغط هنا للتسجيل</u>
          </button>
        )}
        {err && <p className="signin-err">{err}</p>}
        {/* والرجوع تحت الأزرار لا في رأسٍ سقط. */}
        <button className="welcome-back" onClick={() => setSigninPage(false)}>
          → رجوع
        </button>
      </section>

      <style>{introCss}</style>
    </div>
  )
}
