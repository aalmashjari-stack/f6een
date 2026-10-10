import type { GameState } from '../game/session'
import type { TeamId } from '../game/types'
import { stage1Owner, STAGE1_LEVEL_POINTS } from '../game/session'
import type { Action } from '../game/reducer'
import { ScoreBar } from '../components/ScoreBar'
import { questionSizeSuffix } from '../components/QuestionText'
import { FitAnswer } from '../components/FitAnswer'
import { AnswerFace } from '../components/AnswerFace'
import { celebSrc } from '../game/celebs'
import { isCharadeKind, isCharadesCategory } from '../game/charades'
import { shippedImage } from '../game/shippedImage'
import { isImageUrl } from '../game/celebs'
import stage1RevealCss from './Stage1Reveal.css?inline'

/**
 * كشف وتنقيط الجولة الجماعية — الشاشة ٣.
 *
 * ثلاثة قيود من SPEC (القسم ١٠) تحكم هذه الشاشة:
 * الإجابة أكبر عنصر · السؤال ينكمش ويبهت لكنه يبقى · البطاقتان **متساويتان في
 * البروز** لأنهما خياران لا مؤشر دور · و«لا أحد أصاب» خيار ثالث أصغر.
 *
 * السؤال والإجابة في بطاقة واحدة لا بطاقتين: هما جملة واحدة يقرؤها المجلس
 * دفعةً واحدة، وفصلهما كان يترك السؤالَ سطراً يتيماً فوق صندوق نصفه فارغ.
 *
 * وتحت كل خيار نتيجةُ صاحب الدور قبل الضغطة وبعدها (٥٠ ← ٨٠): الانتقال يقول
 * للحكم أثرَ ضغطته قبل أن يضغط — وهو ما يتردّد فيه فعلاً حين يصيح المجلس.
 *
 * **صارت حكماً على صاحب الدور وحده** بعد إلغاء قيد الاختلاف: الخليّة له،
 * فالخياران «أصاب» و«أخطأ» لا ثلاثةُ نتائج بين فريقين. ولغةُ اللونين هي لغة
 * تنقيط الديربي نفسها (القسم ١٠): الصح ذهبيّ ممتلئ، والغلط بإطار مرجاني.
 */
