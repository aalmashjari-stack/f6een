import type { GameState } from '../game/session'
import { STAGE1_QUESTIONS, stage1Level, stage1Owner } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { CategoryPicker } from '../components/CategoryPicker'
import { RoundBar } from '../components/RoundBar'

export function WheelScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const isStage1 = state.phase === 'stage1-wheel'

  const eyebrow = isStage1 ? (
    <RoundBar
      title="الجولة الجماعية"
      chips={[`سؤال ${state.s1Index + 1} / ${STAGE1_QUESTIONS}`, stage1Level(state.s1Index)]}
      turn={`دور ${state.teams[stage1Owner(state.s1Index, state.startingTeam)].name}`}
    />
  ) : (
    <RoundBar title="الديربي" chips={[`جولة ${state.s2Index + 1} / ${state.s2Rounds}`, 'متوسط']} />
  )

  return (
    <div className="screen">
      <ScoreBar teams={state.teams} />
      <CategoryPicker
        spent={state.spentCategories}
        eyebrow={eyebrow}
        auto={!isStage1}
        onResult={(category) => dispatch({ t: 'SPIN_DONE', category })}
      />
    </div>
  )
}
