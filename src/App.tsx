import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { GameState, SetupInput, StoredState } from './game/session'
import { createSession, decodeState, encodeState, persistUsedIds } from './game/session'
import { reducer } from './game/reducer'
import { useSession } from './lib/auth'
import {
  closeSession,
  fetchBalance,
  fetchOpenSession,
  saveSessionState,
  startSession,
} from './lib/games'
import { pushUsedIds, syncUsedIds } from './lib/usedQuestions'
import { applyCachedBlocked, reportQuestion, syncBlocked } from './lib/questionFlags'
import {
  applyCachedCategories,
  applyCachedOverlay,
  syncCategories,
  syncOverlay,
} from './lib/questionOverlay'
import { AccountMenu } from './components/AccountMenu'
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

/* قائمة المحجوز المخزّنة تُطبَّق قبل أوّل سحب — عند تحميل الوحدة لا داخل
   أثر: `createSession` قد تُنادى في أوّل رسمة، وأثرٌ يجري بعدها يصل متأخّراً
   بسؤالٍ محجوز في الطابور. */
applyCachedBlocked()
applyCachedOverlay()
applyCachedCategories()

/* حفظ محلي واستئناف خلال ٢٤ ساعة — نافذة الاستكمال (القسم ٩). */
const SAVE_KEY = 'f6een.session'
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000

/* يُرفع كلما تغيّر شكل الحالة المحفوظة. جلسة حُفظت بنسخة أقدم تنقصها حقول
   تعتمد عليها النسخة الحالية، فاستئنافها يُسقط التطبيق في منتصف اللعب.
   الأسلم أن تُطرح ويُستأنف من الإعداد — وهذا لا يكلّف لعبة لأن الخصم عند الإنشاء. */
const SAVE_VERSION = 4

interface Saved {
  savedAt: number
  version?: number
  /** صفّ الجلسة على الخادم — الذي خُصمت له لعبة، والذي يُغلَق عند الختام. */
  sessionId?: string | null
  state: StoredState
}

function loadSaved(): { state: GameState; sessionId: string | null } | null {
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
    return { state: decodeState(saved.state), sessionId: saved.sessionId ?? null }
  } catch {
    return null
  }
}

