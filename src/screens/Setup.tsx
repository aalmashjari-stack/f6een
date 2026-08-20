import { useState } from 'react'
import type { SetupInput } from '../game/session'
import {
  STAGE1_POINTS,
  STAGE2_CORRECT,
  STAGE2_WRONG,
  STAGE3_POINTS,
  STAGE3_TIMER_MS,
} from '../game/session'
import type { TeamId } from '../game/types'
import { isMuted, play, setMuted } from '../audio/sfx'
import { BrandLogo } from '../components/BrandLogo'
// مشهد المجلس — عائلة أمام شاشة واحدة، وهي صورة اللعبة نفسها. نسبتها
// ٤٫٩٤:١ فتملأ الشريط كاملةً بلا قصّ. JPEG لا PNG: رسمٌ بلا شفافية،
// فحجمه الرُبع (القسم ١١ من SPEC).
import bannerUrl from '../../assets/f6een-banner-tv.jpg'

const MIN = 2
const MAX = 6

/** الأرقام الهندية — الواجهة عربية بالكامل، فالعدّاد والنصّ الإرشادي لا يخرجان بأرقام لاتينية. */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const ar = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d])

/** ترتيب الفريق: شارةً فوق بطاقته دائماً، واسماً بديلاً إن تُرك حقل الاسم فارغاً. */
const FALLBACK_TEAM = ['الفريق الأول', 'الفريق الثاني']

/* شرح مختصر للمراحل الثلاث — نصّه من SPEC القسمين ٤–٦، وأرقامه من ثوابت
   المحرّك لا مكتوبة بيد. هذه الشاشة تُعلّم القواعد، فلو تغيّر تنقيط مرحلة
   في session.ts وبقي الشرح ثابتاً لعلّمت الشاشة قاعدة لا يطبّقها المحرّك.
   العلامة LRM قبل الإشارة صريحة (‎) لا حرفاً خفيّاً: بدونها تنقلب
   «+٢٠» إلى «٢٠+» داخل فقرة عربية. */
const STAGES = [
  {
    name: 'الجولة الجماعية',
    desc: 'الفريقان يتشاوران معاً، وصاحب الدور يجيب',
    points: `${ar(STAGE1_POINTS)} نقاط`,
  },
  {
    name: 'الديربي',
    desc: 'لاعب ضدّ لاعب بلا تشاور — الأسبق وحده يربح أو يخسر',
    points: `‎+${ar(STAGE2_CORRECT)} / −${ar(Math.abs(STAGE2_WRONG))}`,
  },
  {
    name: 'الحق ما تلحق',
    desc: `كل فريق وحده، ${ar(STAGE3_TIMER_MS / 1000)} ثانية لا تتوقّف`,
    points: `‎+${ar(STAGE3_POINTS)} لكل إجابة`,
  },
] as const

/* نسيج الخلفية يعيش في `body::after` بـ theme.css فيشمل كل الشاشات.
   تكراره هنا كان يضاعفه تحت الشعار ويزحمه. */

