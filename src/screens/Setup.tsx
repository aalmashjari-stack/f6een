import { useEffect, useMemo, useRef, useState } from 'react'
import type { SetupInput } from '../game/session'
import { STAGE1_CATEGORIES, readScoped, writeScoped } from '../game/session'
import type { TeamId } from '../game/types'
import { displayName, playableCategories, subscribeBank } from '../game/bank'
import { categoryArt } from '../components/categoryArt'
import { categoryInfo } from '../components/categoryInfo'
import { CategoryInfoPanel } from '../components/SitePanels'
import { groupCategories } from '../components/categoryGroups'
import { isMuted, play, setMuted } from '../audio/sfx'
import { BrandLogo } from '../components/BrandLogo'
import welcomeCats from '../../assets/backgrounds/welcome-cats-tall.jpg'
import { authErrorText, signOut } from '../lib/auth'
import setupCss from './Setup.css?inline'
const MIN = 2
const MAX = 6


/** ترتيب الفريق: شارةً فوق بطاقته دائماً، واسماً بديلاً إن تُرك حقل الاسم فارغاً. */
const FALLBACK_TEAM = ['الفريق الأول', 'الفريق الثاني']


/* نسيج الخلفية يعيش في `body::after` بـ theme.css فيشمل كل الشاشات.
   تكراره هنا كان يضاعفه تحت الشعار ويزحمه. */

/* **آخر فرقٍ ولاعبين للحساب** (علي ٥ أكتوبر ٢٠٢٦، من تدقيق التجربة): «لعبة
   جديدة» كانت تُفرغ الإعداد، فإعادةُ المباراة مع الجماعة نفسها تعني كتابة
   حتى أربعة عشر اسماً في اللحظة التي يريد فيها المجلس الجولة الثانية. تُحفظ
   عند «ابدأ اللعبة» باسم الحساب (`writeScoped`)، والفئات لا تُحفظ — اختيارُها
   من متعة الجولة. وما لا يُقرأ شكلُه يُطرح بصمت فيبدأ الإعداد فارغاً كما كان. */
const LAST_TEAMS_KEY = 'f6een.lastTeams'