export function Stage1Reveal({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const owner = stage1Owner(state.s1Index, state.startingTeam)
  const q = state.currentQuestion!
  /* نقاطُ **الخليّة** لا مستوى السؤال: المخفّض يمنح بمستوى الخليّة، وخليّةٌ
     فرغ مخزونها بعد الحرّاس تسقط إلى مستوىً آخر (`drawOne`) — فكانت الشاشة
     تقول «10 نقاط» والفريق يأخذ 30. */
  const points = STAGE1_LEVEL_POINTS[state.s1Cell?.level ?? q.level]

  /* الخياران اسما الفريقين لا «أصاب/أخطأ» (قرار علي ٥ سبتمبر ٢٠٢٦): النقاط
     لمن أجاب أيّاً كان، فالخليّة لم تعد لصاحب الدور وحده. وتحت كل اسم نتيجةُ
     فريقه قبل الضغطة وبعدها. */
  const picks = state.teams.map((t, i) => ({
    team: i as TeamId,
    label: t.name,
    from: t.score,
    to: t.score + points,
  }))

  /* فئة «ولا كلمة» (SPEC §٤): الفريق الآخر لا يخمّن أصلاً، فلا معنى لـ«من
     أجاب؟» — الحكمُ على فريق الممثّل وحده: «أصاب» يمنحه نقاط الخليّة و«أخطأ»
     لا شيء لأحد. والفعلُ نفسه (`S1_SCORE`) بفريق صاحب الدور أو بلا فريق. */
  const charade = isCharadesCategory(q.category)
  const ownerPick = picks[owner]
  /* بوستر العمل مع الكشف (طلب علي ٢٠ سبتمبر ٢٠٢٦: «مع الجواب أظهر بوستر
     العمل»). ليس وجهاً في دائرة — `AnswerFace` تقصّ مربّعاً من الوسط ولا
     يصلح لملصقٍ طوليّ — بل صورةٌ كاملة بمقاس `.rv-photo` نفسه الذي تعرض به
     البطاقة صورةَ السؤال، والعنوان تحتها. والمفتاح المجهول يُتجاهَل كما في
     `AnswerFace`: لا ملصقَ خيرٌ من إطارٍ فارغ. */
  const posterKey = charade ? q.answerImage : undefined
  const poster = posterKey ? (isImageUrl(posterKey) ? posterKey : shippedImage(posterKey)) : null

  return (
    <div className="screen">
      <ScoreBar
        onAdjust={(team, delta) => dispatch({ t: 'ADJUST', team, delta })}
        teams={state.teams}
        turnTeam={owner}
      />

      <div className="rv-card">
        {q.image ? (
          <img
            className="rv-photo"
            src={celebSrc(q.image)}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : charade ? (
          poster ? (
            <img
              className="rv-photo rv-poster"
              src={poster}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="rv-q">الكلمة كانت</div>
          )
        ) : (
          <div className={'rv-q' + questionSizeSuffix(q.question)}>{q.question}</div>
        )}
        <span className="rv-rule" aria-hidden="true" />
        {/* صورةُ الإجابة تجاور الاسمَ ولا تحلّ محلّ السؤال: السؤال هنا نصٌّ
            قائم بنفسه، والوجهُ ثمرةُ الكشف. */}
        {charade ? (
          /* الغلافُ صندوقُ قياس `FitAnswer`: بلا غلافٍ يقيس نفسَه على البطاقة
             كلِّها، فيهبط إلى أرضيّته كلّما ضاقت البطاقة بالملصق — والملصقُ هو
             الذي ينكمش (flex 0 1 auto) لا العنوان. */
          <>
            {/* النوع فوق العنوان — كما يقرؤه الممثّل في هاتفه (طلب علي ٢٠
                سبتمبر ٢٠٢٦): المجلس يعرف ما كان يُمثَّل لا اسمَه وحده. وخارجَ
                صندوق `FitAnswer`: داخله يُحسب على العنوان فيهبط مقاسُه إلى النصف. */}
            {isCharadeKind(q.topic) && <span className="rv-kind">{q.topic}</span>}
            <div className="rv-poster-title">
              <FitAnswer className="rv-a">{q.answer}</FitAnswer>
            </div>
          </>
        ) : (
          <AnswerFace q={q}>
            <FitAnswer className="rv-a">{q.answer}</FitAnswer>
          </AnswerFace>
        )}
      </div>

      {/* حُذف شريط «قرار الحكم» في ٢٥ أغسطس ٢٠٢٦ بقرار علي: «مسوية زحمة
          عالفاضي». وهو كذلك — «من أصاب؟» فوقه يوجّه السؤال إلى الحكم،
          والبطاقتان تحته هما القرار نفسه. */}
      {/* «نقطة» لا «نقاط» مع العشرين والثلاثين (تصحيح علي)، و«نقاط» مع العشر:
          العربية تجمع من ثلاثة إلى عشرة وتُفرد بعدها. */}
      <div className="eyebrow center rv-ask">
        {charade ? `هل أصاب ${ownerPick.label}؟` : 'من أجاب؟'} — {points} {points > 10 ? 'نقطة' : 'نقاط'}
      </div>

      {charade ? (
        <div className="pick-cards grow">
          <button className="pick pick-yes" onClick={() => dispatch({ t: 'S1_SCORE', team: owner })}>
            <span className="pk-name">أصاب</span>
            <span className="pk-delta">
              <span className="pk-from tabular">{ownerPick.from}</span>
              <span className="pk-arrow" aria-hidden="true">
                ←
              </span>
              <span className="pk-to tabular">{ownerPick.to}</span>
            </span>
          </button>
          <button className="pick pick-no" onClick={() => dispatch({ t: 'S1_SCORE', team: null })}>
            <span className="pk-name">أخطأ</span>
            <span className="pk-delta">
              <span className="pk-from tabular">{ownerPick.from}</span>
              <span className="pk-arrow" aria-hidden="true">
                ←
              </span>
              <span className="pk-to tabular">{ownerPick.from}</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="pick-cards grow">
          {picks.map(({ team, label, from, to }) => (
            <button
              key={team}
              className={'pick pick-team team-' + team}
              onClick={() => dispatch({ t: 'S1_SCORE', team })}
            >
              <span className="pk-name">{label}</span>
              <span className="pk-delta">
                <span className="pk-from tabular">{from}</span>
                <span className="pk-arrow" aria-hidden="true">
                  ←
                </span>
                <span className="pk-to tabular">{to}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* «لم يجب أحد» (صياغة علي، بعد «لا أحد أصاب» ثمّ «لا أحد أجاب»): بابُ
          الخروج من جنسه. عاد بعد أن ذهب في ٣ سبتمبر: بالخيارين السابقين كان «أخطأ» يكفي، وبثلاثة
          نتائج لا بدّ من بابٍ لِمن لم يُصب أحدٌ عنده. وهو أصغر لأنّه الأندر.
          وفي «ولا كلمة» يغني عنه «أخطأ». */}
      {!charade && (
        <button className="pick-none" onClick={() => dispatch({ t: 'S1_SCORE', team: null })}>
          لم يجب أحد
        </button>
      )}

      <style>{stage1RevealCss}</style>
    </div>
  )
}
