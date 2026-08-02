import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'

/* القفز الفوري بعد «ابدأ» يبتر أهم سطر في الشاشة: المجموعة تكون في منتصف قراءة
   القاعدة حين تختفي. الوقفة تترك السطر ظاهراً لحظة أخيرة قبل الانتقال. */
const HOLD_MS = 1400

interface Next {
  eyebrow: string
  title: string
  rule: string
  cta: string
}

const NEXT: Record<string, Next> = {
  'stage2-selection': {
    eyebrow: 'المرحلة القادمة',
    title: 'راس براس',
    rule: 'هذه مواجهة فردية: لاعب من كل فريق وجهاً لوجه. لا يجوز لأي فرد من الفريقين أن يتدخّل — لا كلام ولا همس ولا إشارة. ومن بادر بالإجابة أولاً هو صاحبها وحده: إن أصاب كسب 20، وإن أخطأ خُصم منه 10 وانتهت الجولة. والصمت لا يكلّف شيئاً.',
    cta: 'ابدأ',
  },
  'stage3-play': {
    eyebrow: 'المرحلة القادمة',
    title: 'الحق ما تلحق',
    rule: '30 ثانية دون توقف لكل فريق، و+5 نقاط لكل إجابة صحيحة.',
    cta: 'ابدأ',
  },
  /* التعادل ليس «مرحلة قادمة»: انتهت اللعبة والنتيجة متساوية، وهذا خبر قبل أن يكون
     إعلاناً عن مرحلة. الصياغة تقول ما حدث أولاً، ثم ما سيحدث. */
  tiebreak: {
    eyebrow: 'انتهت المراحل الثلاث والنتيجة',
    title: 'تعادل',
    rule: 'سؤال صعب واحد يحسم اللعبة. أول فريق يصيبه يفوز — وإن لم يصبه أحد، يأتي سؤال آخر حتى يُحسم.',
    cta: 'هاتوا السؤال الحاسم',
  },
}

export function Interval({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const info: Next = NEXT[state.intervalNext] ?? {
    eyebrow: 'المرحلة القادمة',
    title: 'المرحلة التالية',
    rule: '',
    cta: 'ابدأ',
  }
  const tie = state.intervalNext === 'tiebreak'

  const [held, setHeld] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const start = () => {
    if (held) return
    setHeld(true)
    timer.current = window.setTimeout(() => dispatch({ t: 'INTERVAL_CONTINUE' }), HOLD_MS)
  }

  return (
    <div className="screen center-col">
      <ScoreBar teams={state.teams} />
      <div className="grow center-all">
        <div className={'interval-card' + (tie ? ' tie' : '') + (held ? ' held' : '')}>
          <div className="il-eyebrow">{info.eyebrow}</div>
          <div className="il-title">{info.title}</div>
          <div className="il-rule">{info.rule}</div>
        </div>
      </div>
      {/* شريط يمتلئ خلال الوقفة: الشاشة الساكنة بعد الضغط تُقرأ عطلاً، والشريط يقول «قادم». */}
      <button className={'action hold-btn' + (held ? ' held' : '')} onClick={start} disabled={held}>
        <span className="hb-label">{info.cta}</span>
        <span className="hb-fill" aria-hidden="true" />
      </button>
      <style>{`
        .center-col { display:flex; flex-direction:column; }
        .interval-card { max-width:760px; text-align:center; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:clamp(28px,6vh,60px); display:flex; flex-direction:column; gap:16px; }
        /* القاعدة تظهر بعد الاسم بلحظة: الفريق يقرأ «راس براس» ثم يقرأ قاعدتها،
           وهي أهم سطر في الشاشة لأن قواعد المرحلة تغيّرت للتوّ. */
        .il-eyebrow { color:var(--text-2); font-weight:700; font-size:clamp(14px,1.8vw,18px); animation:il-rise .5s ease-out .1s both; }
        .il-title {
          color:var(--gold); font-weight:800; font-size:clamp(38px,7vw,72px); line-height:1.1;
          animation:il-title .7s var(--ease-spring) .2s both;
          text-shadow:0 0 40px rgba(255,189,89,.35);
        }
        .il-rule { color:var(--cream); font-size:clamp(17px,2.4vw,24px); line-height:1.7; font-weight:600; animation:il-rise .55s ease-out .55s both; }

        /* التعادل مرجاني لا ذهبي: المرجاني لغة التوتّر في هذه اللعبة (القسم ١١)،
           وهذه اللحظة الوحيدة التي تكون فيها اللعبة معلّقة بسؤال واحد. */
        .interval-card.tie { border-color:var(--coral); box-shadow:var(--glow-coral); }
        .interval-card.tie .il-title { color:var(--coral); text-shadow:0 0 40px rgba(228,103,74,.4); }
        @keyframes il-title {
          from { opacity:0; transform:scale(.82); filter:blur(6px); }
          to   { opacity:1; transform:none; filter:none; }
        }
        @keyframes il-rise {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:none; }
        }

        /* البطاقة تبقى مقروءة خلال الوقفة ثم تنسحب في آخرها — لا تختفي مع الضغطة */
        .interval-card.held { animation:il-leave ${HOLD_MS}ms ease-in both; }
        @keyframes il-leave {
          0%, 62% { opacity:1; transform:none; }
          100%    { opacity:.25; transform:scale(.97); }
        }

        .hold-btn { position:relative; overflow:hidden; }
        .hold-btn.held:disabled { opacity:1; filter:none; }
        .hold-btn .hb-label { position:relative; z-index:1; }
        .hb-fill {
          position:absolute; inset:0; transform-origin:right center; transform:scaleX(0);
          background:rgba(15,44,66,.22);
        }
        .hold-btn.held .hb-fill { animation:hb-grow ${HOLD_MS}ms linear both; }
        @keyframes hb-grow { to { transform:scaleX(1); } }
      `}</style>
    </div>
  )
}
