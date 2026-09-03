import {
  STAGE1_LEVEL_POINTS,
  STAGE2_CORRECT,
  STAGE2_WRONG,
  STAGE3_POINTS,
  STAGE3_TIMER_MS,
} from './session'

/* شرح مختصر للمراحل الثلاث — نصّه من SPEC القسمين ٤–٦، وأرقامه من ثوابت
   المحرّك لا مكتوبة بيد. يعيش هنا لا في شاشة واحدة: الشرح يظهر في شاشة
   التعريف وفي الإعداد معاً، ونسختان منه تفترقان بصمت أوّل ما يتغيّر تنقيط.
   العلامة LRM قبل الإشارة صريحة (‎) لا حرفاً خفيّاً: بدونها تنقلب
   «+20» إلى «20+» داخل فقرة عربية. */
export const STAGES = [
  {
    name: 'الجولة الجماعية',
    desc: 'كل فريق يختار ثلاث فئات، ويجيب صاحب الدور على خليّة من اللوح',
    points: `${STAGE1_LEVEL_POINTS['سهل']} · ${STAGE1_LEVEL_POINTS['متوسط']} · ${STAGE1_LEVEL_POINTS['صعب']}`,
  },
  {
    name: 'الديربي',
    desc: 'لاعب ضدّ لاعب بلا تشاور — الأسبق وحده يربح أو يخسر',
    points: `‎+${STAGE2_CORRECT} / −${Math.abs(STAGE2_WRONG)}`,
  },
  {
    name: 'الحق ما تلحق',
    desc: `كل فريق وحده، ${STAGE3_TIMER_MS / 1000} ثانية لا تتوقّف`,
    points: `‎+${STAGE3_POINTS} لكل إجابة`,
  },
] as const
