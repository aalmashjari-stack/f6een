export interface VersusPairProps {
  /** اسم لاعب الفريق الأول — يميناً في RTL */
  right: string
  /** اسم لاعب الفريق الثاني — يساراً في RTL */
  left: string
  /** بعد استقرار الاختيار: الاسمان يصيران ذهبيين متوهّجين */
  settled?: boolean
}

/**
 * إعلان المواجهة الفردية: اسمان كبيران و«ضد» مرجانية بينهما.
 *
 * «ضد» مرجانية لا ذهبية: المرجاني لغة التوتّر في هذه اللعبة، وهذه لحظة
 * مواجهة لا لحظة مكافأة.
 */
export function VersusPair({ right, left, settled }: VersusPairProps) {
  return (
    <div className={'sh-versus' + (settled ? ' sh-versus--settled' : '')}>
      <div className="sh-versus__slot">
        <span className="sh-versus__name">{right}</span>
      </div>
      <span className="sh-versus__word">ضد</span>
      <div className="sh-versus__slot">
        <span className="sh-versus__name">{left}</span>
      </div>
    </div>
  )
}
