import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * شبكةُ الأمان تحت شاشات اللعب.
 *
 * خطأٌ في الرسم كان يترك الجذر فارغاً: شاشةً بيضاء أمام المجلس بلا زرّ ولا
 * كلمة، وإن كان سببه لقطةً محفوظة فالإقلاعُ التالي يعيده — حلقةٌ لا مخرج
 * منها إلّا بمسح المخزن (تدقيق ٦ سبتمبر ٢٠٢٦).
 *
 * الشاشة لا تقرّر عن اللاعب: «حاول مجدّداً» تعيد التحميل واللقطة كما هي،
 * و«ابدأ لعبة جديدة» تُنهي الجلسة كانسحاب. سياسةُ التعويض عن الانهيار في
 * SPEC ٩ (كود الهدية) لا تتغيّر هنا.
 *
 * **والإنهاء بضغطتين كـ«إنهاء»** (علي ٥ أكتوبر ٢٠٢٦، من تدقيق التجربة): البطاقة
 * تطمئن «محفوظة» ثمّ كان زرّها الثاني يرمي اللعبة المدفوعة بضغطة بلا كلمة عن
 * الثمن. الأولى تكشف «اللعبة مخصومة ولا تُعاد»، والثانية تُنهي، وتنطفئ وحدها
 * بعد أربع ثوانٍ. النصوص نصوص `QuitGame` نفسها.
 */
export class CrashScreen extends Component<
  { onNewGame: () => void; charged?: boolean; children: ReactNode },
  { error: Error | null; asking: boolean }
> {
  state = { error: null as Error | null, asking: false }
  private disarm: number | undefined

  componentWillUnmount() {
    window.clearTimeout(this.disarm)
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    /* للتشخيص في الطرفيّة وحدها — لا رمزَ حساب ولا بيانات لاعب فيه. */
    console.error('crash', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="screen center-col crash">
        <div className="grow center-all">
          <div className="crash-card">
            <div className="crash-title">تعطّلت الشاشة</div>
            <p className="crash-text">
              وقع خطأ في عرض اللعبة. النقاط والأسئلة محفوظة، فجرّب أوّلاً إعادة المحاولة.
            </p>
            <div className="crash-actions">
              <button className="action coral" onClick={() => window.location.reload()}>
                حاول مجدّداً
              </button>
              {this.state.asking && this.props.charged && (
                <p className="crash-warn">اللعبة مخصومة ولا تُعاد</p>
              )}
              <button
                className={'action ghost' + (this.state.asking ? ' asking' : '')}
                onClick={() => {
                  if (!this.state.asking) {
                    this.setState({ asking: true })
                    window.clearTimeout(this.disarm)
                    this.disarm = window.setTimeout(() => this.setState({ asking: false }), 4000)
                    return
                  }
                  window.clearTimeout(this.disarm)
                  this.setState({ error: null, asking: false })
                  this.props.onNewGame()
                }}
              >
                {this.state.asking ? 'تأكيد الإنهاء' : 'ابدأ لعبة جديدة'}
              </button>
            </div>
          </div>
        </div>
        <style>{`
          .crash-card { max-width: 640px; text-align: center; display: grid; gap: 18px; padding: 8px; }
          .crash-title { font-size: clamp(28px, 5vw, 44px); font-weight: 800; }
          .crash-text { font-size: clamp(16px, 2.4vw, 22px); margin: 0; opacity: .85; }
          .crash-actions { display: grid; gap: 12px; }
          .crash-warn { margin: 0; font-weight: 800; color: var(--n-bad, #DC4033); font-size: clamp(14px, 2vw, 18px); }
          html[data-skin] .crash .action.ghost.asking { background: #fff; color: var(--n-bad, #DC4033); box-shadow: inset 0 0 0 3px var(--n-bad, #DC4033); }
        `}</style>
      </div>
    )
  }
}
