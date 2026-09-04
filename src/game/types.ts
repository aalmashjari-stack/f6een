export type Level = 'سهل' | 'متوسط' | 'صعب'

export interface Question {
  id: string
  category: string
  level: Level
  topic: string
  question: string
  answer: string
  /**
   * مفتاح صورة — لأسئلة «من صاحب الصورة؟». حين يوجد، تُعرض الصورة بدل نصّ
   * السؤال، والإجابة اسمُ صاحبها. المفتاح يُحلّ إلى ملفٍ مُجمَّع في celebs.ts.
   */
  image?: string
  /**
   * عائلةٌ مصرَّح بها — موضوعُ السؤال حين يتكرّر بصيغٍ مختلفة. تُستنتج العائلةُ
   * عادةً من أول أربع كلمات (انظر `familyOf`)، وذلك يمسك القالب المتشابه ولا
   * يمسك ما اتّحد معناه واختلف لفظه: «من رسم الموناليزا؟» و«من صاحب الصورة؟»
   * وجوابهما واحد. فيُصرَّح هنا بالموضوع، ويسري التصريحُ على أسئلة الصور أيضاً
   * — وهي المستثناة من الاستنتاج لأنّ نصّها واحد.
   *
   * والسؤالُ ينتمي إلى عائلتيه معاً: قالبِه المستنتَج وموضوعِه المصرَّح به،
   * فلا يخسر الحارسُ القديم شيئاً بمكسب الجديد.
   */
  family?: string
}

export type TeamId = 0 | 1

export interface Player {
  id: string
  name: string
}

export interface Team {
  id: TeamId
  name: string
  players: Player[]
  score: number
}

/** حالة لاعب في الديربي: صمت ابتدائياً، ثم صح أو غلط. */
export type Mark = 'صمت' | 'صح' | 'غلط'

/** الشاشات — تدفّق الجلسة في القسم ٣ من SPEC. */
export type Phase =
  | 'setup'
  | 'stage1-board'
  | 'stage1-question'
  | 'stage1-reveal'
  | 'interval'
  | 'stage2-selection'
  | 'stage2-question'
  | 'stage2-reveal'
  | 'stage3-play'
  | 'tiebreak'
  | 'endgame'
