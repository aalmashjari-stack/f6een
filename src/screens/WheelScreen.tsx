import type { GameState } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { CategoryPicker } from '../components/CategoryPicker'
import { RoundBar } from '../components/RoundBar'

/**
 * سحب التصنيف — **الديربي وحده** منذ صار لوحُ الجولة الجماعية مختاراً من
 * الفريقين (القسم ٧). فلا زرّ هنا ولا صاحب دور: السحبة تلقائية، والمرحلة
 * كلّها متوسّطة المستوى.
 */
export function WheelScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  return (
    <div className="screen">
      <ScoreBar teams={state.teams} />
      <CategoryPicker
        spent={state.spentCategories}
        eyebrow={<RoundBar title="الديربي" chips={[`جولة ${state.s2Index + 1} / ${state.s2Rounds}`, 'متوسط']} />}
        auto
        onResult={(category) => dispatch({ t: 'SPIN_DONE', category })}
      />
    </div>
  )
}
