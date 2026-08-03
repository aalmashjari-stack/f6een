export interface TeamSetupCardProps {
  name: string
  players: string[]
  /** الفريق البادئ بعد القرعة — إطار ذهبي متوهّج */
  starter?: boolean
}

/**
 * بطاقة فريق في شاشة الإعداد: الاسم فوق وقائمة اللاعبين تحته.
 *
 * الفريق البادئ يُعلَّم بالإطار الذهبي لا بسطر نصّي إضافي — النتيجة تُرى
 * لا تُقرأ.
 */
export function TeamSetupCard({ name, players, starter }: TeamSetupCardProps) {
  return (
    <div className={'sh-teamcard' + (starter ? ' sh-teamcard--starter' : '')}>
      <div className="sh-teamcard__name">{name}</div>
      <div className="sh-teamcard__players">
        {players.map((p, i) => (
          <div key={i} className="sh-teamcard__player">{p}</div>
        ))}
      </div>
    </div>
  )
}
