export interface ScoreBarTeam {
  name: string
  score: number
}

export interface ScoreBarProps {
  /** الفريقان — الأول يُعرض يميناً في RTL */
  teams: [ScoreBarTeam, ScoreBarTeam]
  /** سطر السياق بين الكبسولتين: «راس براس · جولة 2 / 4» */
  label?: string
}

function Capsule({ team, lead }: { team: ScoreBarTeam; lead: boolean }) {
  return (
    <div className={'sh-scorebar__team' + (lead ? ' sh-scorebar__team--lead' : '')}>
      <span className="sh-scorebar__name">{team.name}</span>
      <span className="sh-scorebar__disc">
        <span className="sh-scorebar__pts sh-num">{team.score}</span>
      </span>
    </div>
  )
}

/**
 * شريط النتيجة — حاضر في كل شاشة لعب تقريباً.
 *
 * المتصدّر يأخذ إطاراً ذهبياً وقرصاً ممتلئاً ويرتفع 2px. التساوي لا يتصدّر فيه
 * أحد. النقاط قد تنزل تحت الصفر — هذا مقصود ولا يُمنع.
 *
 * سطر السياق يجلس **بين** الكبسولتين لا بعدهما، وعلى الشاشة الضيّقة ينزل سطراً
 * وحده بدل أن يدفع كبسولة الفريق الثاني خارج الشاشة.
 *
 * الأرقام معزولة اتجاهياً (`.sh-num`): بدونها تقفز إشارة الطرح لآخر الرقم في
 * RTL فيُقرأ «10−» بدل «−10».
 */
export function ScoreBar({ teams, label }: ScoreBarProps) {
  const lead = teams[0].score === teams[1].score ? -1 : teams[0].score > teams[1].score ? 0 : 1

  return (
    <div className="sh-scorebar">
      <Capsule team={teams[0]} lead={lead === 0} />
      {label && <div className="sh-scorebar__mid">{label}</div>}
      <Capsule team={teams[1]} lead={lead === 1} />
    </div>
  )
}
