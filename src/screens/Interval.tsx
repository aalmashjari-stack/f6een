import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'

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
    rule: 'قاعدة الصمت: لا تشاور، الزملاء لا يتدخّلون. الصمت مجاني، والتخمين الخاطئ يخصم 10.',
    cta: 'ابدأ',
  },
  'stage3-play': {
    eyebrow: 'المرحلة القادمة',
    title: 'الحق ما تلحق',
    rule: 'الساعة لا تتوقف — 30 ثانية لكل فريق. كل ضغطة تكلّف وقتاً. 5 نقاط لكل إجابة، والتمرير غير محدود.',
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

  return (
    <div className="screen center-col">
      <ScoreBar teams={state.teams} />
      <div className="grow center-all">
        <div className={'interval-card' + (tie ? ' tie' : '')}>
          <div className="il-eyebrow">{info.eyebrow}</div>
          <div className="il-title">{info.title}</div>
          <div className="il-rule">{info.rule}</div>
        </div>
      </div>
      <button className="action" onClick={() => dispatch({ t: 'INTERVAL_CONTINUE' })}>
        {info.cta}
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
      `}</style>
    </div>
  )
}
