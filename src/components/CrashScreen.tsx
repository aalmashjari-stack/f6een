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
 */
export class CrashScreen extends Component<
  { onNewGame: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

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
              <button
                className="action ghost"
                onClick={() => {
                  this.setState({ error: null })
                  this.props.onNewGame()
                }}
              >
                ابدأ لعبة جديدة
              </button>
            </div>
          </div>
        </div>
        <style>{`
          .crash-card { max-width: 640px; text-align: center; display: grid; gap: 18px; padding: 8px; }
          .crash-title { font-size: clamp(28px, 5vw, 44px); font-weight: 800; }
          .crash-text { font-size: clamp(16px, 2.4vw, 22px); margin: 0; opacity: .85; }
          .crash-actions { display: grid; gap: 12px; }
        `}</style>
      </div>
    )
  }
}