function loadLastTeams(): { names: [string, string]; players: [string[], string[]] } | null {
  try {
    const raw = readScoped(LAST_TEAMS_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { names?: unknown; players?: unknown }
    const strs = (a: unknown, min: number, max: number): a is string[] =>
      Array.isArray(a) && a.length >= min && a.length <= max && a.every((x) => typeof x === 'string')
    if (!strs(v.names, 2, 2) || !Array.isArray(v.players) || v.players.length !== 2) return null
    if (!v.players.every((t) => strs(t, 2, 6))) return null
    return { names: v.names as [string, string], players: v.players as [string[], string[]] }
  } catch {
    return null
  }
}

/**
 * `onStart` غير متزامنة لأنّها تعبر الخادم: هناك يقع الخصم وإنشاء الجلسة
 * (SPEC ٩). فالزرّ ينتظر الردّ، والخطأ يُعرض هنا لا في وحدة التحكّم.
 *
 * و`balance` قد تكون `null` — «لم يُقرأ» لا «صفر»، فلا تمنع البدء: القاعدة
 * هي التي تمنع، ومنعُ من رصيده سليم لأنّ الشبكة تأخّرت خطأٌ في الاتّجاه الأسوأ.
 */
export function Setup({
  onStart,
  balance,
  onNav,
}: {
  onStart: (input: SetupInput) => Promise<void> | void
  balance?: number | null
  /** قائمة الرأس: شراء الألعاب · حسابي · تواصل معنا — تُفتح صفحاتها في App. */
  onNav?: (page: 'buy' | 'account' | 'rules' | 'contact') => void
}) {
  const [last] = useState(loadLastTeams)
  const [names, setNames] = useState<[string, string]>(last?.names ?? ['', ''])
  const [players, setPlayers] = useState<[string[], string[]]>(
    last?.players ?? [
      ['', ''],
      ['', ''],
    ],
  )
  const [starter, setStarter] = useState<TeamId | null>(null)
  /* فئات لوح الجولة الجماعية — ثلاث لكل فريق (SPEC ٤). */
  const [cats, setCats] = useState<string[]>([])
  /* تنبيهُ النقص: الرسالة تحت الزرّ رماديّة ما لم يضغط الحكم «قرعة البدء»
     وشيءٌ ناقص — فتحمرّ عندها (طلب علي ٥ سبتمبر ٢٠٢٦). الرماديّ يخبر،
     والأحمر يجيب على ضغطةٍ لم تُثمر. */
  const [nudge, setNudge] = useState(false)
  /* قائمة الرأس على الجوال الطوليّ (طلب علي ١٦ سبتمبر ٢٠٢٦): الكبسولات
     الأربع تختفي خلف زرّ ☰ فيصير الشريط صفّاً واحداً. تُغلق مع أيّ اختيار. */
  const [menuOpen, setMenuOpen] = useState(false)
  /* الفئة المفتوحة نبذتُها من علامة (i) على بطاقتها — `null` = لا لوح. */
  const [infoCat, setInfoCat] = useState<string | null>(null)
  const [tossing, setTossing] = useState(false)
  const [tossFace, setTossFace] = useState<TeamId>(0)
  const [mute, setMute] = useState(isMuted())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  /* الرصيد صفر: الزرّ يُقفل هنا بدل أن يُترك يرحل إلى الخادم ويعود بخطأ —
     والحكم يعرف قبل أن يكتب اثني عشر اسماً لا بعده. */
  const noBalance = balance === 0
  const lastGame = balance === 1

  /** الكتم يُضبط مرّة قبل الجلسة ويبقى محفوظاً — لا يعود الحكم إليه أثناء اللعب. */
  function toggleMute() {
    const next = !mute
    setMute(next)
    setMuted(next)
    // عيّنة عند التشغيل: الحكم يسمع المستوى قبل أن يبدأ لا في منتصف سؤال
    if (!next) play('pickLand')
  }

  /** الخروج من لوح ☰: الجلسة تختفي فتتبدّل الشاشة كلّها إلى الدخول. */
  async function logout() {
    setMenuOpen(false)
    try {
      await signOut()
    } catch (e) {
      setErr(authErrorText(e, 'تعذّر الخروج'))
    }
  }

  const teamLabel = (t: TeamId) => names[t].trim() || FALLBACK_TEAM[t]

  /**
   * القائمة تُقرأ مرّةً ثمّ **عند وصول المزامنة وحدها**.
   *
   * الثبات مقصود: قائمةٌ تتبدّل تحت إصبع الحكم بين ضغطتين تنقل اختياره إلى
   * فئةٍ أخرى. لكنّ القراءة المرّةَ الواحدة كانت تُسقط الفئة المضافة من
   * اللوحة: هذه الشاشة تُفتح في اللحظة التي تبدأ فيها `syncCategories`، فتقرأ
   * قبل أن تصل. والإخطار يصل مرّةً أو مرّتين في أوّل ثوانٍ ثمّ يسكن —
   * والفئات لا تُعاد ترتيباً بل تُلحَق في آخر القائمة (انظر `allCategories`)،
   * فلا ينزاح ما تحت الإصبع.
   */
  const [bankRev, setBankRev] = useState(0)
  useEffect(() => subscribeBank(() => setBankRev((v) => v + 1)), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allCats = useMemo<string[]>(playableCategories, [bankRev])
  /**
   * الفئات موزّعةً على تصنيفاتها — «رياضة» و«ثقافة عامة» عناوينُ فوق شبكةٍ
   * صارت أربعين بطاقة (قرار علي ١٠ سبتمبر ٢٠٢٦). والاختيار يبقى على الفئة:
   * ستٌّ منها للّوح، والعنوان لا يُضغط.
   *
   * وما لم يُصنَّف بعدُ يقع في قسمٍ أخيرٍ بلا عنوان، فلا تختفي فئةٌ من
   * الشاشة لأنّها بلا مظلّة — انظر `groupCategories`.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const catSections = useMemo(() => groupCategories(allCats), [allCats, bankRev])

  /**
   * الفئات الستّ للّوح لا للفريقين (قرار علي ٥ سبتمبر ٢٠٢٦). كان كلٌّ يختار
   * ثلاثاً بالتناوب، وكانت شارةٌ تقول «دور الفريق الأول» فتُقرأ في شاشةٍ فيها
   * قرعةٌ على أنّها ترتيب اللعب لا ترتيب الاختيار. سقط التناوب وسقطت معه.
   */
  const catsReady = cats.length === STAGE1_CATEGORIES
  const isPicked = (cat: string) => cats.includes(cat)

  /** ضغطةٌ على فئةٍ مختارة تسحبها — وهي طريقُ التراجع الوحيد ولا تحتاج زرّاً. */
  function toggleCat(cat: string) {
    const picked = isPicked(cat)
    setCats((c) => {
      if (picked) return c.filter((x) => x !== cat)
      if (c.length >= STAGE1_CATEGORIES) return c
      return [...c, cat]
    })
    if (!picked) play('pickLand')
  }

  /* لا تبدأ اللعبة باسم مستعار: كل حقل — الفريقان وكل لاعب — مكتوب (قرار علي
     ٢٦ أغسطس ٢٠٢٦). الأسماء البديلة تبقى للعرض قبل الكتابة لا للّعب بها. */
  const namesReady =
    names.every((n) => n.trim()) && players.every((team) => team.every((p) => p.trim()))

  function setPlayer(team: TeamId, i: number, v: string) {
    setPlayers((p) => {
      const copy: [string[], string[]] = [[...p[0]], [...p[1]]]
      copy[team][i] = v
      return copy
    })
  }
  function addPlayer(team: TeamId) {
    setPlayers((p) => {
      if (p[team].length >= MAX) return p
      const copy: [string[], string[]] = [[...p[0]], [...p[1]]]
      copy[team].push('')
      return copy
    })
  }
  function removePlayer(team: TeamId) {
    setPlayers((p) => {
      if (p[team].length <= MIN) return p
      const copy: [string[], string[]] = [[...p[0]], [...p[1]]]
      copy[team].pop()
      return copy
    })
  }

  /* التنبيه يسقط بمجرّد اكتمال ما نقص — لا ينتظر ضغطةً ثانية. */
  useEffect(() => { if (namesReady && catsReady) setNudge(false) }, [namesReady, catsReady])

  /* مؤقّت القرعة يُلغى إن ذهبت الشاشة في منتصفها — وإلّا بقي يكتب في
     مكوّنٍ فُكّك. */
  const tossTimer = useRef<number | null>(null)
  useEffect(() => () => { if (tossTimer.current !== null) clearInterval(tossTimer.current) }, [])

  function toss() {
    if (tossing) return
    /* بيانات ناقصة: لا تبدأ القرعة أصلاً — رسالتُها كانت تحلّ محلّ التنبيه
       فيومض الأحمر ويختفي قبل أن يُقرأ. الضغطة تُظهر ما ينقص لا غير. */
    if (!namesReady || !catsReady) {
      setNudge(true)
      return
    }
    setTossing(true)
    setStarter(null)
    let n = 0
    const iv = window.setInterval(() => {
      setTossFace((f) => (1 - f) as TeamId)
      n++
      if (n > 11) {
        clearInterval(iv)
        tossTimer.current = null
        const result = (Math.random() < 0.5 ? 0 : 1) as TeamId
        setTossFace(result)
        setStarter(result)
        setTossing(false)
      }
    }, 110)
    tossTimer.current = iv
  }

  async function start() {
    if (starter === null || !namesReady || !catsReady || busy || noBalance) return
    setErr(null)
    setBusy(true)
    writeScoped(
      LAST_TEAMS_KEY,
      JSON.stringify({
        names: [names[0].trim(), names[1].trim()],
        players: [players[0].map((p) => p.trim()), players[1].map((p) => p.trim())],
      }),
    )
    try {
      await onStart({
        teamNames: [teamLabel(0), teamLabel(1)],
        players: [
          players[0].map((p, i) => p.trim() || `لاعب ${i + 1}`),
          players[1].map((p, i) => p.trim() || `لاعب ${i + 1}`),
        ],
        startingTeam: starter,
        categories: cats,
      })
      /* لا إفراغ لـbusy عند النجاح: الشاشة تتبدّل إلى العجلة، وإفراغه يُعيد
         الزرّ نشطاً للحظة فيُضغط مرّتين — وكل ضغطة جلسة. */
    } catch (e) {
      /* رسائل الجاهزية عربيّةٌ جاهزة من المحرّك (`notReadyMessage`) وتُعرض
         كما هي: هي تسمّي الفئة التي سقطت، و«تعذّر بدء اللعبة» لا يسمّي شيئاً.
         ويُميَّز نصُّها بأنّه عربيّ: ما سواه — رموز الخادم («bad_session»)
         وأعطال الشبكة («Failed to fetch»، «request timed out») — يُعرض
         بالرسالة العامّة لا خاماً بالإنجليزيّة أمام المجلس. */
      const msg =
        e instanceof Error && e.message === 'no_balance'
          ? 'انتهى رصيدك — أضف كود هدية من «حسابي»'
          : e instanceof Error && /[؀-ۿ]/.test(e.message)
            ? e.message
            : 'تعذّر بدء اللعبة، تحقّق من اتصالك'
      setErr(msg)
      setBusy(false)
    }
  }

  return (
    <div
      className="screen setup"
      style={{ ['--welcome-cats' as string]: `url(${welcomeCats})` }}
    >
      {/* الرأس شريطٌ بدرجةٍ أدفأ من الأرضيّة (طلب علي، ١ سبتمبر ٢٠٢٦) —
          يحمل الشعارَ والقائمة: شراء الألعاب · حسابي · تواصل معنا. */}
      {/* التمرير على غلافٍ داخليّ لا على ‎.screen.setup‎ نفسها: القصّ
          العموديّ (‎overflow-y:auto‎) يجرّ معه قصّاً أفقيّاً بحكم CSS، فكان
          يبتلع تمدّدَ الشريط تحت أذن الآيفون — يُحسب ولا يُرسم.
          والرأس داخله (علي ٢٦ سبتمبر ٢٠٢٦): كان ثابتاً فوقه يأكل قرابة ربع
          الجوال بشعارٍ وحده، فصار يصعد مع الصفحة. لم يعد يعبر الحافّة. */}
      <div className="setup-scroll">
      <div className="hero">
        <BrandLogo className="hero-logo" />

        {onNav && (
          /* زرّ القائمة يظهر في الطوليّ وحده (CSS) ويفتح الكبسولات لوحاً
             تحت الشريط؛ في العرض تبقى الكبسولات صفّاً ولا زرّ. */
          <button
            className={'hnav hnav-menu' + (menuOpen ? ' open' : '')}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'أغلق القائمة' : 'القائمة'}
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
        )}
        {/* رصيد الألعاب بجانب ☰ (علي ١ أكتوبر ٢٠٢٦، في التطبيق ثمّ الموقع). لا يظهر ما لم
            يُقرأ: «لم يُقرأ» ليس صفراً. */}
        {onNav && balance != null && (
          /* «رصيد العابي» وعددها، والضغطة تفتح الشراء (علي ١ أكتوبر ٢٠٢٦). */
          <button className="hnav-balance" onClick={() => { setMenuOpen(false); onNav('buy') }}>
            رصيد العابي <b>{balance}</b>
          </button>
        )}
        {/* ضغطةٌ خارج اللوح تغلقه — ستارٌ شفّاف تحته يلتقطها. */}
        {onNav && menuOpen && <div className="hero-nav-veil" onClick={() => setMenuOpen(false)} />}
        {onNav && (
          <nav className={'hero-nav' + (menuOpen ? ' open' : '')} aria-label="القائمة">
            {/* الشراء أوّلاً وبلون الهويّة: هو النداء التجاريّ الوحيد في
                الشاشة. والاثنان الآخران كبسولتان محايدتان. */}
            <button className="hnav hnav-buy" onClick={() => { setMenuOpen(false); onNav('buy') }}>شراء الألعاب</button>
            <button className="hnav hnav-account" onClick={() => { setMenuOpen(false); onNav('account') }}>حسابي</button>
            <button className="hnav hnav-rules" onClick={() => { setMenuOpen(false); onNav('rules') }}>شرح اللعبة</button>
            <button className="hnav hnav-contact" onClick={() => { setMenuOpen(false); onNav('contact') }}>تواصل معنا</button>
            {/* فاصلٌ رفيع بين الروابط وبين «حسابي» والشراء — في الكبسولة العريضة وحدها. */}
            <span className="hnav-sep" aria-hidden="true" />
            {/* الصوت والخروج داخل لوح ☰ (علي ١ أكتوبر ٢٠٢٦، في التطبيق ثمّ الموقع). */}
            <button
              className={'hnav hnav-sound' + (mute ? ' off' : '')}
              onClick={toggleMute}
              aria-pressed={mute}
              aria-label={mute ? 'الصوت مكتوم — شغّله' : 'الصوت يعمل — اكتمه'}
              title={mute ? 'الصوت مكتوم' : 'الصوت يعمل'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
                {mute ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.8 9a4.2 4.2 0 0 1 0 6M18.6 6.5a8 8 0 0 1 0 11" />}
              </svg>
              {/* الكلمة تسقط في صفّ الموقع فيبقى الرمز وحده (علي ٢ أكتوبر ٢٠٢٦). */}
              <span className="hnav-sound-label">{mute ? 'الصوت مكتوم' : 'الصوت يعمل'}</span>
            </button>
            <button className="hnav hnav-logout" onClick={logout}>تسجيل الخروج</button>
          </nav>
        )}
      </div>

      {/* ما بعد الهيرو يتوسّط المساحة الباقية — بلا هذا يتكدّس كل شيء
          في أعلى التابلت الطولي ويبقى ثلثه السفلي فارغاً. */}
      <div className="setup-body">
        {/* التعريف و«فطين» والمراحل والفيديو سقطت من الإعداد (علي ١ أكتوبر ٢٠٢٦:
            في التطبيق «ما يحتاج بطاقات ولا يحتاج فيديو»، ثمّ «انقل الإعداد بلا
            مراحل وفيديو للموقع»): هي في شاشة الدخول وفي «شرح اللعبة». */}

        {/* حقول الفريقين. حُذف عنوان «بيانات الفريقين المتنافسين» في ٢١ أغسطس
            ٢٠٢٦: حقولٌ باسم فريق ولاعبين لا تحتاج عنواناً يسمّيها، وارتفاعه
            أنفع للحقول نفسها. */}
        <section className="setup-block">
          {/* عنوانٌ يسمّي الكتلة (طلب علي ١٧ سبتمبر ٢٠٢٦) — كان قد حُذف في
              أغسطس لضيق الارتفاع، وعاد بصياغته. */}
          {/* العنوان كبسولةٌ بهيئة بطاقة المرحلة (علي ٣٠ سبتمبر ٢٠٢٦)، ككبسولة الفيديو. */}
          <div className="stages video-cap-wrap title-cap-wrap">
            <div className="stage-card tone-1 video-cap">
              <div className="stage-head">
                <span className="stage-no" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
                    <circle cx="16.5" cy="9" r="2.6" /><path d="M16 14.2c2.4.1 4 1.7 4.5 4.8" />
                  </svg>
                </span>
                <h2 className="stage-name">أدخل بيانات الفرق واللاعبين</h2>
              </div>
            </div>
          </div>
          {/* مخرجُ الجماعة الجديدة من الأسماء المحفوظة: ضغطةٌ تُفرغ الحقول كلّها
              بدل مسح أربعة عشر حقلاً واحداً واحداً. لا يظهر والحقول فارغة. */}
          {(names.some((n) => n.trim()) || players.some((t) => t.some((p) => p.trim()))) && (
            <button
              className="names-reset"
              onClick={() => {
                setNames(['', ''])
                setPlayers([
                  ['', ''],
                  ['', ''],
                ])
              }}
            >
              أسماء جديدة
            </button>
          )}
          <div className="teams-grid">
            {[0, 1].map((ti) => {
              const team = ti as TeamId
              return (
                <div key={ti} className={'team-card' + (starter === team ? ' starter' : '')}>
                  <span className="team-badge">{FALLBACK_TEAM[team]}</span>
                  <input
                    className="team-name"
                    value={names[team]}
                    placeholder="اكتب اسم فريقك"
                    onChange={(e) => setNames((n) => (team === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
                  />
                  <div className="players">
                    {players[team].map((p, i) => (
                      <input
                        key={i}
                        className="player"
                        value={p}
                        placeholder={`اسم اللاعب ${i + 1}`}
                        onChange={(e) => setPlayer(team, i, e.target.value)}
                      />
                    ))}
                  </div>
                  <div className="counter">
                    <button className="pill" onClick={() => removePlayer(team)} disabled={players[team].length <= MIN}>
                      −
                    </button>
                    <span>{players[team].length} لاعبين</span>
                    <button className="pill" onClick={() => addPlayer(team)} disabled={players[team].length >= MAX}>
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* لوح الجولة الجماعية — ستّ فئات يختارها الفريقان (SPEC ٤). هنا لا في شاشة
            مستقلّة: الاختيار قرارُ تجهيزٍ يسبق اللعب مثل الأسماء والقرعة،
            وشاشةٌ ثالثة بينهما تقطع المجلس مرّتين قبل أول سؤال. */}
        <section className="setup-block">
          {/* سطر التوجيه فوق العنوان (طلب علي ٥ سبتمبر ٢٠٢٦): العنوان يسمّي
              القسم، وهذا يقول للحكم ما يفعله فيه — بعد أن حُذف التلميح الصغير
              الذي كان تحت الشبكة. */}
          {/* سطران في الوسط لا ثلاثة: نداءٌ وعدّاد. سقطت التسمية «فئات الجولة
              الجماعية» (طلب علي ٥ سبتمبر ٢٠٢٦) — النداء يكفي، والشبكةُ تحته
              تقول ما هي. */}
          <div className="cats-head">
            {/* اللافتة نفسُها التي فوق الفريقين (طلب علي ١٧ سبتمبر ٢٠٢٦):
                عنوانا الكتلتين بهيئةٍ واحدة. والنصّ نصُّه كما هو — بدّلتُه
                إلى «اختر فئات اللوح» فردّه في الدقيقة نفسها. */}
            {/* كبسولةٌ بهيئة بطاقة المرحلة كعنوان الفرق (علي ٣٠ سبتمبر ٢٠٢٦). */}
            <div className="stages video-cap-wrap title-cap-wrap">
              <div className="stage-card tone-2 video-cap">
                <div className="stage-head">
                  <span className="stage-no" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
                      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
                    </svg>
                  </span>
                  <h2 className="stage-name">قم باختيار الفئات</h2>
                </div>
              </div>
            </div>
            {/* العدّاد «0 / 6» سقط (علي ١٧ سبتمبر ٢٠٢٦: «شيل 0/6») — صينيّة
                المختارات تحت الشبكة تعدّ بخاناتها الستّ. بقيت شارة الاكتمال. */}
            {catsReady && <span className="cats-turn done">اكتمل اللوح</span>}
          </div>
          {/* قسمٌ لكل تصنيف، وعنوانٌ فوقه — وقسمٌ واحد بلا عنوان حين لا تصنيف
              في القاعدة أصلاً، فتبقى الشاشة كما كانت قبل ١٠ سبتمبر ٢٠٢٦.
              ورقمُ الحركة `--i` متّصلٌ عبر الأقسام لا يبدأ من الصفر في كلّ
              واحد: الشبكة تتدفّق بموجةٍ واحدة كما كانت. */}
          {catSections.map((sec) => (
            <div className="cats-sec" key={sec.name ?? '—'}>
              {/* **ولا عنوان لما لا مظلّة له** (قرار علي ١١ سبتمبر ٢٠٢٦):
                  كنتُ أضع فوقه «متفرّقات» فردّها — وهي كلمةٌ من صياغتي لا
                  من صياغته، والنصوص له. فالفئاتُ بلا مظلّة تُعرض شبكةً
                  صامتة في آخر الشاشة، وهي حالٌ مؤقّتة على أيّ حال: ما بقي
                  بلا مظلّة يُوضع تحت واحدةٍ من اللوحة. */}
              {sec.name && <h3 className="cats-sec-title">{sec.name}</h3>}
              <div className="cats-grid">
                {sec.cats.map((cat) => {
                  const i = allCats.indexOf(cat)
                  const picked = isPicked(cat)
                  const info = categoryInfo(cat)
                  return (
                    /* خليّةٌ تحمل البطاقة وعلامتها: العلامة زرٌّ مستقلّ فوق
                       البطاقة لا داخلها — زرٌّ في زرّ لا يصحّ، وضغطتُها لا
                       تختار الفئة. */
                    <div className="cc-cell" key={cat} style={{ '--i': i } as React.CSSProperties}>
                    <button
                  className={
                    'catchip' +
                    (picked ? ' taken' : '') +
                    /* اكتمل اللوح: **الشبكة كلّها** ترمدّ — المختارة وغيرها —
                       فتقول بلا سطرٍ إنّ الباب أُقفل ولا فئة سابعة. */
                    (catsReady ? ' dimmed' : '')
                  }
                  onClick={() => toggleCat(cat)}
                  aria-pressed={picked}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  {/* الرسمة عنصرٌ مستقلّ لا خلفيّةُ الزرّ: الترميد يقع عليها
                      وحدها فيبقى الاسم مقروءاً فوقها — بناء `.cat` نفسه. */}
                  <span
                    className="cc-img"
                    style={
                      categoryArt(cat)
                        ? ({ '--art': `url(${categoryArt(cat)})` } as React.CSSProperties)
                        : undefined
                    }
                  />
                  {/* علامةٌ في الزاوية لا حدٌّ رفيع: الاختيار فعلٌ يُرى من آخر
                      المجلس، والحدُّ وحده لا يُقرأ على بطاقةٍ فوقها رسمة. */}
                  <span className="cc-tick" aria-hidden="true">✓</span>
                  <span className="cc-plate">
                    <span className="cc-name">{displayName(cat)}</span>
                  </span>
                    </button>
                    {/* علامة (i) في الزاوية اليسرى العليا — والصحّ في اليمنى
                        (طلب علي ٢٤ سبتمبر ٢٠٢٦). لا تظهر لفئةٍ بلا نبذة. */}
                    {info && (
                      <button
                        className="cc-info"
                        onClick={() => setInfoCat(cat)}
                        aria-label={`عن فئة ${displayName(cat)}`}
                      >
                        i
                      </button>
                    )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {infoCat && categoryInfo(infoCat) && (
            <CategoryInfoPanel
              name={displayName(infoCat)}
              info={categoryInfo(infoCat)!}
              onClose={() => setInfoCat(null)}
            />
          )}

          {/* صينيّة المختارات (طلب علي ١٧ سبتمبر ٢٠٢٦): الفئاتُ المختارة
              مصغّرةً في أسفل الشاشة ما دام الحكمُ يتصفّح الشبكة — فلا يصعد
              ليعدّ ما اختار. ستّ خانات: المملوءة رسمةُ فئتها وضغطتُها تسحبها
              (طريقُ التراجع نفسه)، والفارغة إطارٌ منقّط يقول كم بقي. لاصقةٌ
              (sticky) داخل هذا القسم وحده: تظهر حين يبلغه التمرير وتغيب معه،
              فلا تحجب حقولَ الأسماء فوقه. في كلّ المقاسات (كانت للطوليّ
              وحده حتى ١٧ سبتمبر ٢٠٢٦). */}
          <div className="cats-tray" role="group" aria-label="الفئات المختارة">
            {Array.from({ length: STAGE1_CATEGORIES }, (_, i) => {
              const cat = cats[i]
              return cat ? (
                <button
                  key={cat}
                  className="tray-slot filled"
                  onClick={() => toggleCat(cat)}
                  aria-label={`أزل ${displayName(cat)}`}
                  title={displayName(cat)}
                  style={
                    categoryArt(cat)
                      ? ({ '--art': `url(${categoryArt(cat)})` } as React.CSSProperties)
                      : undefined
                  }
                />
              ) : (
                <span key={'empty-' + i} className="tray-slot" aria-hidden="true" />
              )
            })}
          </div>
        </section>

        {/* القرعة والزرّان مجموعان عند الحافّة السفلى — كتلة فعل واحدة
            لا سطران يطفوان في الفراغ. */}
        <div className="setup-foot">
          <div className="toss">
            {err ? (
              <div className="toss-result missing">{err}</div>
            ) : noBalance ? (
              /* الرصيد أسبق من نقص الأسماء: إكمالها لن يفتح الزرّ. */
              <div className="toss-result missing">انتهى رصيدك — أضف كود هدية من «حسابي»</div>
            ) : tossing ? (
              <div className="toss-result fade">القرعة… {teamLabel(tossFace)}</div>
            ) : !namesReady ? (
              /* لا تظهر إلّا بعد ضغطةٍ على «قرعة البدء» والبيانات ناقصة (طلب
                 علي ٥ سبتمبر ٢٠٢٦): سطرٌ دائمٌ تحت الزرّ يصير جزءاً من
                 الأثاث فلا يُقرأ، وظهورُه جواباً على ضغطةٍ يُقرأ. */
              nudge ? (
                <div className="toss-result missing alert">اكتب أسماء الفريقين واللاعبين</div>
              ) : null
            ) : !catsReady ? (
              nudge ? (
                <div className="toss-result missing alert">
                  اختر {STAGE1_CATEGORIES} فئات للّوح
                </div>
              ) : null
            ) : starter !== null ? (
              <div className="toss-result">
                يبدأ: <b>{teamLabel(starter)}</b>
                {/* آخر لعبة تُقال قبل الضغطة لا بعدها — الخصم عند البدء. */}
                {lastGame && <span className="toss-note"> · آخر لعبة في رصيدك</span>}
              </div>
            ) : null}
          </div>

          <div className="setup-actions">
            <button className="action ghost" onClick={toss} disabled={tossing}>
              {starter !== null ? 'إعادة القرعة' : 'قرعة البدء'}
            </button>
            <button
              className="action"
              disabled={starter === null || !namesReady || !catsReady || busy || noBalance}
              onClick={start}
            >
              {busy ? 'لحظة…' : 'ابدأ اللعبة'}
            </button>
          </div>
          {/* الصوت أسفل الإعداد (علي ٣٠ سبتمبر ٢٠٢٦ — كان كبسولةً في الرأس):
              ضبطٌ لا وجهة، فهو سطرٌ هادئ تحت الفعل لا زرٌّ ينافسه. */}
          <button
            className={'setup-mute' + (mute ? ' off' : '')}
            onClick={toggleMute}
            aria-pressed={mute}
            aria-label={mute ? 'الصوت مكتوم — شغّله' : 'الصوت يعمل — اكتمه'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
              {mute ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.8 9a4.2 4.2 0 0 1 0 6M18.6 6.5a8 8 0 0 1 0 11" />}
            </svg>
            <span>{mute ? 'الصوت مكتوم' : 'الصوت يعمل'}</span>
          </button>
        </div>
      </div>
      </div>

      <style>{setupCss}</style>
    </div>
  )
}
