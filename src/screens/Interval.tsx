import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { STAGE3_POINTS, STAGE3_TIMER_MS } from '../game/session'
import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import intervalCss from './Interval.css?inline'

/* القفز الفوري بعد «ابدأ» يبتر أهم سطر في الشاشة: المجموعة تكون في منتصف قراءة
   القاعدة حين تختفي. الوقفة تترك السطر ظاهراً لحظة أخيرة قبل الانتقال. */
const HOLD_MS = 1400

interface Next {
  eyebrow: string
  title: string
  rule: string
  cta: string
}

/* الأرقام المُوقَّعة داخل جملة عربية محفوفةٌ بمحرفَي عزل (U+2068 و‏U+2069)
   غير مرئيَّين: بدونهما تعدّ خوارزميةُ الاتجاه علامتَي + و− محايدتين فتُلحقهما
   بالعربية حولهما، فيُقرأ «+20» على الشاشة «20+» وتنقلب دلالتُه. لا تحذفهما
   عند تحرير النصّ — لا يظهران في المحرّر لكن أثرهما يظهر في الشاشة. */
const NEXT: Record<string, Next> = {
  'stage2-selection': {
    eyebrow: 'المرحلة القادمة',
    title: 'الديربي',
    rule: 'لاعب من كل فريق ضدّ الآخر. من يجيب أسرع له 20 نقطة إذا أصاب، وإن أخطأ يُخصم منه 10 نقاط.',
    cta: 'ابدأ',
  },
  'stage3-play': {
    eyebrow: 'المرحلة القادمة',
    title: 'الحق ما تلحق',
    rule: `${STAGE3_TIMER_MS / 1000} ثانية دون توقف لكل فريق، و⁨+${STAGE3_POINTS}⁩ نقاط لكل إجابة صحيحة.`,
    cta: 'ابدأ',
  },
  /* التعادل ليس «مرحلة قادمة»: انتهت اللعبة والنتيجة متساوية، وهذا خبر قبل أن يكون
     إعلاناً عن مرحلة. الصياغة تقول ما حدث أولاً، ثم ما سيحدث. */
  tiebreak: {
    eyebrow: 'انتهت المراحل الثلاث والنتيجة',
    title: 'تعادل',
    rule: 'سؤال واحد يحسم اللعبة. أول فريق يصيبه يفوز — وإن لم يصبه أحد، يأتي سؤال آخر حتى يُحسم.',
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
  const stageNo =
    state.intervalNext === 'stage2-selection' ? '02' : state.intervalNext === 'stage3-play' ? '03' : '∞'

  const [held, setHeld] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const start = () => {
    if (held) return
    setHeld(true)
    timer.current = window.setTimeout(() => dispatch({ t: 'INTERVAL_CONTINUE' }), HOLD_MS)
  }

  return (
    /* مدّةُ الوقفة تصل الأنماطَ متغيّراً: الرقم في HOLD_MS وحده، والمؤقّت والحركة يقرآنه معاً. */
    <div className="screen center-col" style={{ '--hold': `${HOLD_MS}ms` } as CSSProperties}>
      <ScoreBar onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })} teams={state.teams} />
      <div className="grow center-all">
        <div className={'interval-card' + (tie ? ' tie' : '') + (held ? ' held' : '')}>
          <div className="il-stage-no tabular" aria-hidden="true">
            {stageNo}
          </div>
          <div className="il-live">
            <span /> انتقال مباشر
          </div>
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
      <style>{intervalCss}</style>
    </div>
  )
}
