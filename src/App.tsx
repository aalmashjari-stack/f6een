import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { GameState } from './game/session'
import { persistUsedIds } from './game/session'
import { reducer } from './game/reducer'
import { useSession } from './lib/auth'
import { pushUsedIds, syncUsedIds } from './lib/usedQuestions'
import { QuitGame } from './components/QuitGame'
import { Splash } from './screens/Splash'
import { Intro } from './screens/Intro'
import { Setup } from './screens/Setup'
import { WheelScreen } from './screens/WheelScreen'
import { Stage1Question } from './screens/Stage1Question'
import { Stage1Reveal } from './screens/Stage1Reveal'
import { Interval } from './screens/Interval'
import { Stage2Selection } from './screens/Stage2Selection'
import { Stage2Question } from './screens/Stage2Question'
import { Stage2Reveal } from './screens/Stage2Reveal'
import { Stage3 } from './screens/Stage3'
import { Tiebreak } from './screens/Tiebreak'
import { Endgame } from './screens/Endgame'

/* حفظ محلي واستئناف خلال ٢٤ ساعة — نافذة الاستكمال (القسم ٩). */
const SAVE_KEY = 'f6een.session'
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000

/* يُرفع كلما تغيّر شكل الحالة المحفوظة. جلسة حُفظت بنسخة أقدم تنقصها حقول
   تعتمد عليها النسخة الحالية، فاستئنافها يُسقط التطبيق في منتصف اللعب.
   الأسلم أن تُطرح ويُستأنف من الإعداد — وهذا لا يكلّف لعبة لأن الخصم عند الإنشاء. */
const SAVE_VERSION = 3

interface Saved {
  savedAt: number
  version?: number
  state: Omit<GameState, 'usedQuestionIds'> & { usedQuestionIds: string[] }
}

function loadSession(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved
    if (saved.version !== SAVE_VERSION) {
      localStorage.removeItem(SAVE_KEY)
      return null
    }
    if (Date.now() - saved.savedAt > RESUME_WINDOW_MS) {
      localStorage.removeItem(SAVE_KEY)
      return null
    }
    if (saved.state.phase === 'endgame') return null
    return { ...saved.state, usedQuestionIds: new Set(saved.state.usedQuestionIds) }
  } catch {
    return null
  }
}

