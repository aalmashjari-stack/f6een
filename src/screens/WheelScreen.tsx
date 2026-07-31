import type { GameState } from '../game/session'
import { STAGE1_QUESTIONS, stage1Level, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { Wheel } from '../components/Wheel'

export function WheelScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const isStage1 = state.phase === 'stage1-wheel'
  const eyebrow = isStage1
    ? `الجولة الجماعية · سؤال ${state.s1Index + 1} / ${STAGE1_QUESTIONS} · ${stage1Level(state.s1Index)} · دور ${
        state.teams[stage1Owner(state.s1Index, state.startingTeam)].name
      }`
    : `راس براس · جولة ${state.s2Index + 1} / ${state.s2Rounds} · متوسط`

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} />
      <Wheel spent={state.spentCategories} eyebrow={eyebrow} onResult={(category) => dispatch({ t: 'SPIN_DONE', category })} />
    </div>
  )
}
