import { useEffect, useReducer } from 'react'
import type { GameState } from './game/session'
import { reducer } from './game/reducer'
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
const SAVE_KEY = 'sahsahli.session'
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

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, loadSession)

  useEffect(() => {
    saveSession(state)
  }, [state])

  if (!state) return <Setup onStart={(input) => dispatch({ t: 'START', input })} />

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
}