function saveSession(state: GameState | null, sessionId: string | null) {
  try {
    if (!state) {
      localStorage.removeItem(SAVE_KEY)
      return
    }
    const payload: Saved = {
      savedAt: Date.now(),
      version: SAVE_VERSION,
      sessionId,
      state: encodeState(state),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch {
    /* تجاهل */
  }
}

/** تأجيل حفظ الحالة على الخادم — الحفظ المحلّي فوريّ، وهذا يلحق به. */
const SERVER_SAVE_DELAY_MS = 2500

/* **اشتراط الدخول** — أُوقف مؤقّتاً في ٢٧ أغسطس ٢٠٢٦ ثم أُعيد في اليوم نفسه.
 *
 * `false` = يُعرض التعريف ثم يمرّ اللاعب بزرّ «ابدأ» بلا حساب.
 * `true`  = لا لعب بلا حساب، كما يشترط SPEC القسم ٩ (التسجيل إجباريّ،
 *           وعليه تُعلَّق ذاكرة الأسئلة والرصيد).
 *
 * سطرٌ واحد يعيده. ولا يُحذف كود الدخول: المزوّد مضبوط ومُختبَر، والموقوف
 * هو الاشتراط لا الآليّة. ومزامنة ذاكرة الأسئلة تبقى تعمل لمن دخل فعلاً. */
const REQUIRE_LOGIN = true

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, () => loadSaved()?.state ?? null)
  /* صفّ الجلسة على الخادم. يُقرأ من الحفظ المحلّي كي ينجو من إغلاق المتصفّح:
     بدونه تبقى الجلسة مفتوحة على الخادم بعد أن تنتهي على الجهاز، فيردّها
     `start_session` بدل أن يبدأ لعبةً جديدة. */
  const [sessionId, setSessionId] = useState<string | null>(() => loadSaved()?.sessionId ?? null)
  const [balance, setBalance] = useState<number | null>(null)
  const [splashDone, setSplashDone] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const session = useSession()
  const leaveSplash = useCallback(() => setSplashDone(true), [])

  useEffect(() => {
    saveSession(state, sessionId)
  }, [state, sessionId])

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
    /* وقائمة المحجوز معها — والمخزّنة منها مطبَّقة قبل هذا السطر أصلاً،
       فالفشل هنا لا يعيد سؤالاً محجوزاً إلى السحب. */
    syncBlocked().catch(() => {})
    /* وطبقة التعديلات معها — سؤالٌ صُحّح في اللوحة يصل الأجهزة هنا. */
    syncOverlay().catch(() => {})
    /* والفئات معها — الترتيب لا يهمّ: العجلة تُبنى عند فتح شاشة اللفّ،
       بعد أن يكون الاثنان قد وصلا أو بقيا على المخزّن. */
    syncCategories().catch(() => {})
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

  /* ================== الرصيد والجلسة على الخادم — SPEC ٣ و٩ ================== */

  /* المرجع يُقرأ داخل نداءات غير متزامنة، فيرى الحالة لحظةَ وصول الردّ لا
     لحظةَ انطلاق الطلب — والفرق هو ما يمنع استئنافاً متأخّراً من أن يقتحم
     لعبةً بدأها اللاعب في الأثناء. */
  const stateRef = useRef(state)
  stateRef.current = state

  const refreshBalance = useCallback(() => {
    fetchBalance()
      .then(setBalance)
      .catch(() => {
        /* يبقى `null` — و«غير معروف» لا يمنع البدء، القاعدة هي التي تمنع. */
      })
  }, [])

  useEffect(() => {
    if (!uid) {
      setBalance(null)
      return
    }
    refreshBalance()
  }, [uid, refreshBalance])

  /* استئناف جلسة مفتوحة من الخادم — للجهاز الذي لا لقطة محلّية عنده.
     الحفظ المحلّي أسبق لأنّه أحدث دائماً (يُكتب مع كل ضغطة، والخادم مؤجَّل). */
  useEffect(() => {
    if (!uid || stateRef.current) return
    let alive = true
    fetchOpenSession()
      .then((row) => {
        if (!alive || !row || stateRef.current) return
        setSessionId(row.id)
        dispatch({ t: 'RESUME', state: decodeState(row.state) })
      })
      .catch(() => {
        /* بلا شبكة: يبدأ من الإعداد، والجلسة المفتوحة تُردّ إليه في أوّل بدء. */
      })
    return () => {
      alive = false
    }
  }, [uid])

  /* رفع لقطة الحالة مؤجَّلاً: طلبٌ لكل ضغطة حكمٍ إغراقٌ بلا فائدة، والقيمة
     كلّها في آخر لقطة لا في تسلسلها. */
  useEffect(() => {
    if (!sessionId || !state || !uid) return
    const snapshot = state
    const t = setTimeout(() => {
      saveSessionState(sessionId, encodeState(snapshot)).catch(() => {
        /* المحلّي هو الأساس — واللقطة التالية تحمل ما فات هذه. */
      })
    }, SERVER_SAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [state, sessionId, uid])

  /* الختام يُغلق الجلسة — وبه وحده يستطيع الحساب بدء لعبةٍ بعدها. */
  const closedId = useRef<string | null>(null)
  useEffect(() => {
    if (!sessionId || state?.phase !== 'endgame') return
    const id = sessionId
    setSessionId(null)
    closedId.current = id
    closeSession(id, 'finished', encodeState(state)).catch(() => {
      /* تبقى مفتوحة، فيستأنفها أوّل بدءٍ قادم بلا خصم — لا خسارة على اللاعب. */
    })
  }, [state, sessionId])

  /**
   * البلاغ يُرفع إلى القاعدة فيُحجز السؤال عن الجميع حتى يراجعه المدير.
   *
   * المرجع يمنع الإرسال مرّتين: الحالة تُرسَم مرّات، والقائمة تُقرأ كاملة في
   * كل مرّة. وفشل الشبكة يُبتلع — البلاغ محفوظ في حالة الجلسة فيصل مع
   * لقطتها، والحجز المحلّي وقع أصلاً.
   */
  const sent = useRef(new Set<string>())
  useEffect(() => {
    if (!uid || !state) return
    for (const id of state.reportedQuestionIds) {
      if (sent.current.has(id)) continue
      sent.current.add(id)
      reportQuestion(id, sessionId ?? closedId.current).catch(() => {
        sent.current.delete(id)
      })
    }
  }, [state, uid, sessionId])

  /**
   * البلاغات تقع **بعد** الإغلاق — زرّ التبليغ في شاشة الختام نفسها.
   *
   * ولحظة الإغلاق تُفرغ `sessionId`، فحفظُ الحالة المؤجَّل لا يعمل بعدها
   * ولا يصل بلاغٌ إلى القاعدة أبداً. هذا الأثر يكتب اللقطة على الجلسة
   * المغلقة (سياسة «التعديل لصاحبها» لا تشترط أن تكون مفتوحة)، فيقرأها
   * `admin_reports` في اللوحة.
   */
  const reported = state?.reportedQuestionIds.length ?? 0
  useEffect(() => {
    if (!closedId.current || reported === 0 || !state) return
    saveSessionState(closedId.current, encodeState(state)).catch(() => {})
    /* العدد وحده هو المحرّك: كل بلاغ يزيده، وتغيّرات الحالة الأخرى بعد
       الختام لا شيء منها يستحقّ طلباً. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reported])

  /**
   * بدء اللعبة — نقطة الخصم الوحيدة.
   *
   * الحالة تُبنى هنا ثمّ تُرسل، لأنّ `start_session` قد يردّ جلسةً مفتوحة
   * سابقةً بدل التي أُرسلت (نافذة الاستكمال) — فما يُعتمد هو ما رجع لا ما ذهب.
   *
   * والخطأ يُترك يصعد إلى شاشة الإعداد: هي صاحبة الزرّ، وهي التي تعرض
   * «انتهى رصيدك» في مكانه.
   */
  const begin = useCallback(
    async (input: SetupInput) => {
      const fresh = createSession(input)
      /* بلا حساب لا خصم ولا جلسة خادم — مسار `REQUIRE_LOGIN = false` وحده. */
      if (!uid) {
        dispatch({ t: 'RESUME', state: fresh })
        return
      }
      const row = await startSession(encodeState(fresh))
      setSessionId(row.id)
      dispatch({ t: 'RESUME', state: decodeState(row.state) })
      refreshBalance()
    },
    [uid, refreshBalance],
  )

  /* الانسحاب يُغلق الجلسة ولا يُعيد الرصيد — «الخصم عند الإنشاء لا عند
     الإتمام» (SPEC ٣). ولو بقيت مفتوحة لعاد إليها أوّل بدءٍ بعدها، فوجد
     اللاعب لعبةً هجرها تُفرض عليه. */
  const quit = useCallback(() => {
    if (sessionId) {
      const snapshot = stateRef.current
      closeSession(sessionId, 'abandoned', snapshot ? encodeState(snapshot) : undefined).catch(
        () => {},
      )
      setSessionId(null)
    }
    closedId.current = null
    dispatch({ t: 'NEW_GAME' })
  }, [sessionId])

  /* الشعار يبقى حتى تنتهي مدّته **و** تُقرأ الجلسة من المخزن. قراءتها ليست
     فوريّة، فبدون انتظارها تومض شاشة الدخول لحظةً أمام لاعبٍ مسجَّل أصلاً. */
  if (!splashDone || session === undefined) return <Splash onDone={leaveSplash} />

  /* التعريف يُعرض لمن لا جلسة له. وحين يكون الدخول موقوفاً يمرّ منه بزرّ
     «ابدأ» بدل المزوّدين — انظر REQUIRE_LOGIN أعلاه. */
  if (!session && !introDone) {
    return <Intro onDone={REQUIRE_LOGIN ? undefined : () => setIntroDone(true)} />
  }

  if (!state) {
    return (
      <>
        <Setup onStart={begin} balance={balance} />
        {/* خارج اللعب فقط — لا إدارة حساب فوق سؤال مؤقّت. */}
        {session && (
          <AccountMenu session={session} balance={balance} onBalance={setBalance} />
        )}
      </>
    )
  }

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
        return <Endgame state={state} dispatch={dispatch} balance={balance} />
      default:
        return <Setup onStart={begin} balance={balance} />
    }
  })()

  return (
    <>
      {screen}
      {/* الختام فيه «لعبة جديدة» أصلاً، فلا يُزاحَم بزرٍّ ثانٍ يفعل الشيء نفسه. */}
      {state.phase !== 'endgame' && <QuitGame onQuit={quit} charged={sessionId !== null} />}
    </>
  )
}
