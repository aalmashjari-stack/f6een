import { useEffect, useMemo, useRef, useState } from 'react'
import type { SetupInput } from '../game/session'
import { STAGE1_CATEGORIES } from '../game/session'
import type { TeamId } from '../game/types'
import { STAGES } from '../game/stages'
import { displayName, playableCategories, subscribeBank } from '../game/bank'
import { categoryArt } from '../components/categoryArt'
import { categoryInfo } from '../components/categoryInfo'
import { CategoryInfoPanel } from '../components/SitePanels'
import { groupCategories } from '../components/categoryGroups'
import { isMuted, play, setMuted } from '../audio/sfx'
import { BrandLogo } from '../components/BrandLogo'
const MIN = 2
const MAX = 6


/** ترتيب الفريق: شارةً فوق بطاقته دائماً، واسماً بديلاً إن تُرك حقل الاسم فارغاً. */
const FALLBACK_TEAM = ['الفريق الأول', 'الفريق الثاني']


/* نسيج الخلفية يعيش في `body::after` بـ theme.css فيشمل كل الشاشات.
   تكراره هنا كان يضاعفه تحت الشعار ويزحمه. */

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
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [players, setPlayers] = useState<[string[], string[]]>([
    ['', ''],
    ['', ''],
  ])
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
  /* أيّ مرحلة شرحُها مفتوح (طلب علي ١٧ سبتمبر ٢٠٢٦): البطاقة سطرٌ واحد
     «1 الجولة الجماعية» وعلامةُ i تفتح الشرح المختصر والنقاط تحته. واحدة
     في كلّ مرّة — الشرح يُقرأ مرّةً لا يُقارَن. */
  const [openStage, setOpenStage] = useState<number | null>(null)
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
         ويُميَّز نصُّها بأنّه ليس أحد الرمزين المعروفين. */
      const msg =
        e instanceof Error
          ? e.message === 'no_balance'
            ? 'انتهى رصيدك — أضف كود هدية من «حسابي»'
            : /^[a-z_]+$/.test(e.message)
              ? 'تعذّر بدء اللعبة، تحقّق من اتصالك'
              : e.message
          : 'تعذّر بدء اللعبة، تحقّق من اتصالك'
      setErr(msg)
      setBusy(false)
    }
  }

  return (
    <div className="screen setup">
      {/* الرأس شريطٌ بدرجةٍ أدفأ من الأرضيّة (طلب علي، ١ سبتمبر ٢٠٢٦) —
          يحمل الشعارَ والقائمة: شراء الألعاب · حسابي · تواصل معنا. */}
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
        {/* ضغطةٌ خارج اللوح تغلقه — ستارٌ شفّاف تحته يلتقطها. */}
        {onNav && menuOpen && <div className="hero-nav-veil" onClick={() => setMenuOpen(false)} />}
        {onNav && (
          <nav className={'hero-nav' + (menuOpen ? ' open' : '')} aria-label="القائمة">
            {/* الشراء أوّلاً وبلون الهويّة: هو النداء التجاريّ الوحيد في
                الشاشة. والاثنان الآخران كبسولتان محايدتان. */}
            <button className="hnav hnav-buy" onClick={() => { setMenuOpen(false); onNav('buy') }}>شراء الألعاب</button>
            <button className="hnav" onClick={() => { setMenuOpen(false); onNav('account') }}>حسابي</button>
            <button className="hnav" onClick={() => { setMenuOpen(false); onNav('rules') }}>شرح اللعبة</button>
            <button className="hnav" onClick={() => { setMenuOpen(false); onNav('contact') }}>تواصل معنا</button>
            {/* الصوت آخر الصفّ ورمزاً بلا نصّ (طلب علي، ٣ سبتمبر ٢٠٢٦ — كان
                في زاوية الهيرو وحده). القائمة صارت أربعة، وكبسولةٌ خامسة
                بنصٍّ تُقرأ صفحةً خامسة وهي ضبطٌ لا وجهة — فالرمز يفرّقها،
                و`aria-label` يحمل ما أسقطه النصّ. */}
            <button
              className={'hnav hnav-mute' + (mute ? ' off' : '')}
              onClick={toggleMute}
              aria-pressed={mute}
              aria-label={mute ? 'الصوت مكتوم — شغّله' : 'الصوت يعمل — اكتمه'}
              title={mute ? 'الصوت مكتوم' : 'الصوت يعمل'}
            >
              <span aria-hidden="true">{mute ? '🔇' : '🔊'}</span>
              {/* نصٌّ يظهر في لوح الطوليّ وحده: رمزٌ وحيد في صفٍّ عريض لا يُقرأ. */}
              <span className="hnav-mute-text">{mute ? 'الصوت مكتوم' : 'الصوت يعمل'}</span>
            </button>
          </nav>
        )}
      </div>

      {/* التمرير على غلافٍ داخليّ لا على ‎.screen.setup‎ نفسها: القصّ
          العموديّ (‎overflow-y:auto‎) يجرّ معه قصّاً أفقيّاً بحكم CSS، فكان
          يبتلع تمدّدَ الشريط تحت أذن الآيفون — يُحسب ولا يُرسم. */}
      <div className="setup-scroll">
      {/* ما بعد الهيرو يتوسّط المساحة الباقية — بلا هذا يتكدّس كل شيء
          في أعلى التابلت الطولي ويبقى ثلثه السفلي فارغاً. */}
      <div className="setup-body">
        {/* شرح المراحل الثلاث — ظاهر دائماً بين الشعار وبطاقتي الفريقين.
            حُذف سطر التقديم فوقها في ٢١ أغسطس ٢٠٢٦ لضيق الارتفاع، وعاد
            لافتةً في ١٧ سبتمبر ٢٠٢٦ (طلب علي: «تمهيد لـ1، 2، 3») بالهيئة
            نفسها التي فوق الفريقين والفئات، فتتماثل الأقسام الثلاثة. */}
        <section className="setup-block">
          <h2 className="setup-title brand">مراحل اللعبة</h2>
          <div className="stages">
            {STAGES.map((s, i) => {
              const open = openStage === i
              return (
                <article key={s.name} className={'stage-card tone-' + i + (open ? ' open' : '')}>
                  {/* السطر كلّه زرّ لا العلامةُ وحدها: هدفٌ بعرض البطاقة أسهل
                      إصابةً من دائرةٍ صغيرة، والعلامة تقول ما يفعله. */}
                  <button
                    className="stage-head"
                    onClick={() => setOpenStage(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={'stage-more-' + i}
                  >
                    <span className="stage-no" aria-hidden="true">{i + 1}</span>
                    <h3 className="stage-name">{s.name}</h3>
                    <span className="stage-info" aria-label={open ? 'أخفِ الشرح' : 'اعرض الشرح'}>i</span>
                  </button>
                  {open && (
                    <div className="stage-more" id={'stage-more-' + i}>
                      {/* الشرح وحده: كبسولة النقاط سقطت في ١٧ سبتمبر ٢٠٢٦ (علي:
                          «شيل سطر النقاط») بعد أن صارت الأرقام داخل الجملة نفسها. */}
                      <p className="stage-desc">{s.desc}</p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        {/* حقول الفريقين. حُذف عنوان «بيانات الفريقين المتنافسين» في ٢١ أغسطس
            ٢٠٢٦: حقولٌ باسم فريق ولاعبين لا تحتاج عنواناً يسمّيها، وارتفاعه
            أنفع للحقول نفسها. */}
        <section className="setup-block">
          {/* عنوانٌ يسمّي الكتلة (طلب علي ١٧ سبتمبر ٢٠٢٦) — كان قد حُذف في
              أغسطس لضيق الارتفاع، وعاد بصياغته. */}
          <h2 className="setup-title">أدخل بيانات الفرق واللاعبين</h2>
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
            <h2 className="setup-title">قم باختيار الفئات</h2>
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
        </div>
      </div>
      </div>

      <style>{`
        /* التمرير مسموح هنا وحدها (قرار علي ٢١ أغسطس ٢٠٢٦) — والمقاسات مع ذلك
           مضبوطة لتسع ٦+٦ لاعبين بلا تمرير في المقاسات الشائعة، فيبقى التمرير
           شبكة أمان لا الوضع الطبيعي. */
        /* حشوةُ الشاشة الأفقيّة مصدرٌ واحد يقرأه الشريطُ ليلغيها بالضبط.
           كانت مكتوبةً رقمين: الحشوة في theme.css والهامش السالب هنا —
           وtheme.css يبدّلها تحت 480px من ‎2.6vw‎ إلى ‎3vw‎ (وهاتفُ علي في
           هذه الطبقة)، فافترق الرقمان وخرج الشريط عن حدّه. */
        body .screen.setup {
          --pad-x: clamp(16px, 2.6vw, 36px);
          /* لا حشوة أفقيّة ولا قصّ على الشاشة نفسها: الحشوة انتقلت إلى
             الغلاف المتمرّر، والقصّ كان يمنع الشريط من بلوغ الحافّة. */
          padding-inline: 0;
          overflow: visible;
        }
        /* الغلاف المتمرّر — هو وحده من يقصّ، والشريط خارجه فلا يُقصّ. */
        .setup-scroll {
          flex:1; min-height:0;
          display:flex; flex-direction:column;
          overflow-y:auto;
          padding-inline: var(--pad-x);
        }
        @media (max-height: 480px) {
          body .screen.setup { --pad-x: clamp(16px, 3vw, 40px); }
        }

        /* الطبقة الأساس للرأس (شريطٌ من حافّة إلى حافّة — الهيئة القديمة):
           الهيئتان تبنيان فوقها، وطبقة «التذكرة» في آخر الملفّ تغلبها في
           الهامش والحشوة والارتفاع والخلفيّة. البدائل بعد كل متغيّر لأنّ
           رموز الهويّة لا تُعرَّف إلا تحت سمتها. */
        body .screen.setup .hero {
          position:relative; flex:none;
          /* الخلفيّة تعبر الأذن والمحتوى يقف عندها — وهما شيئان لا واحد:
             حين أوقفتُ الشريطَ كلَّه عند حدّ الأمان سلم الشعارُ من القصّ
             لكن بقيت شريحتان قشديّتان عند الأذنين («البانر غير مكتمل»).
             فالهامش السالب يبلغ الحافّة الفيزيائية (حشوة الشاشة + إزاحة
             ‎#root‎)، والحشوة تردّ المحتوى إلى داخل الأمان. والجهتان
             منفصلتان: أذن الآيفون في الوضع الأفقيّ على جهةٍ واحدة.
             وعلى الويب ‎env()‎ أصفار، فتعود القاعدة إلى إلغاء الحشوة وحدها. */
          margin-left:calc(-1 * env(safe-area-inset-left));
          margin-right:calc(-1 * env(safe-area-inset-right));
          padding-block:0;
          padding-left:calc(var(--pad-x) + env(safe-area-inset-left));
          padding-right:calc(var(--pad-x) + env(safe-area-inset-right));
          display:flex !important; align-items:center;
          gap:clamp(8px,1.4vw,18px);
          height:clamp(64px, 11dvh, 120px);
          background:var(--n-surface-2, #FFF3E0);
          border-bottom:2.5px solid var(--n-ink, #22201C);
        }

        /* القائمة: الشراء كتلة الهويّة، والبقيّة كبسولات بيضاء بحدّ حبر */
        /* القائمة إلى يسار الشريط (طلب علي) — تدفع نفسها وزرَّ الصوت إلى
           الطرف المقابل للشعار، ويبقى الشعار وحده في اليمين. */
        /* المسافة بين الكبسولات وُسّعت (طلب علي ١٠ سبتمبر ٢٠٢٦): كانت ١٢px
           سقفاً، فتتلاصق الأربعُ في شريطٍ نصفُه فارغ على الشاشة العريضة. */
        body .screen.setup .hero-nav { display:flex; align-items:center; gap:clamp(8px,1.3vw,20px); flex-wrap:wrap; margin-inline-start:auto; }
        body .screen.setup .hnav {
          font:inherit; font-weight:800; cursor:pointer;
          font-size:clamp(11px,1.4vw,15px);
          padding:clamp(5px,.9dvh,9px) clamp(11px,1.6vw,18px);
          border:0; border-radius:999px;
          background:var(--n-surface, #fff); color:var(--n-ink, #22201C);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
          transition:transform .15s var(--ease-spring), box-shadow .15s ease;
        }
        body .screen.setup .hnav:hover { transform:translateY(-1px); box-shadow:0 0 0 2px var(--n-ink,#22201C), 2px 3px 0 var(--n-ink,#22201C); }
        body .screen.setup .hnav-buy { background:var(--n-brand, #E8542F); color:#fff; }

        /* الصوت كبسولةٌ في الصفّ نفسه، مربّعةٌ برمزها وحده — الحشوة الجانبية
           تُساوى بالرأسية فلا تبدو كبسولةً بنصٍّ ناقص بين أخواتها. */
        body .screen.setup .hnav-mute {
          padding-inline:clamp(7px,1vw,11px);
          line-height:1;
          transition:transform .15s var(--ease-spring), box-shadow .15s ease, opacity .2s ease;
        }
        body .screen.setup .hnav-mute.off { opacity:.55; }
        /* زرّ القائمة ولوحُها في طبقة التذكرة آخر الملفّ. */
        body .screen.setup .hnav-menu { display:none; }
        body .screen.setup .hnav-mute-text { display:none; }
        body .screen.setup .hero-nav-veil { display:none; }

        body .screen.setup .hero-logo {
          position:relative; z-index:1;
          width:min(26%, 240px); height:auto; max-height:78%; object-fit:contain;
          /* لا ظلّ: كان لقراءة الشعار فوق صورةٍ داكنة، وعلى القشدة لطخة. */
          animation:brand-in .7s var(--ease-spring) both;
        }
        @keyframes brand-in {
          from { opacity:0; transform:scale(.86) translateY(-10px); }
          to   { opacity:1; transform:none; }
        }

        /* ─── إيقاع الصفحة ───────────────────────────────────────────────
           عمود محدود العرض ومتوسّط: بلا سقف يتمدّد كل سطر على عرض الشاشة
           الكبيرة فيتعب تتبّعه. والفراغ بين الكتل (--gap-block) أوسع من
           الفراغ داخلها (--gap-in) — هذا وحده ما يجعل الأقسام تُقرأ منفصلة. */
        .setup-body {
          --gap-block: clamp(10px, 2.6dvh, 44px);
          --gap-in:    clamp(8px, 1.4dvh, 20px);
          /* ‏1 0 auto لا 1 min-height:0: كان الجسم يتقلّص إلى ارتفاع الغلاف
             فيُسحق محتواه — بطاقاتُ الفئات تحديداً — بدل أن يفيض عنه، فلا
             يعمل تمرير .setup-scroll إلا بالكاد. الآن يكبر على الشاشة الطويلة
             (فتبقى كتلةُ الفعل عند الحافّة السفلى بـmargin-top:auto) ولا
             ينزل تحت مقاس محتواه على القصيرة، فيفيض ويُمرَّر طبيعياً. */
          flex:1 0 auto;
          width:min(100%, 1140px); margin-inline:auto;
          /* فسحة تحت الشريط أوسع من فجوة .screen — المشهد صورة كاملة العرض،
             فيحتاج هواءً يفصله عن النصّ أكثر مما يحتاجه عنصر عاديّ. */
          margin-top:clamp(8px, 1.8dvh, 28px);
          display:flex; flex-direction:column;
          gap:var(--gap-block);
        }
        .setup-block { display:flex; flex-direction:column; gap:var(--gap-in); }
        /* فصل بصري أوضح بين شرح المراحل وحقول الفرق: العنوان التالي لا
           يلتصق بظلال البطاقات، مع إبقاء الإيقاع الداخلي لكل قسم كما هو. */
        .setup-block + .setup-block {
          /* أوسع بطلب علي (١٧ سبتمبر ٢٠٢٦: «زد المسافة» بين تذاكر المراحل
             ولافتة الفريقين) — كانت 1.2dvh بسقف 30px فتُقرأ الأقسام كتلةً
             واحدة على الشاشة العريضة. */
          margin-top:clamp(12px, 3.6dvh, 64px);
        }

        /* كتلة الفعل عند الحافّة السفلى — تبتلع فراغ التابلت الطولي
           بدل أن تتركه معلّقاً تحتها. */
        .setup-foot {
          margin-top:auto; display:flex; flex-direction:column;
          gap:clamp(4px, .9dvh, 16px); padding-top:clamp(2px, .6dvh, 10px);
        }

        /* ─── سطر التقديم ──────────────────────────────────────────────── */
        .stages-intro {
          text-align:center; margin:0;
          color:var(--text-2); font-size:clamp(15px,1.9vw,20px); line-height:1.7;
        }
        /* «فطين» بتصميم مميّز — تدرّج ذهبي↔مرجاني بلونَي العلامة نفسها،
           أكبر من محيطه قليلاً وبوهج خافت، فيُقرأ كاسم اللعبة لا كلمة عابرة. */
        .brand-inline {
          font-weight:800; font-size:1.35em;
          background:linear-gradient(120deg, var(--gold) 0%, #FFD98A 45%, var(--coral) 100%);
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent; color:transparent;
          padding-inline:2px;
          text-shadow:0 0 22px rgba(255,189,89,.28);
          letter-spacing:.5px;
        }

        /* ─── عنوان بفاصل مزخرف ────────────────────────────────────────
           الخيطان يحصران العنوان فيقرأ كعتبة قسم لا كسطر تائه. متماثل
           فلا يتغيّر باتجاه الكتابة. */
        .setup-rule {
          display:flex; align-items:center; gap:clamp(12px, 2vw, 22px);
          margin:0; font-size:clamp(16px,2vw,21px); font-weight:800;
          color:var(--gold); letter-spacing:.3px;
        }
        .setup-rule::before, .setup-rule::after {
          content:''; flex:1; height:1px;
          background:linear-gradient(90deg, transparent, rgba(255,189,89,.34), transparent);
        }
        .setup-rule span { white-space:nowrap; }

        /* ─── بطاقتا الفريقين ─────────────────────────────────────────── */
        .teams-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(16px, 2.2vw, 28px); }
        /* البطاقة تتقلّص مع عمودها بدل أن تفرض عرض محتواها على الشبكة. */
        .team-card { min-width:0; }
        .team-card {
          display:flex; flex-direction:column; gap:clamp(6px, 1.1dvh, 16px);
          padding:clamp(10px,1.7dvh,26px) clamp(12px,1.6vw,24px);
          background:linear-gradient(165deg,
            color-mix(in srgb, var(--surface-2) 94%, transparent),
            color-mix(in srgb, var(--surface) 80%, transparent) 68%);
          border:2px solid var(--border);
          border-radius:clamp(24px, 3.8dvh, 36px);
          box-shadow:var(--lift);
          transition:border-color .3s ease, box-shadow .3s ease;
        }
        .team-card.starter { border-color:var(--gold); box-shadow:var(--lift), var(--glow-gold); }

        /* شارة الترتيب — تسمّي البطاقة قبل أن يُكتب فيها اسم، فلا تبقى مجهولة. */
        .team-badge {
          align-self:center; padding:clamp(1px,.35dvh,5px) 14px; border-radius:999px;
          border:1px solid var(--border); background:rgba(15,44,66,.55);
          color:var(--text-2); font-size:clamp(10px,1.1vw,13px); font-weight:700; line-height:1.4;
          transition:color .3s ease, border-color .3s ease;
        }
        .team-card.starter .team-badge { color:var(--gold); border-color:rgba(255,189,89,.5); }

        .team-name {
          background:transparent; border:none; border-bottom:2px solid var(--border);
          color:var(--gold); font-weight:800; font-size:clamp(15px,1.9vw,24px);
          font-family:inherit; text-align:center; padding:clamp(1px,.45dvh,9px) 8px; outline:none;
          line-height:1.35;
          transition:border-color .2s ease;
        }
        .team-name::placeholder { color:var(--text-3); font-weight:700; }

        .players { display:flex; flex-direction:column; gap:clamp(4px, .8dvh, 11px); }
        /* من خمسة لاعبين فصاعداً يقف الحقلان جنباً إلى جنب: ستة أسماء في
           ثلاثة صفوف بدل ستة. البطاقة عريضة أصلاً (نصف الشاشة) والاسم قصير،
           فالعرض متوفّر والارتفاع هو الشحيح. هذا يوفّر نصف ارتفاع القائمة
           بلا أن يصغر حرفٌ واحد — والبديل كان ضغط الحقول حتى تتلاصق. */
        .players:has(.player:nth-child(5)) {
          display:grid; grid-template-columns:1fr 1fr;
          gap:clamp(4px, .8dvh, 11px) clamp(6px, .8vw, 12px);
        }
        /* الحشوة الرأسية هي ما يتنازل مع ستّة لاعبين — لا حجم الحرف: الاسم
           يُقرأ عن بُعد، والفراغ حوله لا. */
        .player {
          background:rgba(15,44,66,.6); border:1px solid var(--border);
          border-radius:999px; color:var(--cream); font-family:inherit;
          font-size:clamp(13px,1.4vw,17px); padding:clamp(5px,.95dvh,12px) 20px; outline:none; text-align:center;
          /* بلا هذا لا يتقلّص عمود الشبكة تحت عرض النصّ الافتراضي (min-width
             الضمني = auto)، فتتمدّد البطاقة وتخرج من الشاشة أفقياً. */
          min-width:0;
          transition:border-color .2s ease, background .2s ease;
        }
        .player::placeholder { color:var(--text-3); }
        .player:focus, .team-name:focus { border-color:var(--gold); }
        .player:focus { background:rgba(15,44,66,.9); }

        /* خيط فاصل فوق العدّاد — يفصل ضبط العدد عن حقول الأسماء. */
        .counter {
          display:flex; align-items:center; justify-content:center; gap:16px;
          color:var(--text-2); font-weight:700; font-size:clamp(12px,1.3vw,16px);
          padding-top:clamp(2px, .55dvh, 13px);
          border-top:1px solid var(--border);
        }
        .pill {
          flex:none;
          width:clamp(24px,3.4dvh,40px); height:clamp(24px,3.4dvh,40px);
          border-radius:50%; border:1px solid var(--border);
          background:rgba(15,44,66,.6); color:var(--cream);
          font-size:clamp(16px,2.2dvh,21px); cursor:pointer;
          transition:transform .15s var(--ease-spring), border-color .2s ease, color .2s ease;
        }
        @media (hover:hover) { .pill:not(:disabled):hover { border-color:var(--gold); color:var(--gold); } }
        .pill:active { transform:scale(.9); }
        .pill:disabled { opacity:.3; cursor:default; }

        /* ─── القرعة والأزرار ─────────────────────────────────────────── */
        /* الخانة تبقى محجوزة وإن كانت فارغة: نتيجة القرعة تحلّ محلّها لاحقاً،
           وبلا حجزها يقفز الزرّان تحتها لحظة ظهورها. */
        .toss { text-align:center; min-height:clamp(18px,2.8dvh,38px); display:grid; place-items:center; }
        .toss-result { font-size:clamp(14px,2vw,26px); font-weight:700; line-height:1.35; }
        .toss-result b { color:var(--gold); }
        .toss-result.missing { color:var(--text-2); font-weight:700; }
        .toss-result.missing.alert { color:var(--coral); font-weight:900; }
        .toss-note { color:var(--text-2); font-weight:700; font-size:.72em; }

        /* الزرّان في صفّ على الشاشة العريضة — «ابدأ اللعبة» يأخذ الثلثين
           فيبقى الفعل الأساسي هو الأكبر، والقرعة إلى جانبه لا فوقه. */
        .setup-actions { display:flex; gap:clamp(10px, 1.4vw, 16px); }
        .setup-actions .action { flex:1; min-width:0; }
        /* **القرعة بمقاس نصّها لا بثلث الصفّ** (طلب علي ١٠ سبتمبر ٢٠٢٦):
           كانت تأخذ حصّةً من الصفّ فتبلغ ٣٩٣px لكلمتين، وهي فعلٌ ثانويّ إلى
           جانب «ابدأ اللعبة». وحدُّ العرض الأقصى مع min-width صفراً أعلاه
           يمنعانها أن تفيض عن الصفّ مهما طال نصُّها أو ضاقت الشاشة.
           (ولا علامة اقتباسٍ خلفية في تعليقات هذا الملفّ: الأنماط كلُّها
           داخل template literal، فالعلامة تُنهيه وتُسقط الملفّ كلَّه.) */
        .setup-actions .action.ghost {
          flex:0 0 auto; max-width:100%;
          padding-inline:clamp(16px,2.2vw,30px);
        }
        /* الزر يتنازل عن سُمكه الرأسي مع ضيق الارتفاع ويبقى عريضاً سهل الإصابة. */
        .setup-actions .action {
          padding:clamp(9px,1.7dvh,26px) 28px;
          font-size:clamp(16px,2.2vw,28px);
        }

        /* ─── الجوال ────────────────────────────────────────────────────
           البطاقات تصير صفوف قائمة: الرقم إلى جانب النص لا فوقه — أقصر
           بالنصف، وأقرب لما تألفه العين على الشاشة الضيّقة. */
        @media (max-width:640px){
          .stages{ grid-template-columns:1fr; }
          .teams-grid{ grid-template-columns:1fr; }
          .setup-actions{ flex-direction:column; }

          /* على الجوال تعطي نسبة الصورة شريطاً بارتفاع ٧٦px — رفيعاً تضيع
             فيه العائلة. فيُفرض ارتفاع أعلى، و cover يقصّ الأطراف ويُبقي
             التلفاز ومن حوله. */
          body .screen.setup .hero { height:clamp(84px, 14dvh, 130px); }

        }

        /* ─── شاشة قصيرة (١٠٢٤×٦٠٠ مثلاً) ─────────────────────────────
           كل شيء ينكمش حتى يبقى زر «ابدأ اللعبة» فوق الحافّة — الفعل
           الأساسي لا يجوز أن يسقط تحت الطيّة. */
        @media (max-height:560px) {
          /* الشاشة القصيرة لا تحتمل نسبة الصورة كاملةً (٢٠٪ من العرض)،
             فيُفرض ارتفاع صغير و cover يقصّ وسط المشهد. */
          /* أعلى ممّا كان بطلب علي (١ سبتمبر ٢٠٢٦): على الجوال الأفقيّ
             كان الشريط ٦٤px فيخنق الشعار وشريطَ السدو معاً. */
          body .screen.setup .hero { height:clamp(78px, 20dvh, 104px); }
          .hero-logo { width:min(40%, 320px); max-height:70%; }
          /* الشاشة القصيرة تملأ نفسها بالضبط، فلا فسحة إضافية تُحتمل. */
          .setup-body { --gap-block:clamp(6px,1.4dvh,14px); --gap-in:clamp(5px,1dvh,10px); margin-top:0; }
          .setup-block + .setup-block { margin-top:clamp(5px,1.2dvh,12px); }


          /* هذه القيم كانت أكبر من أرضيات الوضع الافتراضي بعد إعادة الضبط،
             فكانت تنفخ الشاشة القصيرة بدل أن تشدّها — وهي مكتوبة صريحة
             بالبكسل فتغلب الـclamp مهما صغرت أرضيته. */
          .team-card { padding:8px 12px; gap:6px; }
          .team-badge { display:none; }
          .team-name { font-size:clamp(15px,1.8vw,19px); padding:2px 8px; line-height:1.3; }
          .players { gap:5px; }
          .player { padding:4px 14px; font-size:13px; line-height:1.35; }
          .counter { padding-top:4px; gap:12px; font-size:12px; }
          .pill { width:26px; height:26px; font-size:16px; }

          .toss { min-height:20px; }
          .toss-result { font-size:clamp(14px,1.9vw,19px); }
          .setup-actions .action { padding:8px 22px; font-size:clamp(15px,2vw,20px); }
        }

        /* ─── جوال أفقي (٤٨٠px ارتفاعاً فما دون) ────────────────────────
           آخر ما يمكن التنازل عنه قبل الحشر: شرح المراحل الثلاث يسقط كاملاً.
           هو نصٌّ يُقرأ مرّة قبل أول جلسة، والفاصل يعيد قاعدة كل مرحلة قبلها
           على أي حال — بينما حقول اللاعبين وزر البدء لا بديل عنها. */
        @media (max-height:480px) {
          /* ثلاثة أعمدة: ستة أسماء في صفّين بدل ثلاثة. */
          .players:has(.player:nth-child(5)) { grid-template-columns:repeat(3, 1fr); }
        }

        /* ===== فئات الجولة الجماعية ===== */
        /* الرأس عمودٌ في الوسط: نداءٌ فعدّاد، والثاني أصغر من الأول. */
        .cats-head {
          display:flex; flex-direction:column; align-items:center; gap:clamp(2px,.5dvh,6px);
          margin:clamp(12px,2.6dvh,30px) 0 clamp(10px,2dvh,20px);
          text-align:center;
        }
        .cats-lead { margin:0; font-size:clamp(15px,2vw,22px); font-weight:900; color:var(--gold); }
        @keyframes count-pop {
          from { transform:scale(.72); opacity:.4; }
          to   { transform:scale(1);   opacity:1; }
        }
        /* دخولُ الشبكة متتابعاً: البطاقة تلي أختها بأربعين جزءاً من الثانية،
           فتُقرأ الشبكةُ وهي تُبنى بدل أن تظهر دفعةً واحدة. والسقف عند العاشرة
           حتى لا تنتظر الأخيرةُ نصف ثانية. */
        .catchip {
          animation:chip-in .34s var(--ease-spring) both;
          animation-delay:calc(min(var(--i, 0), 10) * 40ms);
        }
        @keyframes chip-in {
          from { transform:translateY(10px) scale(.94); opacity:0; }
          to   { transform:none; opacity:1; }
        }
        /* علامةُ الصحّ تقفز حين تُولد — الاختيار فعلٌ فليكن له أثرٌ يُرى. */
        .catchip.taken .cc-tick { animation:tick-pop .3s var(--ease-spring) both; }
        @keyframes tick-pop {
          from { transform:scale(0) rotate(-25deg); }
          to   { transform:scale(1) rotate(0); }
        }
        /* إعلانُ الاكتمال يهبط لا يظهر فجأة. */
        .cats-turn.done { animation:count-pop .36s var(--ease-spring) both; }

        /* من أوقف الحركة في نظامه لا تُفرض عليه: تبقى الحالة النهائية بلا انتقال. */
        @media (prefers-reduced-motion: reduce) {
          .catchip, .cats-turn.done, .catchip.taken .cc-tick { animation:none; }
        }
        /* شارةُ الدور تلبس لون صاحبه — الفريقان بلونين ثابتين لا بترتيب الظهور */
        .cats-turn {
          margin-inline-start:auto;
          font-size:clamp(11px,1.3vw,14px); font-weight:800;
          padding:.2em .8em; border-radius:999px;
        }
        .cats-turn.done { background:var(--surface-2); color:var(--text-2); }
        .cats-turn.team-0 { background:var(--gold); color:var(--on-gold); }
        .cats-turn.team-1 { background:var(--coral); color:var(--on-coral); }

        /* شبكة تلقائية لا بعدد ثابت: الفئات تُضاف من اللوحة فيتغيّر عددها. */
        /* بطاقةٌ كبيرة تُرى رسمتُها من بعيد (طلب علي، ٣ سبتمبر ٢٠٢٦): الشبكة
           تختار الفئة بصورتها لا باسمها وحده، والبطاقة الصغيرة تجعل الرسمة
           زخرفةً لا دليلاً. والارتفاع الزائد يبتلعه تمريرُ الإعداد — وهي
           الشاشة الوحيدة المسموح لها بالتمرير. */
        /* أقسام التصنيفات — عنوانٌ وشبكةٌ تحته. الفراغ بينها أوسع من الفراغ
           داخلها: هذا وحده ما يقول إنّ القسم انتهى وبدأ غيرُه، لا خطٌّ فاصل
           يزيد الشاشةَ أثاثاً. */
        .cats-sec + .cats-sec { margin-top:clamp(14px,1.8vw,26px); }
        /* عنوانٌ صغيرٌ هادئ لا يزاحم بطاقاته: البطاقة هي المضغوطة، والعنوان
           يدلّ عليها. والخطّ تحته بلونٍ خافت يمدّ العنوان عبر الشبكة فتُقرأ
           الأقسام من آخر المجلس بمسحةِ عين. */
        .cats-sec-title {
          margin:0 0 clamp(6px,0.8vw,12px);
          display:flex; align-items:center; gap:10px;
          font-size:clamp(13px,1.15vw,17px); font-weight:800;
          color:var(--text-2); letter-spacing:.2px;
        }
        .cats-sec-title::after {
          content:''; flex:1; height:1px; background:var(--border);
        }
        .cats-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(clamp(116px,13vw,172px), 1fr));
          gap:clamp(8px,1.1vw,16px);
        }
        /* البطاقة رسمةُ الفئة كاملةً، والاسم على لوحةٍ داكنة أسفلها — نفس بناء
           بطاقة العجلة: الرسمات فاتحة متباينة والاسمُ عليها عارياً يضيع. */
        .catchip {
          position:relative; overflow:hidden;
          display:flex; flex-direction:column; justify-content:flex-end;
          /* بطاقةٌ طوليّة كورق اللعب (طلب علي، ٣ سبتمبر ٢٠٢٦) — النسبة تحكم
             الارتفاع فلا يُخمَّن بـvh، وتصمد على كلّ عرض.
             **والرسمات ٣:٢ عرضيّة** (SPEC §١١)، فـcover يقصّ جانبيها ويُبقي
             نحو نصف العرض من الوسط. هذا ثمن الشكل الطوليّ ما لم تُستبدل
             الرسمات بمصادر طوليّة. */
          aspect-ratio:3 / 4;
          min-width:0;
          padding:0;
          font-family:inherit; cursor:pointer; text-align:center;
          border-radius:14px;
          border:2px solid var(--border);
          background-color:var(--surface-2);
          color:var(--text-2);
          transition:border-color .2s ease, color .2s ease, transform .12s var(--ease-spring);
        }
        .cc-img {
          position:absolute; inset:0;
          --art:none;
          background-image:var(--art);
          background-size:cover;
          background-position:center;
          transition:filter .25s ease, opacity .25s ease;
        }
        .cc-plate {
          position:relative; z-index:1;
          display:flex; flex-direction:column; align-items:center; gap:1px;
          min-width:0;
          padding:clamp(30px,5dvh,58px) 7px clamp(8px,1.4dvh,15px);
          background:linear-gradient(to top, rgba(14,11,22,.9) 0%, rgba(14,11,22,.6) 50%, rgba(14,11,22,0) 100%);
        }

        /* اكتمل اللوح: الشبكة كلّها ترمدّ — نفس معالجة الفئة المستهلَكة في
           العجلة (SPEC ٧)، ظاهرةٌ باهتة لا مخفيّة. والمختارة تحتفظ بحدّها
           واسم فريقها فوق الرمادي. */
        .catchip.dimmed { opacity:.55; }
        .catchip.dimmed:not(.taken) { cursor:default; }
        .catchip.dimmed .cc-img { filter:grayscale(1) brightness(.6); }
        /* المختارة تبقى قابلة للسحب بضغطة — وهو طريق التراجع الوحيد بعد
           اكتمال اللوح، فلا تُقفل معها. */
        .catchip.dimmed.taken { opacity:.78; }
        .catchip:not(.dimmed):active, .catchip.taken:active { transform:scale(.97); }
        .catchip:focus-visible { outline:none; border-color:var(--gold); }
        @media (hover:hover) { .catchip:not(.dimmed):hover, .catchip.taken:hover { color:var(--cream); border-color:var(--text-3); } }
        .cc-name {
          font-size:clamp(14px,1.85vw,23px); font-weight:800; line-height:1.2; color:#fff;
          max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          text-shadow:0 1px 3px rgba(0,0,0,.45);
        }
        .catchip.taken .cc-plate { background:linear-gradient(to top, rgba(14,11,22,.94) 0%, rgba(14,11,22,.7) 55%, rgba(14,11,22,.08) 100%); }
        /* المختارة: حدٌّ سميك، ورسمتُها تصفو، وعلامةُ صحّ في الزاوية. ثلاث
           إشارات لا واحدة — البطاقة صغيرة وفوقها رسمة، فالحدّ وحده يضيع. */
        .catchip.taken { border-color:var(--gold); border-width:4px; }
        .catchip.taken .cc-img { filter:saturate(1.15); }
        .cc-tick {
          position:absolute; z-index:2; top:6px; inset-inline-start:6px;
          display:none; place-items:center;
          width:clamp(24px,3.2vw,34px); aspect-ratio:1;
          border-radius:999px;
          background:var(--gold); color:#1a1626;
          font-size:clamp(14px,1.9vw,20px); font-weight:900; line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,.35);
        }
        .catchip.taken .cc-tick { display:grid; }
        /* الخليّة تحمل البطاقة وعلامة (i) فوقها — البطاقة تملأها كما كانت
           تملأ خانة الشبكة. */
        .cc-cell { position:relative; min-width:0; }
        .cc-cell > .catchip { width:100%; }
        /* علامة (i): الزاوية المقابلة لعلامة الصحّ، حلقةُ حبرٍ على أبيض كعلامة
           شرح المراحل — تُقرأ فوق أيّ رسمة. ولا تُرمَّد مع الشبكة المكتملة:
           معرفةُ الفئة لا تُقفل باكتمال اللوح. */
        .cc-info {
          position:absolute; z-index:3; top:6px; inset-inline-end:6px;
          display:grid; place-items:center;
          width:clamp(26px,3.2vw,34px); aspect-ratio:1; padding:0;
          border:0; border-radius:999px; cursor:pointer;
          background:#fff; color:var(--n-ink, #22201C);
          box-shadow:0 0 0 2px var(--n-ink, #22201C), 0 2px 6px rgba(0,0,0,.3);
          font-family:'Cairo', serif; font-style:italic; font-weight:800;
          font-size:clamp(14px,1.8vw,18px); line-height:1;
          animation:chip-in .34s var(--ease-spring) both;
          animation-delay:calc(min(var(--i, 0), 10) * 40ms);
        }
        /* الدائرة صغيرةٌ على الجوّال (24px)، فمساحةُ الضغط أوسع منها بغلافٍ
           شفّاف — لا تكبر العلامة فتغطّي الرسمة. */
        .cc-info::after { content:''; position:absolute; inset:-8px; }
        .cc-info:active { transform:scale(.9); }
        .cc-info:focus-visible { outline:3px solid var(--gold); outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) { .cc-info { animation:none; } }

        /* ─── بطاقات المراحل (١٧ سبتمبر ٢٠٢٦، طلب علي) ────────────────────
           تذكرةٌ لكلّ مرحلة: لسانٌ ملوّن في طرف البداية يحمل الرقم، فالاسم،
           فعلامة i في الطرف الآخر — وضغطةٌ على السطر تفتح الشرح المختصر
           والنقاط تحته. الجسم أبيض بحدّ حبرٍ كسائر الكتل، والظلُّ الصلب
           بلون المرحلة فتُقرأ الثلاث سلسلةً ملوّنة بلا التباسٍ ببطاقتَي
           الفريقين. الوزن html[data-skin] body .screen.setup ليغلب قواعدَ
           الهويّتين على .stage-card. */
        html[data-skin] body .screen.setup .stages {
          display:grid; grid-template-columns:repeat(3, 1fr);
          gap:clamp(10px, 1.4vw, 20px); width:100%; margin:0;
          /* كلّ تذكرة بارتفاع محتواها: الافتراضيّ stretch يمدّ المغلقتين إلى
             ارتفاع المفتوحة فتنتفخان فراغاً أبيض ولسانهما يقف عند السطر
             (علي ١٧ سبتمبر ٢٠٢٦: «عند فتح واحدة لماذا يظهر هكذا»). */
          align-items:start;
        }
        html[data-skin] body .screen.setup .stage-card {
          position:relative; overflow:hidden; display:flex; flex-direction:column;
          padding:0; border:0; border-radius:18px; transform:none;
          background:var(--n-surface, #fff);
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 5px 6px 0 var(--tone);
          transition:transform .15s var(--ease-spring);
        }
        /* درجاتٌ هادئة فاتحة (طلب علي): اللسانُ يحمل رقماً حبريّاً فلا ينزل
           اللون تحت ما يُقرأ عليه. */
        html[data-skin] body .screen.setup .stage-card.tone-0 { --tone:#FFD966; --tone-soft:#FFF4CC; }
        html[data-skin] body .screen.setup .stage-card.tone-1 { --tone:#8FD9D6; --tone-soft:#E1F5F4; }
        html[data-skin] body .screen.setup .stage-card.tone-2 { --tone:#FFB399; --tone-soft:#FFE6DC; }
        html[data-skin] body .screen.setup .stage-head {
          display:flex; align-items:stretch; gap:0; width:100%; padding:0;
          font:inherit; color:var(--n-ink, #22201C); background:transparent; border:0;
          cursor:pointer; text-align:start;
        }
        html[data-skin] body .screen.setup .stage-head:active { transform:translate(1px,1px); }
        /* اللسان: كتلةٌ بلون المرحلة بارتفاع السطر، يفصلها حدُّ حبر عن الجسم. */
        html[data-skin] body .screen.setup .stage-no {
          flex:none; width:clamp(48px,5.4vw,58px); min-height:clamp(46px,6.2dvh,58px);
          display:grid; place-items:center; border-radius:0;
          background:var(--tone); color:var(--n-ink, #22201C);
          border-inline-end:2.5px solid var(--n-ink, #22201C);
          font-weight:800; font-size:clamp(20px,2vw,24px); line-height:1;
          box-shadow:none; transform:none;
        }
        html[data-skin] body .screen.setup .stage-name {
          flex:1; min-width:0; margin:0; align-self:center;
          padding-inline:clamp(12px,1.4vw,16px);
          color:var(--n-ink, #22201C); font-weight:800; font-size:clamp(16px,1.7vw,20px);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        /* علامة i: حلقةُ حبرٍ رفيعة، تمتلئ حبراً حين يُفتح الشرح. */
        html[data-skin] body .screen.setup .stage-info {
          flex:none; align-self:center; margin-inline-end:clamp(12px,1.4vw,16px);
          width:26px; height:26px; border-radius:50%;
          display:grid; place-items:center;
          background:var(--tone-soft); color:var(--n-ink, #22201C);
          box-shadow:0 0 0 2px var(--n-ink, #22201C);
          font-family:'Cairo', serif; font-style:italic; font-weight:800; font-size:15px; line-height:1;
          transition:background .15s ease, color .15s ease;
        }
        html[data-skin] body .screen.setup .stage-card.open .stage-info { background:var(--n-ink, #22201C); color:#fff; }
        /* الشرح: لوحٌ بلون المرحلة الخفيف داخل الجسم، يهبط بحركةٍ قصيرة. */
        html[data-skin] body .screen.setup .stage-more {
          display:flex; flex-direction:column; align-items:center; gap:8px;
          margin:0 clamp(10px,1.2vw,14px) clamp(10px,1.4dvh,14px);
          padding:clamp(10px,1.4dvh,14px) clamp(12px,1.4vw,16px);
          border-radius:12px; background:var(--tone-soft);
          animation:stage-more-in .22s var(--ease-spring) both;
        }
        @keyframes stage-more-in {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:none; }
        }
        html[data-skin] body .screen.setup .stage-desc {
          display:block; margin:0; text-align:center;
          color:var(--n-ink, #22201C); font-weight:600; font-size:clamp(13px,1.45vw,16px); line-height:1.6;
        }
        @media (prefers-reduced-motion: reduce) { html[data-skin] body .screen.setup .stage-more { animation:none; } }
        /* عنوان كتلة الفريقين: لافتةٌ بيضاء بحدّ حبرٍ وظلٍّ صلب في الوسط —
           شارةُ «الفريق الأول» نفسُها أكبر، فتُقرأ من عائلة الصفحة لا سطراً
           عارياً (طلب علي ١٧ سبتمبر ٢٠٢٦: «نسّق الجملة»). */
        html[data-skin] body .screen.setup .setup-title {
          align-self:center; margin:0;
          padding:clamp(6px,1dvh,9px) clamp(18px,2.4vw,26px);
          border-radius:999px; background:var(--n-surface, #fff);
          box-shadow:0 0 0 2px var(--n-ink, #22201C), 3px 4px 0 var(--n-ink, #22201C);
          color:var(--n-ink, #22201C); font-weight:800; font-size:clamp(15px,1.7vw,19px);
          line-height:1.4; text-align:center;
        }
        /* لافتة المراحل بلون الهويّة (طلب علي ١٧ سبتمبر ٢٠٢٦: «أضف لون»):
           البرتقاليّ الأحمر هو لون العناوين في blocks.css، فالكتلة به ونصّها
           أبيض، والحدّ والظلّ حبرٌ كما هما. */
        html[data-skin] body .screen.setup .setup-title.brand {
          background:var(--n-brand, #E8542F); color:#fff;
          /* فسحةٌ أوسع تحتها من فسحة الكتلة (طلب علي): اللافتة تمهيدٌ
             للتذاكر الثلاث لا سطرَ عنوانٍ ملاصقاً لها. */
          margin-bottom:clamp(8px, 1.6dvh, 22px);
        }
        /* الجوال الطوليّ: أضيق قليلاً (علي ١٧ سبتمبر ٢٠٢٦: «صغّر المسافة
           قليلاً» عن لقطة الآيفون) — الموقع العريض على مقاسه المعتمَد. */
        @media (orientation: portrait) and (max-width:640px) {
          html[data-skin] body .screen.setup .setup-title.brand { margin-bottom:clamp(2px, .7dvh, 8px); }
        }
        /* الجوال: المراحل عموداً، والشرح المفتوح يدفع ما تحته (الإعداد يُمرَّر). */
        @media (max-width:640px) {
          html[data-skin] body .screen.setup .stages { grid-template-columns:1fr; gap:10px; }
        }

        /* ─── الوضع الطوليّ ─────────────────────────────────────────────
           التطبيقُ المثبَّت يُعرض قبل «ابدأ اللعبة» كيف أُمسك الجهاز (قرار علي
           ١٦ سبتمبر ٢٠٢٦؛ الاتجاه في src/lib/orientation.ts) — والجوالُ في
           اليد طوليّ. المقاسات أعلاه مبنيّة على dvh بافتراض شاشةٍ عريضة
           قصيرة، وفي الطول يتضخّم dvh (874 بدل 390) فينتفخ رقمُ المرحلة إلى
           38px والشعارُ إلى سقفه. هنا تُقيَّد بالعرض. والموقع لا يبلغ هذه
           الطبقة على اللمس: بوّابتُه تحجب الطوليّ قبلها. */
        /* ─── الهيرو تذكرةٌ لا شريط (١٧ سبتمبر ٢٠٢٦) ────────────────────
           كان شريطاً أبيض بعرض الشاشة يعبر شريطَ الحالة، بشعارٍ صغير وكبسولات
           بجانبه — يُقرأ شريطَ أدوات لا واجهةً. صار تذكرةً كبيرة بلغة الصفحة
           نفسها: كتلة بيضاء داخل هوامش الصفحة، بحدّ حبرٍ وظلٍّ صلب كبطاقات
           المراحل والفريقين تحتها، والشعارُ فيها كبيرٌ.
           بُنيت للجوال الطوليّ أوّلاً، ثمّ عُمّمت على العرض والموقع في اليوم
           نفسه (علي: «غيّر الهيرو في الموقع نفس التطبيق») — فسقط شريطُ السدو
           من العرض. وما يفترق: في العرض تبقى الكبسولات صفّاً داخل التذكرة
           بلا زرّ ☰ («ما تحتاج toggle menu في الموقع»)، وفي الجوال الطوليّ
           وحده تنطوي خلف ☰ لوحاً ينسدل تحتها. الوزن html[data-skin] body
           .screen.setup يغلب قواعد الشريط في blocks.css وneo.css وshowtime.css. */
        html[data-skin] body .screen.setup .hero {
          position:relative; overflow:visible;
          justify-content:space-between; align-items:center;
          height:auto; min-height:0;
          /* داخل الهوامش لا عابرةً للحافّة: ‎#root‎ يترك شريطَ الحالة فوقها. */
          margin:10px var(--pad-x) 0;
          padding:clamp(24px,3.6dvh,32px) clamp(16px,2vw,28px);
          border:0; border-radius:22px;
          background:var(--n-surface, #fff);
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 5px 6px 0 var(--n-ink, #22201C);
        }
        /* بلا نسيج ولا سدو (علي ١٧ سبتمبر ٢٠٢٦: «ما أبي سدو، مو لازم»)، ثمّ
           «لمسة خفيفة»: تذكرةٌ حقّاً — غسلةٌ ناعمة بلونَي الفريقين تعبر
           الكتلة قطريّاً (أصفر عند البداية، تركواز عند النهاية) لا تتجاوز
           العشرين بالمئة، وخطُّ تثقيبٍ منقّط داخل الحدّ كما في التذاكر.
           لا شكل ولا نقش — لونٌ خافت وخطٌّ واحد. */
        html[data-skin='blocks'] body .screen.setup .hero::before {
          content:''; position:absolute; inset:0; z-index:0; pointer-events:none;
          border-radius:inherit;
          background:linear-gradient(to bottom left, rgba(255,206,60,.22), rgba(255,255,255,0) 52%, rgba(123,211,208,.18));
        }
        html[data-skin] body .screen.setup .hero::after {
          content:''; position:absolute; inset:7px; z-index:0; pointer-events:none;
          border:1.5px dashed rgba(34,32,28,.34); border-radius:15px;
        }
        html[data-skin] body .screen.setup .hero-logo.f6een-mark {
          font-size:clamp(46px,13.5vw,60px);
          /* بلا هامش: showtime.css يعطيه هامشَ بدايةٍ 20px ليبتعد عن القائمة
             في العرض — الحشوة هنا تكفي؛ وفي الطوليّ كان يزيح الشعار عشرة
             بكسلات عن المنتصف (قِيس: مركزه 191 والشريط 201). */
          margin:0;
        }
        /* العرض: الشعار في اليمين (طلب علي: «ضع الشعار في اليمين») والكبسولات
           صفٌّ في اليسار — الترتيب الذي كان في الشريط، داخل التذكرة؛ والغسلة
           القطريّة نفسها التي في هيرو التطبيق («أضف تدرّج لوني خفيف»).
           وعلى الشاشة العريضة تتّسع المساحات (علي: «وسّع المساحات، لديك
           المساحة الكافية في الموقع»): حشوةٌ أعرض داخل التذكرة، شعارٌ أكبر،
           وكبسولاتٌ أكبر بفواصل أوسع — مقاسات الجوال كانت تُترك كما هي على
           شاشةٍ بعرض ألفَي بكسل فتبدو التذكرةُ فارغةً وأطرافُها مزدحمة. */
        @media (min-width:900px) and (orientation: landscape) {
          html[data-skin] body .screen.setup .hero {
            padding:clamp(28px,4.2dvh,48px) clamp(32px,3.2vw,72px);
            border-radius:28px;
          }
          html[data-skin] body .screen.setup .hero::after { inset:9px; border-radius:20px; }
          html[data-skin] body .screen.setup .hero-logo.f6een-mark {
            font-size:clamp(60px,4.6vw,96px);
          }
          html[data-skin] body .screen.setup .hero-nav { gap:clamp(14px,1.4vw,30px); }
          html[data-skin] body .screen.setup .hnav {
            font-size:clamp(15px,1.05vw,21px);
            padding:clamp(10px,1.3dvh,15px) clamp(20px,1.6vw,34px);
          }
          html[data-skin] body .screen.setup .hnav-mute { padding-inline:clamp(12px,1vw,18px); }
          /* فسحة أوسع بين التذكرة و«مراحل اللعبة» (علي: «انزل وزد المسافة») —
             تغلب clamp(18px,4.5dvh,56px) التي في blocks.css. */
          html[data-skin] body .screen.setup .setup-body { margin-top:clamp(56px, 12dvh, 150px); }
          /* وبين الأقسام كذلك (علي: «زد» عن المسافة بين التذاكر ولافتة الفريقين). */
          html[data-skin] body .screen.setup .setup-block + .setup-block { margin-top:clamp(40px, 8dvh, 120px); }
        }
        /* الجوال الأفقيّ على الويب (≤480 ارتفاعاً): حشوةٌ أخفّ فلا تأكل
           التذكرةُ ثلث الشاشة — الإعداد يُمرَّر لكنّ الزينة لا تشتري تمريراً. */
        @media (max-height:480px) {
          html[data-skin] body .screen.setup .hero { padding-block:12px; }
        }
        /* ─── الجوال الطوليّ: الكبسولات خلف ☰ ─── */
        @media (orientation: portrait) and (max-width:640px) {
          html[data-skin] body .screen.setup .hero { justify-content:center; padding-inline:16px; }
          html[data-skin] body .screen.setup .hnav-menu {
            display:grid; place-items:center;
            position:absolute; z-index:2;
            /* يسار الكتلة (طلب علي): نهاية السطر في RTL. */
            inset-inline-end:12px; top:12px;
            width:38px; height:38px; padding:0;
            font-size:19px; line-height:1;
            box-shadow:0 0 0 2px var(--n-ink, #22201C), 2px 3px 0 var(--n-ink, #22201C);
          }
          html[data-skin] body .screen.setup .hnav-menu.open { background:var(--n-ink, #22201C); color:#fff; }
          /* اللوح: مخفيّ حتى يُفتح، ثمّ عمودٌ بعرض الشاشة تحت التذكرة مباشرةً،
             بالهيئة نفسها فيُقرأ امتداداً لها لا نافذةً غريبة. */
          html[data-skin] body .screen.setup .hero-nav {
            display:none;
            position:absolute; z-index:3; top:100%; inset-inline:0;
            margin:12px 0 0; padding:12px;
            flex-direction:column; align-items:stretch; gap:10px;
            background:var(--n-surface, #fff); border-radius:18px;
            box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 5px 6px 0 var(--n-ink, #22201C);
          }
          html[data-skin] body .screen.setup .hero-nav.open { display:flex; }
          html[data-skin] body .screen.setup .hero-nav-veil { display:block; position:fixed; inset:0; z-index:2; }
          html[data-skin] body .screen.setup .hero-nav .hnav {
            font-size:16px; padding:12px 18px; text-align:center;
          }
          /* الصوت في اللوح صفٌّ كأخواته لا مربّعاً صغيراً. */
          html[data-skin] body .screen.setup .hero-nav .hnav-mute { padding-inline:18px; display:flex; justify-content:center; gap:10px; }
          html[data-skin] body .screen.setup .hero-nav .hnav-mute-text { display:inline; }
        }
        /* ─── صينيّة المختارات ─── كانت للجوال الطوليّ وحده بحجّة أنّ الشبكة
           في العرض تُرى في نظرة؛ فطلبها علي في الموقع والآيباد أيضاً (١٧
           سبتمبر ٢٠٢٦: «لا تظهر الفئات بشكل مصغّر عند اختيارها») — فهي في
           كلّ مقاس، وعلى الشاشة العريضة كتلةٌ بعرض محتواها في الوسط لا
           شريطاً أبيض يعبر الصفحة، وخاناتها أكبر. */
        html[data-skin] body .screen.setup .cats-tray {
          display:flex; justify-content:center; align-items:center; gap:8px;
          position:sticky; bottom:8px; z-index:4;
          margin-top:14px; padding:8px 10px;
          background:var(--n-surface, #fff); border-radius:16px;
          box-shadow:0 0 0 2.5px var(--n-ink, #22201C), 4px 5px 0 var(--n-ink, #22201C);
        }
        html[data-skin] body .screen.setup .tray-slot {
          flex:none; width:clamp(38px,11vw,48px); aspect-ratio:1;
          border-radius:10px; padding:0;
          border:2px dashed var(--n-ink-3, #8A8578); background:var(--n-bg, #FFF8EE);
        }
        html[data-skin] body .screen.setup .tray-slot.filled {
          border:2px solid var(--n-ink, #22201C); cursor:pointer;
          background:var(--art) center / cover no-repeat, var(--n-surface-2, #FFF3E0);
          animation:tray-pop .28s var(--ease-spring) both;
        }
        html[data-skin] body .screen.setup .tray-slot.filled:active { transform:scale(.92); }
        @keyframes tray-pop {
          from { transform:scale(.6); opacity:0; }
          to   { transform:none; opacity:1; }
        }
        @media (prefers-reduced-motion: reduce) { html[data-skin] body .screen.setup .tray-slot.filled { animation:none; } }
        @media (min-width:900px) and (orientation: landscape) {
          html[data-skin] body .screen.setup .cats-tray {
            align-self:center; width:max-content; gap:12px;
            margin-top:20px; padding:10px 14px; bottom:12px;
          }
          html[data-skin] body .screen.setup .tray-slot { width:clamp(48px,4.2vw,76px); border-radius:12px; }
        }
      `}</style>
    </div>
  )
}