export function Setup({ onStart }: { onStart: (input: SetupInput) => void }) {
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [players, setPlayers] = useState<[string[], string[]]>([
    ['', ''],
    ['', ''],
  ])
  const [starter, setStarter] = useState<TeamId | null>(null)
  const [tossing, setTossing] = useState(false)
  const [tossFace, setTossFace] = useState<TeamId>(0)
  const [mute, setMute] = useState(isMuted())

  /** الكتم يُضبط مرّة قبل الجلسة ويبقى محفوظاً — لا يعود الحكم إليه أثناء اللعب. */
  function toggleMute() {
    const next = !mute
    setMute(next)
    setMuted(next)
    // عيّنة عند التشغيل: الحكم يسمع المستوى قبل أن يبدأ لا في منتصف سؤال
    if (!next) play('pickLand')
  }

  const teamLabel = (t: TeamId) => names[t].trim() || FALLBACK_TEAM[t]

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

  function start() {
    if (starter === null) return
    onStart({
      teamNames: [teamLabel(0), teamLabel(1)],
      players: [
        players[0].map((p, i) => p.trim() || `لاعب ${ar(i + 1)}`),
        players[1].map((p, i) => p.trim() || `لاعب ${ar(i + 1)}`),
      ],
      startingTeam: starter,
    })
  }

  return (
    <div className="screen setup">
      <div className="hero">
        {/* المشهد خلفيةً مطلقة — لا يكلّف الشريط ارتفاعاً، فيبقى ارتفاعه
            محكوماً بنسبة الصورة وحدها. */}
        <div className="hero-scene" aria-hidden="true">
          <img src={bannerUrl} alt="" />
        </div>

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
        {/* شرح المراحل الثلاث — ظاهر دائماً بين الشعار وبطاقتي الفريقين. */}
        <section className="setup-block">
          <p className="stages-intro">
            <span className="brand-inline">فطين</span> لعبة جماعية تتكوّن من ٣ جولات هي:
          </p>
          <div className="stages">
            {STAGES.map((s, i) => (
              <article key={s.name} className="stage-card">
                <span className="stage-no" aria-hidden="true">{ar(i + 1)}</span>
                {/* غلاف شفّاف (display:contents) — لا أثر له في التخطيط العمودي،
                    ويصير عموداً حقيقياً على الجوال ليقف النصّ بجانب الرقم. */}
                <div className="stage-body">
                  <h3 className="stage-name">{s.name}</h3>
                  <span className="stage-tag">المرحلة {ar(i + 1)}</span>
                  <p className="stage-desc">{s.desc}</p>
                  <span className="stage-points">{s.points}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* فاصل بين الشرح والإعداد — يعلن أن ما تحته حقول تُملأ لا شرح يُقرأ. */}
        <section className="setup-block">
          <h2 className="setup-rule"><span>بيانات الفريقين المتنافسين</span></h2>

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
                        placeholder={`اسم اللاعب ${ar(i + 1)}`}
                        onChange={(e) => setPlayer(team, i, e.target.value)}
                      />
                    ))}
                  </div>
                  <div className="counter">
                    <button className="pill" onClick={() => removePlayer(team)} disabled={players[team].length <= MIN}>
                      −
                    </button>
                    <span>{ar(players[team].length)} لاعبين</span>
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
            {starter !== null ? (
              <div className="toss-result">
                يبدأ: <b>{teamLabel(starter)}</b>
              </div>
            ) : tossing ? (
              <div className="toss-result fade">القرعة… {teamLabel(tossFace)}</div>
            ) : null}
          </div>

          <div className="setup-actions">
            <button className="action ghost" onClick={toss} disabled={tossing}>
              {starter !== null ? 'إعادة القرعة' : 'قرعة البدء'}
            </button>
            <button className="action" disabled={starter === null} onClick={start}>
              ابدأ اللعبة
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .setup { overflow:auto; }

        /* الهيرو يبتلع حشوة .screen ليلامس حافّتي الشاشة وأعلاها،
           وينتهي بانحناء سفلي فيقرأ كمنصّة يقف عليها الشعار لا كشريط. */
        .hero {
          position:relative; flex:none;
          margin:calc(-1 * clamp(16px,3vw,40px)) calc(-1 * clamp(16px,3vw,40px)) 0;
          padding:0 clamp(16px,3vw,40px);
          display:flex; justify-content:flex-start; align-items:center;
          /* نسبة ملف البانر — تُذكر هنا وحدها، فالشريط يأخذ ارتفاعه منها
             وتظهر الصورة كاملةً بلا قصّ. تبديل الصورة = تعديل هذا السطر
             فقط. والسقف يمنعها من ابتلاع الشاشة على العروض الضخمة. */
          --banner-ratio:2448 / 496;
          aspect-ratio:var(--banner-ratio);
          max-height:400px;
          border-radius:0 0 clamp(34px,6vw,76px) clamp(34px,6vw,76px);
          overflow:hidden;
          /* يبقى احتياطاً لو تعذّر تحميل الصورة. */
          background:linear-gradient(180deg,
            color-mix(in srgb, var(--surface) 62%, var(--night-deep)),
            var(--night-deep));
        }

        /* ─── مشهد المجلس ─────────────────────────────────────────────── */
        .hero-scene { position:absolute; inset:0; overflow:hidden; }
        /* نسبة الشريط = نسبة الصورة، فـcover لا يقصّ شيئاً في الحالة
           العادية. ويبقى موجوداً ليقصّ بلطف حين يُفرَض ارتفاع آخر (شاشة
           قصيرة أو جوال) بدل أن تتشوّه الصورة. */
        /* الإظلام على الصورة نفسها بـfilter لا بطبقة لون شفّافة فوقها:
           الطبقة الشفّافة تسحب الألوان نحو لونها فيصير المشهد النهاريّ
           طيناً، أما brightness فيخفض الإضاءة ويُبقي فروق الألوان. */
        .hero-scene img {
          position:absolute; inset:0;
          width:100%; height:100%;
          object-fit:cover; object-position:center 45%;
          filter:brightness(.5) saturate(.88);
        }
        /* صبغة ليلية تسحب دفء المشهد نحو أزرق الصفحة فلا يبقى جزيرة
           برتقالية فوقها، وذوبانٌ سفليّ ينهي الشريط في أرضية الصفحة
           بلا حدّ ظاهر. */
        .hero-scene::after {
          content:''; position:absolute; inset:0;
          background:
            linear-gradient(180deg, rgba(10,28,43,.32), rgba(10,28,43,.27) 52%, var(--night-deep));
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
          filter:drop-shadow(0 12px 30px rgba(0,0,0,.45));
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
          --gap-block: clamp(26px, 4.4vh, 52px);
          --gap-in:    clamp(14px, 2vh, 22px);
          flex:1; min-height:0;
          width:min(100%, 1140px); margin-inline:auto;
          /* فسحة تحت الشريط أوسع من فجوة .screen — المشهد صورة كاملة العرض،
             فيحتاج هواءً يفصله عن النصّ أكثر مما يحتاجه عنصر عاديّ. */
          margin-top:clamp(12px, 2.8vh, 34px);
          display:flex; flex-direction:column;
          gap:var(--gap-block);
        }
        .setup-block { display:flex; flex-direction:column; gap:var(--gap-in); }
        /* فصل بصري أوضح بين شرح المراحل وحقول الفرق: العنوان التالي لا
           يلتصق بظلال البطاقات، مع إبقاء الإيقاع الداخلي لكل قسم كما هو. */
        .setup-block + .setup-block {
          margin-top:clamp(22px, 3.4vh, 44px);
        }

        /* كتلة الفعل عند الحافّة السفلى — تبتلع فراغ التابلت الطولي
           بدل أن تتركه معلّقاً تحتها. */
        .setup-foot {
          margin-top:auto; display:flex; flex-direction:column;
          gap:clamp(10px, 1.5vh, 16px); padding-top:clamp(4px, 1vh, 10px);
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
        .stages { display:grid; grid-template-columns:repeat(3, 1fr); gap:clamp(14px, 1.8vw, 22px); }
        .stage-card {
          position:relative; overflow:hidden;
          display:flex; flex-direction:column; align-items:center; text-align:center;
          gap:clamp(8px, 1.2vh, 13px);
          padding:clamp(18px,2.8vh,28px) clamp(14px,1.6vw,20px);
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
          width:clamp(38px,5.2vh,48px); height:clamp(38px,5.2vh,48px);
          border-radius:50%; display:grid; place-items:center;
          background:var(--grad-gold);
          color:var(--on-gold); font-weight:800; font-size:clamp(18px,2.3vw,23px); line-height:1;
          box-shadow:0 6px 18px rgba(255,189,89,.26), inset 0 -2px 4px rgba(0,0,0,.12);
        }
        /* عمود حقيقي في كل المقاسات: يبتلع الارتفاع الفائض (flex:1) فيبقى
           margin-top:auto على الشارة محاذياً لها عند قاع البطاقة. كان
           display:contents يؤدّي الغرض نفسه، لكنه يجعل للغلاف حالتَي تخطيط
           تتبدّلان مع الاستعلامات — وحين يتحقّق الاستعلامان معاً (جوال
           أفقي مثلاً) تنتج حالة ثالثة لم يقصدها أحد. */
        .stage-body {
          display:flex; flex-direction:column; align-items:center; flex:1;
          gap:clamp(8px, 1.2vh, 13px); min-width:0;
        }
        .stage-name { margin:0; color:var(--gold); font-size:clamp(16px,2vw,21px); font-weight:800; }
        .stage-desc { margin:0; color:var(--text-2); font-size:clamp(12.5px,1.45vw,15px); line-height:1.7; }
        /* margin-top:auto يحاذي الشارات الثلاث في سطر واحد مهما اختلف طول الوصف. */
        .stage-points {
          margin-top:auto; padding:6px 16px; border-radius:999px;
          border:1px solid rgba(255,189,89,.34); background:rgba(255,189,89,.08);
          color:var(--cream); font-size:clamp(12px,1.35vw,14px); font-weight:700; white-space:nowrap;
        }

        /* ─── بطاقتا الفريقين ─────────────────────────────────────────── */
        .teams-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(16px, 2.2vw, 28px); }
        .team-card {
          display:flex; flex-direction:column; gap:clamp(12px, 1.8vh, 18px);
          padding:clamp(18px,2.8vh,30px) clamp(16px,2vw,26px);
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
          align-self:center; padding:5px 16px; border-radius:999px;
          border:1px solid var(--border); background:rgba(15,44,66,.55);
          color:var(--text-2); font-size:clamp(11px,1.2vw,13px); font-weight:700;
          transition:color .3s ease, border-color .3s ease;
        }
        .team-card.starter .team-badge { color:var(--gold); border-color:rgba(255,189,89,.5); }

        .team-name {
          background:transparent; border:none; border-bottom:2px solid var(--border);
          color:var(--gold); font-weight:800; font-size:clamp(19px,2.5vw,26px);
          font-family:inherit; text-align:center; padding:10px 8px; outline:none;
          transition:border-color .2s ease;
        }
        .team-name::placeholder { color:var(--text-3); font-weight:700; }

        .players { display:flex; flex-direction:column; gap:clamp(9px, 1.3vh, 13px); }
        .player {
          background:rgba(15,44,66,.6); border:1px solid var(--border);
          border-radius:999px; color:var(--cream); font-family:inherit;
          font-size:clamp(15px,1.6vw,17px); padding:13px 22px; outline:none; text-align:center;
          transition:border-color .2s ease, background .2s ease;
        }
        .player::placeholder { color:var(--text-3); }
        .player:focus, .team-name:focus { border-color:var(--gold); }
        .player:focus { background:rgba(15,44,66,.9); }

        /* خيط فاصل فوق العدّاد — يفصل ضبط العدد عن حقول الأسماء. */
        .counter {
          display:flex; align-items:center; justify-content:center; gap:18px;
          color:var(--text-2); font-weight:700;
          padding-top:clamp(10px, 1.4vh, 15px);
          border-top:1px solid var(--border);
        }
        .pill {
          width:42px; height:42px; border-radius:50%; border:1px solid var(--border);
          background:rgba(15,44,66,.6); color:var(--cream); font-size:22px; cursor:pointer;
          transition:transform .15s var(--ease-spring), border-color .2s ease, color .2s ease;
        }
        @media (hover:hover) { .pill:not(:disabled):hover { border-color:var(--gold); color:var(--gold); } }
        .pill:active { transform:scale(.9); }
        .pill:disabled { opacity:.3; cursor:default; }

        /* ─── القرعة والأزرار ─────────────────────────────────────────── */
        /* الخانة تبقى محجوزة وإن كانت فارغة: نتيجة القرعة تحلّ محلّها لاحقاً،
           وبلا حجزها يقفز الزرّان تحتها لحظة ظهورها. */
        .toss { text-align:center; min-height:38px; display:grid; place-items:center; }
        .toss-result { font-size:clamp(18px,2.6vw,27px); font-weight:700; }
        .toss-result b { color:var(--gold); }

        /* الزرّان في صفّ على الشاشة العريضة — «ابدأ اللعبة» يأخذ الثلثين
           فيبقى الفعل الأساسي هو الأكبر، والقرعة إلى جانبه لا فوقه. */
        .setup-actions { display:flex; gap:clamp(10px, 1.4vw, 16px); }
        .setup-actions .action { flex:2; }
        .setup-actions .action.ghost { flex:1; }

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
          .hero { aspect-ratio:auto; height:clamp(150px, 21vh, 200px); }

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
          .hero { aspect-ratio:auto; height:clamp(92px, 15vh, 120px); }
          .hero-logo { width:min(40%, 320px); max-height:70%; }
          /* الشاشة القصيرة تملأ نفسها بالضبط، فلا فسحة إضافية تُحتمل. */
          .setup-body { --gap-block:clamp(11px,1.9vh,17px); --gap-in:clamp(8px,1.2vh,12px); margin-top:0; }
          .setup-block + .setup-block { margin-top:clamp(10px,1.8vh,16px); }

          .stages-intro { font-size:clamp(13px,1.5vw,15px); line-height:1.5; }
          .setup-rule { font-size:clamp(14px,1.6vw,17px); }

          /* البطاقة تنقلب صفّاً أفقياً: الرقم والاسم والنقاط في سطر واحد.
             تحفظ الترتيب والقاعدة وتوفّر ثلثي ارتفاعها — والوصف وحده يسقط.
             والغلاف يقلب اتجاهه معها، وإلا نزلت الشارة تحت الاسم فعاد
             الارتفاع الذي وُفّر. */
          .stage-card { flex-direction:row; align-items:center; justify-content:center; gap:10px; padding:10px 12px; }
          .stage-body { flex-direction:row; align-items:center; flex:0 1 auto; gap:10px; }
          .stage-desc { display:none; }
          .stage-no { width:28px; height:28px; font-size:15px; }
          .stage-name { font-size:clamp(14px,1.6vw,17px); }
          .stage-points { margin-top:0; padding:4px 12px; font-size:clamp(11px,1.2vw,12.5px); }

          .team-card { padding:12px 14px; gap:9px; }
          .team-badge { display:none; }
          .team-name { font-size:clamp(17px,2vw,20px); padding:6px 8px; }
          .players { gap:8px; }
          .player { padding:9px 18px; font-size:15px; }
          .counter { padding-top:8px; gap:14px; }
          .pill { width:34px; height:34px; font-size:19px; }

          .toss { min-height:26px; }
          .toss-result { font-size:clamp(15px,2vw,20px); }
          .setup-actions .action { padding:12px 24px; font-size:clamp(17px,2.2vw,21px); }
        }
      `}</style>
    </div>
  )
}