function saveSession(state: GameState | null) {
  try {
    if (!state) {
      localStorage.removeItem(SAVE_KEY)
      return
    }
    const payload: Saved = {
      savedAt: Date.now(),
      version: SAVE_VERSION,
      state: { ...state, usedQuestionIds: [...state.usedQuestionIds] },
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch {
    /* تجاهل */
  }
}

/* **الدخول موقوف مؤقّتاً بطلب علي (٢٧ أغسطس ٢٠٢٦).**
 *
 * `false` = يُعرض التعريف ثم يمرّ اللاعب بزرّ «ابدأ» بلا حساب.
 * `true`  = لا لعب بلا حساب، كما يشترط SPEC القسم ٩ (التسجيل إجباريّ،
 *           وعليه تُعلَّق ذاكرة الأسئلة والرصيد).
 *
 * سطرٌ واحد يعيده. ولا يُحذف كود الدخول: المزوّد مضبوط ومُختبَر، والموقوف
 * هو الاشتراط لا الآليّة. ومزامنة ذاكرة الأسئلة تبقى تعمل لمن دخل فعلاً. */
const REQUIRE_LOGIN = false

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, loadSession)
  const [splashDone, setSplashDone] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const session = useSession()
  const leaveSplash = useCallback(() => setSplashDone(true), [])

  useEffect(() => {
    saveSession(state)
  }, [state])

  /* ذاكرة الأسئلة عبر الجلسات — سجلّ مستقلّ عن لقطة الاستئناف، ولا يُمحى بانتهاء اللعبة.
     مربوط بالمجموعة وحدها لا بالحالة كلها: وإلا أُعيدت كتابة مئات المعرّفات مع كل ضغطة. */
  const used = state?.usedQuestionIds

  /* ما بلغ الخادمَ فعلاً. يمنع إعادة رفع مئات المعرّفات مع كل سؤال، ويجعل
     الرفعَ الفاشل يُعاد تلقائياً في التغيير التالي لأنّه لا يدخل هنا إلا بعد
     نجاحه. */
  const uploaded = useRef<Set<string>>(new Set())
  const uid = session?.user.id ?? null

  /* مزامنة أولى عند توفّر الحساب — قبل أي لعبة، فالإعداد يقرأ من التخزين
     المحلّي بعد أن يكون قد اغتنى بما عند الخادم. */
  useEffect(() => {
    if (!uid) {
      uploaded.current = new Set()
      return
    }
    let alive = true
    syncUsedIds(uid)
      .then(({ merged }) => {
        if (alive) uploaded.current = merged
      })
      .catch(() => {
        /* بلا إنترنت أو بخطأ خادم: اللعبة تكمل بذاكرتها المحلّية،
           وتُعاد المحاولة عند التشغيل القادم. */
      })
    return () => {
      alive = false
    }
  }, [uid])

  useEffect(() => {
    if (!used) return
    persistUsedIds(used)

    if (!uid) return
    const fresh = [...used].filter((id) => !uploaded.current.has(id))
    if (fresh.length === 0) return
    pushUsedIds(uid, fresh)
      .then(() => {
        for (const id of fresh) uploaded.current.add(id)
      })
      .catch(() => {
        /* يبقى خارج `uploaded` فيُعاد رفعه مع السؤال التالي. */
      })
  }, [used, uid])

  /* الشعار يبقى حتى تنتهي مدّته **و** تُقرأ الجلسة من المخزن. قراءتها ليست
     فوريّة، فبدون انتظارها تومض شاشة الدخول لحظةً أمام لاعبٍ مسجَّل أصلاً. */
  if (!splashDone || session === undefined) return <Splash onDone={leaveSplash} />

  /* التعريف يُعرض لمن لا جلسة له. وحين يكون الدخول موقوفاً يمرّ منه بزرّ
     «ابدأ» بدل المزوّدين — انظر REQUIRE_LOGIN أعلاه. */
  if (!session && !introDone) {
    return <Intro onDone={REQUIRE_LOGIN ? undefined : () => setIntroDone(true)} />
  }

  if (!state) return <Setup onStart={(input) => dispatch({ t: 'START', input })} />

  /* الشاشة تُحسب ثم تُغلَّف: زرّ الخروج يجب أن يظهر فوق كل شاشة لعب، ووضعه
     هنا يجعله مكاناً واحداً بدل تمريره إلى تسع شاشات. */
  const screen = (() => {
    switch (state.phase) {
      case 'stage1-wheel':
      case 'stage2-wheel':
        return <WheelScreen state={state} dispatch={dispatch} />
      case 'stage1-question':
        return <Stage1Question state={state} dispatch={dispatch} />
      case 'stage1-reveal':
        return <Stage1Reveal state={state} dispatch={dispatch} />
      case 'interval':
        return <Interval state={state} dispatch={dispatch} />
      case 'stage2-selection':
        return <Stage2Selection state={state} dispatch={dispatch} />
      case 'stage2-question':
        return <Stage2Question state={state} dispatch={dispatch} />
      case 'stage2-reveal':
        return <Stage2Reveal state={state} dispatch={dispatch} />
      case 'stage3-play':
        return <Stage3 state={state} dispatch={dispatch} />
      case 'tiebreak':
        return <Tiebreak state={state} dispatch={dispatch} />
      case 'endgame':
        return <Endgame state={state} dispatch={dispatch} />
      default:
        return <Setup onStart={(input) => dispatch({ t: 'START', input })} />
    }
  })()

  return (
    <>
      {screen}
      {/* الختام فيه «لعبة جديدة» أصلاً، فلا يُزاحَم بزرٍّ ثانٍ يفعل الشيء نفسه. */}
      {state.phase !== 'endgame' && <QuitGame onQuit={() => dispatch({ t: 'NEW_GAME' })} />}
    </>
  )
}
