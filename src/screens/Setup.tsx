import { useEffect, useMemo, useRef, useState } from 'react'
import type { SetupInput } from '../game/session'
import { STAGE1_CATEGORIES } from '../game/session'
import type { TeamId } from '../game/types'
import { STAGES } from '../game/stages'
import { displayName, playableCategories, subscribeBank } from '../game/bank'
import { categoryArt } from '../components/categoryArt'
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
      setErr(
        e instanceof Error && e.message === 'no_balance'
          ? 'انتهى رصيدك — أضف كود هدية من «حسابي»'
          : 'تعذّر بدء اللعبة، تحقّق من اتصالك',
      )
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
          <nav className="hero-nav" aria-label="القائمة">
            {/* الشراء أوّلاً وبلون الهويّة: هو النداء التجاريّ الوحيد في
                الشاشة. والاثنان الآخران كبسولتان محايدتان. */}
            <button className="hnav hnav-buy" onClick={() => onNav('buy')}>شراء الألعاب</button>
            <button className="hnav" onClick={() => onNav('account')}>حسابي</button>
            <button className="hnav" onClick={() => onNav('rules')}>شرح اللعبة</button>
            <button className="hnav" onClick={() => onNav('contact')}>تواصل معنا</button>
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
            حُذف سطر التقديم فوقها في ٢١ أغسطس ٢٠٢٦: البطاقات الثلاث تقول
            بنفسها إنها ثلاث جولات، والسطر يكرّر ما تحته ويكلّف ارتفاعاً
            تحتاجه الشاشة القصيرة. */}
        <section className="setup-block">
          <div className="stages">
            {STAGES.map((s, i) => (
              <article key={s.name} className="stage-card">
                <span className="stage-no" aria-hidden="true">{i + 1}</span>
                {/* غلاف شفّاف (display:contents) — لا أثر له في التخطيط العمودي،
                    ويصير عموداً حقيقياً على الجوال ليقف النصّ بجانب الرقم. */}
                <div className="stage-body">
                  <h3 className="stage-name">{s.name}</h3>
                  <span className="stage-tag">المرحلة {i + 1}</span>
                  <p className="stage-desc">{s.desc}</p>
                  <span className="stage-points">{s.points}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* حقول الفريقين. حُذف عنوان «بيانات الفريقين المتنافسين» في ٢١ أغسطس
            ٢٠٢٦: حقولٌ باسم فريق ولاعبين لا تحتاج عنواناً يسمّيها، وارتفاعه
            أنفع للحقول نفسها. */}
        <section className="setup-block">
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
          <p className="cats-lead">قم باختيار الفئات</p>
          <div className="cats-head">
            <h3 className="cats-title">فئات الجولة الجماعية</h3>
            {/* لا شارةَ دورٍ بعد اليوم: الفئات للّوح لا للفريقين. يبقى إعلانُ
                الاكتمال وحده — وهو خبرٌ عن اللوح لا نداءٌ على فريق. */}
            {catsReady && <span className="cats-turn done">اكتمل اللوح</span>}
          </div>
          <div className="cats-grid">
            {allCats.map((cat) => {
              const picked = isPicked(cat)
              return (
                <button
                  key={cat}
                  className={
                    'catchip' +
                    (picked ? ' taken' : '') +
                    /* اكتمل اللوح: **الشبكة كلّها** ترمدّ — المختارة وغيرها —
                       فتقول بلا سطرٍ إنّ الباب أُقفل ولا فئة سابعة. */
                    (catsReady ? ' dimmed' : '')
                  }
                  onClick={() => toggleCat(cat)}
                  aria-pressed={picked}
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
              )
            })}
          </div>
          <div className="cats-note">
            <span className="cats-count">
              {cats.length} / {STAGE1_CATEGORIES}
            </span>
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
              /* بلا هذا السطر يبقى الزرّ رمادياً بلا سبب ظاهر، فيظنّه الحكم عطلاً. */
              <div className={'toss-result missing' + (nudge ? ' alert' : '')}>
                اكتب أسماء الفريقين واللاعبين
              </div>
            ) : !catsReady ? (
              <div className={'toss-result missing' + (nudge ? ' alert' : '')}>
                اختر {STAGE1_CATEGORIES} فئات للّوح
              </div>
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

        /* الرأس شريطٌ بدرجةٍ أدفأ من أرضيّة الصفحة، بحدّ حبرٍ سفليّ —
           يمتصّ حشوة .screen ليمتدّ من حافّة إلى حافّة، ويحمل الشعار
           والقائمة. البدائل بعد كل متغيّر لأنّ رموز الهويّة لا تُعرَّف
           إلا تحت سمتها. */
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
          height:clamp(64px, 11vh, 120px);
          background:var(--n-surface-2, #FFF3E0);
          border-bottom:2.5px solid var(--n-ink, #22201C);
        }

        /* القائمة: الشراء كتلة الهويّة، والبقيّة كبسولات بيضاء بحدّ حبر */
        /* القائمة إلى يسار الشريط (طلب علي) — تدفع نفسها وزرَّ الصوت إلى
           الطرف المقابل للشعار، ويبقى الشعار وحده في اليمين. */
        body .screen.setup .hero-nav { display:flex; align-items:center; gap:clamp(6px,1vw,12px); flex-wrap:wrap; margin-inline-start:auto; }
        body .screen.setup .hnav {
          font:inherit; font-weight:800; cursor:pointer;
          font-size:clamp(11px,1.4vw,15px);
          padding:clamp(5px,.9vh,9px) clamp(11px,1.6vw,18px);
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
          --gap-block: clamp(10px, 2.6vh, 44px);
          --gap-in:    clamp(8px, 1.4vh, 20px);
          /* ‏1 0 auto لا 1 min-height:0: كان الجسم يتقلّص إلى ارتفاع الغلاف
             فيُسحق محتواه — بطاقاتُ الفئات تحديداً — بدل أن يفيض عنه، فلا
             يعمل تمرير .setup-scroll إلا بالكاد. الآن يكبر على الشاشة الطويلة
             (فتبقى كتلةُ الفعل عند الحافّة السفلى بـmargin-top:auto) ولا
             ينزل تحت مقاس محتواه على القصيرة، فيفيض ويُمرَّر طبيعياً. */
          flex:1 0 auto;
          width:min(100%, 1140px); margin-inline:auto;
          /* فسحة تحت الشريط أوسع من فجوة .screen — المشهد صورة كاملة العرض،
             فيحتاج هواءً يفصله عن النصّ أكثر مما يحتاجه عنصر عاديّ. */
          margin-top:clamp(8px, 1.8vh, 28px);
          display:flex; flex-direction:column;
          gap:var(--gap-block);
        }
        .setup-block { display:flex; flex-direction:column; gap:var(--gap-in); }
        /* فصل بصري أوضح بين شرح المراحل وحقول الفرق: العنوان التالي لا
           يلتصق بظلال البطاقات، مع إبقاء الإيقاع الداخلي لكل قسم كما هو. */
        .setup-block + .setup-block {
          margin-top:clamp(4px, 1.2vh, 30px);
        }

        /* كتلة الفعل عند الحافّة السفلى — تبتلع فراغ التابلت الطولي
           بدل أن تتركه معلّقاً تحتها. */
        .setup-foot {
          margin-top:auto; display:flex; flex-direction:column;
          gap:clamp(4px, .9vh, 16px); padding-top:clamp(2px, .6vh, 10px);
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

        /* ─── بطاقات المراحل ──────────────────────────────────────────── */
        .stages { display:grid; grid-template-columns:repeat(3, 1fr); gap:clamp(10px, 1.4vw, 20px); }
        /* الوضع الافتراضي مُدمَج — صفٌّ أفقي: الرقم فالاسم فالنقاط. البطاقة
           العمودية الكاملة (بالوصف تحتها) تعود على الشاشات الطويلة وحدها
           في آخر الملف. كان العكس — عموديّة دائماً وتنكمش تحت ٥٦٠px — فكانت
           تأكل ٣١٢px على لابتوب ٧٢٠ وتدفع زر البدء خارج الشاشة. */
        .stage-card {
          position:relative; overflow:hidden;
          display:flex; flex-direction:row; align-items:center; justify-content:center;
          text-align:center;
          gap:clamp(7px, 1vh, 12px);
          padding:clamp(8px,1.4vh,16px) clamp(10px,1.2vw,16px);
          background:linear-gradient(165deg,
            color-mix(in srgb, var(--surface-2) 92%, transparent),
            color-mix(in srgb, var(--surface) 72%, transparent) 72%);
          border:1px solid var(--border);
          border-radius:clamp(20px, 3.2vh, 30px);
          box-shadow:0 12px 28px rgba(0,0,0,.22);
          transition:transform .25s var(--ease-spring), border-color .25s ease, box-shadow .25s ease;
        }
        /* خيط ذهبي على الحافّة العليا — يربط الثلاث كسلسلة واحدة. */
        .stage-card::before {
          content:''; position:absolute; top:0; inset-inline:0; height:2px;
          background:linear-gradient(90deg, transparent, rgba(255,189,89,.65), transparent);
        }
        @media (hover:hover) {
          .stage-card:hover {
            transform:translateY(-4px); border-color:rgba(255,189,89,.42);
            box-shadow:0 18px 36px rgba(0,0,0,.3);
          }
        }

        /* رقم المرحلة قرص ذهبي — يرتّب المراحل الثلاث بلمحة قبل قراءة الاسم. */
        .stage-no {
          flex:none;
          width:clamp(26px,3.6vh,46px); height:clamp(26px,3.6vh,46px);
          border-radius:50%; display:grid; place-items:center;
          background:var(--grad-gold);
          color:var(--on-gold); font-weight:800; font-size:clamp(14px,1.9vw,22px); line-height:1;
          box-shadow:0 6px 18px rgba(255,189,89,.26), inset 0 -2px 4px rgba(0,0,0,.12);
        }
        /* عمود حقيقي في كل المقاسات: يبتلع الارتفاع الفائض (flex:1) فيبقى
           margin-top:auto على الشارة محاذياً لها عند قاع البطاقة. كان
           display:contents يؤدّي الغرض نفسه، لكنه يجعل للغلاف حالتَي تخطيط
           تتبدّلان مع الاستعلامات — وحين يتحقّق الاستعلامان معاً (جوال
           أفقي مثلاً) تنتج حالة ثالثة لم يقصدها أحد. */
        /* في الوضع المُدمَج صفٌّ أفقي كالبطاقة نفسها، والوصف مخفيّ. */
        .stage-body {
          display:flex; flex-direction:row; align-items:center; flex:0 1 auto;
          gap:clamp(7px, 1vh, 12px); min-width:0;
        }
        .stage-name { margin:0; color:var(--gold); font-size:clamp(13px,1.6vw,20px); font-weight:800; white-space:nowrap; }
        /* الوصف سطرٌ يُقرأ مرّة ثم لا يُعاد إليه — أول ما يتنازل حين يشحّ
           الارتفاع، ويعود كاملاً على الشاشة الطويلة. */
        .stage-desc { display:none; margin:0; color:var(--text-2); font-size:clamp(12.5px,1.45vw,15px); line-height:1.6; }
        .stage-tag { display:none; }
        .stage-points {
          padding:4px 12px; border-radius:999px;
          border:1px solid rgba(255,189,89,.34); background:rgba(255,189,89,.08);
          color:var(--cream); font-size:clamp(11px,1.2vw,14px); font-weight:700; white-space:nowrap;
        }

        /* ─── بطاقتا الفريقين ─────────────────────────────────────────── */
        .teams-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(16px, 2.2vw, 28px); }
        /* البطاقة تتقلّص مع عمودها بدل أن تفرض عرض محتواها على الشبكة. */
        .team-card { min-width:0; }
        .team-card {
          display:flex; flex-direction:column; gap:clamp(6px, 1.1vh, 16px);
          padding:clamp(10px,1.7vh,26px) clamp(12px,1.6vw,24px);
          background:linear-gradient(165deg,
            color-mix(in srgb, var(--surface-2) 94%, transparent),
            color-mix(in srgb, var(--surface) 80%, transparent) 68%);
          border:2px solid var(--border);
          border-radius:clamp(24px, 3.8vh, 36px);
          box-shadow:var(--lift);
          transition:border-color .3s ease, box-shadow .3s ease;
        }
        .team-card.starter { border-color:var(--gold); box-shadow:var(--lift), var(--glow-gold); }

        /* شارة الترتيب — تسمّي البطاقة قبل أن يُكتب فيها اسم، فلا تبقى مجهولة. */
        .team-badge {
          align-self:center; padding:clamp(1px,.35vh,5px) 14px; border-radius:999px;
          border:1px solid var(--border); background:rgba(15,44,66,.55);
          color:var(--text-2); font-size:clamp(10px,1.1vw,13px); font-weight:700; line-height:1.4;
          transition:color .3s ease, border-color .3s ease;
        }
        .team-card.starter .team-badge { color:var(--gold); border-color:rgba(255,189,89,.5); }

        .team-name {
          background:transparent; border:none; border-bottom:2px solid var(--border);
          color:var(--gold); font-weight:800; font-size:clamp(15px,1.9vw,24px);
          font-family:inherit; text-align:center; padding:clamp(1px,.45vh,9px) 8px; outline:none;
          line-height:1.35;
          transition:border-color .2s ease;
        }
        .team-name::placeholder { color:var(--text-3); font-weight:700; }

        .players { display:flex; flex-direction:column; gap:clamp(4px, .8vh, 11px); }
        /* من خمسة لاعبين فصاعداً يقف الحقلان جنباً إلى جنب: ستة أسماء في
           ثلاثة صفوف بدل ستة. البطاقة عريضة أصلاً (نصف الشاشة) والاسم قصير،
           فالعرض متوفّر والارتفاع هو الشحيح. هذا يوفّر نصف ارتفاع القائمة
           بلا أن يصغر حرفٌ واحد — والبديل كان ضغط الحقول حتى تتلاصق. */
        .players:has(.player:nth-child(5)) {
          display:grid; grid-template-columns:1fr 1fr;
          gap:clamp(4px, .8vh, 11px) clamp(6px, .8vw, 12px);
        }
        /* الحشوة الرأسية هي ما يتنازل مع ستّة لاعبين — لا حجم الحرف: الاسم
           يُقرأ عن بُعد، والفراغ حوله لا. */
        .player {
          background:rgba(15,44,66,.6); border:1px solid var(--border);
          border-radius:999px; color:var(--cream); font-family:inherit;
          font-size:clamp(13px,1.4vw,17px); padding:clamp(5px,.95vh,12px) 20px; outline:none; text-align:center;
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
          padding-top:clamp(2px, .55vh, 13px);
          border-top:1px solid var(--border);
        }
        .pill {
          flex:none;
          width:clamp(24px,3.4vh,40px); height:clamp(24px,3.4vh,40px);
          border-radius:50%; border:1px solid var(--border);
          background:rgba(15,44,66,.6); color:var(--cream);
          font-size:clamp(16px,2.2vh,21px); cursor:pointer;
          transition:transform .15s var(--ease-spring), border-color .2s ease, color .2s ease;
        }
        @media (hover:hover) { .pill:not(:disabled):hover { border-color:var(--gold); color:var(--gold); } }
        .pill:active { transform:scale(.9); }
        .pill:disabled { opacity:.3; cursor:default; }

        /* ─── القرعة والأزرار ─────────────────────────────────────────── */
        /* الخانة تبقى محجوزة وإن كانت فارغة: نتيجة القرعة تحلّ محلّها لاحقاً،
           وبلا حجزها يقفز الزرّان تحتها لحظة ظهورها. */
        .toss { text-align:center; min-height:clamp(18px,2.8vh,38px); display:grid; place-items:center; }
        .toss-result { font-size:clamp(14px,2vw,26px); font-weight:700; line-height:1.35; }
        .toss-result b { color:var(--gold); }
        .toss-result.missing { color:var(--text-2); font-weight:700; }
        .toss-result.missing.alert { color:var(--coral); font-weight:900; }
        .toss-note { color:var(--text-2); font-weight:700; font-size:.72em; }

        /* الزرّان في صفّ على الشاشة العريضة — «ابدأ اللعبة» يأخذ الثلثين
           فيبقى الفعل الأساسي هو الأكبر، والقرعة إلى جانبه لا فوقه. */
        .setup-actions { display:flex; gap:clamp(10px, 1.4vw, 16px); }
        .setup-actions .action { flex:2; }
        .setup-actions .action.ghost { flex:1; }
        /* الزر يتنازل عن سُمكه الرأسي مع ضيق الارتفاع ويبقى عريضاً سهل الإصابة. */
        .setup-actions .action {
          padding:clamp(9px,1.7vh,26px) 28px;
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
          body .screen.setup .hero { height:clamp(84px, 14vh, 130px); }

          .stage-card {
            flex-direction:row; align-items:flex-start; text-align:start;
            gap:14px; padding:16px 18px;
          }
          .stage-body { align-items:flex-start; gap:6px; }
          .stage-points { margin-top:2px; }
        }

        /* ─── شاشة قصيرة (١٠٢٤×٦٠٠ مثلاً) ─────────────────────────────
           كل شيء ينكمش حتى يبقى زر «ابدأ اللعبة» فوق الحافّة — الفعل
           الأساسي لا يجوز أن يسقط تحت الطيّة. */
        @media (max-height:560px) {
          /* الشاشة القصيرة لا تحتمل نسبة الصورة كاملةً (٢٠٪ من العرض)،
             فيُفرض ارتفاع صغير و cover يقصّ وسط المشهد. */
          /* أعلى ممّا كان بطلب علي (١ سبتمبر ٢٠٢٦): على الجوال الأفقيّ
             كان الشريط ٦٤px فيخنق الشعار وشريطَ السدو معاً. */
          body .screen.setup .hero { height:clamp(78px, 20vh, 104px); }
          .hero-logo { width:min(40%, 320px); max-height:70%; }
          /* الشاشة القصيرة تملأ نفسها بالضبط، فلا فسحة إضافية تُحتمل. */
          .setup-body { --gap-block:clamp(6px,1.4vh,14px); --gap-in:clamp(5px,1vh,10px); margin-top:0; }
          .setup-block + .setup-block { margin-top:clamp(5px,1.2vh,12px); }

          /* البطاقة أصلاً صفٌّ أفقي في الوضع الافتراضي، فلم يبقَ هنا إلا
             شدّ المقاسات إلى أصغرها. */
          .stage-card { padding:8px 10px; }
          .stage-no { width:28px; height:28px; font-size:15px; }
          .stage-name { font-size:clamp(14px,1.6vw,17px); }
          .stage-points { margin-top:0; padding:4px 12px; font-size:clamp(11px,1.2vw,12.5px); }

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

        /* ─── الشاشة الطويلة (تلفزيون ١٠٨٠p وما فوق) ────────────────────
           هنا وحدها يتّسع الارتفاع للبطاقة الكاملة: الرقم فوق الاسم، والوصف
           تحته، والشارة في القاع. تعود الهيئة الغنيّة حيث تُقرأ من بُعد
           المجلس بلا أن تدفع زر البدء خارج الشاشة. */
        @media (min-height:900px) {
          .stage-card {
            flex-direction:column; align-items:center;
            gap:clamp(8px,1.2vh,13px);
            padding:clamp(18px,2.8vh,28px) clamp(14px,1.6vw,20px);
          }
          .stage-body { flex-direction:column; align-items:center; flex:1; gap:clamp(8px,1.2vh,13px); }
          .stage-desc { display:block; }
          .stage-name { white-space:normal; }
          /* margin-top:auto يحاذي الشارات الثلاث في سطر واحد مهما اختلف طول الوصف. */
          .stage-points { margin-top:auto; padding:6px 16px; }
        }

        /* ===== فئات الجولة الجماعية ===== */
        .cats-head { display:flex; align-items:center; gap:10px; margin-bottom:clamp(6px,1.2vh,12px); }
        .cats-title { margin:0; font-size:clamp(14px,1.7vw,19px); font-weight:800; color:var(--cream); }
        .cats-lead {
          margin:0 0 clamp(4px,1vh,10px);
          font-size:clamp(15px,2vw,22px); font-weight:900; color:var(--gold);
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
          padding:clamp(30px,5vh,58px) 7px clamp(8px,1.4vh,15px);
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

        .cats-note {
          display:flex; flex-wrap:wrap; align-items:center; gap:clamp(8px,1.4vw,18px);
          margin-top:clamp(6px,1.2vh,12px);
          font-size:clamp(11px,1.3vw,14px); font-weight:700;
        }
        .cats-count.team-0 { color:var(--gold); }
        .cats-count.team-1 { color:var(--coral); }
      `}</style>
    </div>
  )
}
