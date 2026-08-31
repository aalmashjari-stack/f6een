import { useState } from 'react'
import type { SetupInput } from '../game/session'
import type { TeamId } from '../game/types'
import { STAGES } from '../game/stages'
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
}: {
  onStart: (input: SetupInput) => Promise<void> | void
  balance?: number | null
}) {
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [players, setPlayers] = useState<[string[], string[]]>([
    ['', ''],
    ['', ''],
  ])
  const [starter, setStarter] = useState<TeamId | null>(null)
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

  function toss() {
    setTossing(true)
    setStarter(null)
    let n = 0
    const iv = setInterval(() => {
      setTossFace((f) => (1 - f) as TeamId)
      n++
      if (n > 11) {
        clearInterval(iv)
        const result = (Math.random() < 0.5 ? 0 : 1) as TeamId
        setTossFace(result)
        setStarter(result)
        setTossing(false)
      }
    }, 110)
  }

  async function start() {
    if (starter === null || !namesReady || busy || noBalance) return
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
      {/* رأسٌ بلا بانر — أزال علي صورةَ المجلس (١ سبتمبر ٢٠٢٦): الشعار
          يقف على أرضيّة الصفحة نفسها، ومعه مربّعان من مربّعات الشعار
          يكرّران لعبته بلا أصلٍ جديد. */}
      <div className="hero">
        <span className="hero-bit hero-bit-a" aria-hidden="true" />
        <span className="hero-bit hero-bit-b" aria-hidden="true" />
        <BrandLogo className="hero-logo" />
        {/* في زاوية الهيرو لا فوق زر البدء: ضبط يُمسّ مرّة، فلا يزاحم الفعل
            الأساسي ولا يسقط تحت الطيّة في الشاشات القصيرة. */}
        <button
          className={'mute-toggle' + (mute ? ' off' : '')}
          onClick={toggleMute}
          aria-pressed={mute}
          title={mute ? 'الصوت مكتوم' : 'الصوت يعمل'}
        >
          <span aria-hidden="true">{mute ? '🔇' : '🔊'}</span>
          <span className="mt-label">{mute ? 'مكتوم' : 'الصوت'}</span>
        </button>
      </div>

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
              <div className="toss-result missing">اكتب أسماء الفريقين واللاعبين</div>
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
              disabled={starter === null || !namesReady || busy || noBalance}
              onClick={start}
            >
              {busy ? 'لحظة…' : 'ابدأ اللعبة'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* التمرير مسموح هنا وحدها (قرار علي ٢١ أغسطس ٢٠٢٦) — والمقاسات مع ذلك
           مضبوطة لتسع ٦+٦ لاعبين بلا تمرير في المقاسات الشائعة، فيبقى التمرير
           شبكة أمان لا الوضع الطبيعي. */
        .setup { overflow-y:auto; }

        /* رأسٌ خفيف على أرضيّة الصفحة — لا صورة ولا بطاقة: شاشة الإعداد
           شاشةُ إدخال، والشعار يعرّف ويمضي. */
        .hero {
          position:relative; flex:none;
          display:flex; justify-content:center; align-items:center;
          height:clamp(84px, 13vh, 150px);
        }

        /* مربّعا زينة من مفردات الشعار نفسه — يدوران حوله كما تدور
           مربّعاته الصغيرة حول حروفه. زخرفةٌ لا أصل، فلا تعتمد صورة. */
        .hero-bit {
          position:absolute; z-index:0;
          width:clamp(12px,1.6vw,20px); aspect-ratio:1;
          border:2.5px solid var(--n-ink, #22201C);
          border-radius:4px;
        }
        .hero-bit-a {
          background:var(--n-a-tint, #FFCE3C);
          inset-inline-start:18%; top:24%;
          transform:rotate(14deg);
        }
        .hero-bit-b {
          background:var(--n-b-tint, #7BD3D0);
          inset-inline-end:20%; bottom:18%;
          width:clamp(9px,1.2vw,15px);
          transform:rotate(-11deg);
        }

        /* inset-inline-end = يسار الشاشة في RTL — الجهة المقابلة لبداية القراءة،
           فلا تعترض العين وهي تنزل من الشعار إلى بطاقتي الفريقين. */
        .mute-toggle {
          position:absolute; z-index:2;
          top:clamp(10px,1.8vh,18px); inset-inline-end:clamp(10px,2vw,20px);
          display:flex; align-items:center; gap:7px;
          padding:8px 14px; border-radius:999px;
          border:1px solid var(--border); background:rgba(15,44,66,.6);
          color:var(--text-2); font-family:inherit; font-size:14px; font-weight:700;
          cursor:pointer;
          transition:color .2s ease, border-color .2s ease, opacity .2s ease, transform .15s var(--ease-spring);
        }
        .mute-toggle:active { transform:scale(.94); }
        .mute-toggle.off { opacity:.6; }
        .mute-toggle:not(.off) { color:var(--gold); border-color:var(--gold); }
        /* الأيقونة وحدها على الجوال — الكلمة تزاحم الشعار في العرض الضيّق */
        @media (max-width:560px) { .mt-label { display:none; } }

        .hero-logo {
          position:relative; z-index:1;
          width:min(55%, 520px); height:auto; max-height:85%; object-fit:contain;
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
          flex:1; min-height:0;
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
          .hero { height:clamp(110px, 17vh, 170px); }

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
          .hero { height:clamp(64px, 12vh, 100px); }
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
      `}</style>
    </div>
  )
}
