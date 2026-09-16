import UIKit
import Capacitor

/// اتجاهُ الشاشة بيد اللعبة لا بيد `Info.plist` وحده.
///
/// ما قبل «ابدأ اللعبة» — التعريف والدخول والإعداد — يُلعب بالجوال في اليد
/// وفيه كتابة، فيُترك للجهاز اتجاهُه. ومن ضغطة البدء إلى الختام الشاشةُ
/// عريضة (SPEC §١)، فيُقفل الأفقيّ بجهتيه ويُدار الجهاز فوراً بلا بوّابة
/// «أدر جهازك» (قرار علي ٢٤ أغسطس ٢٠٢٦ — لا بوّابة في التطبيق).
///
/// إضافةٌ داخل التطبيق لا حزمة: `@capacitor/screen-orientation` تقفل جهةً
/// أفقيّةً واحدة، واللاعب يدير الجهاز كيف شاء.
@objc(OrientationPlugin)
public class OrientationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OrientationPlugin"
    public let jsName = "F6eenOrientation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "lock", returnType: CAPPluginReturnPromise)
    ]

    /// ما يسمح به `Info.plist` — يُقرأ مرّةً عند التحميل ليُعاد عند «any».
    private var allOrientations: [Int] = []

    override public func load() {
        if let vc = bridge?.viewController as? CAPBridgeViewController {
            allOrientations = vc.supportedOrientations
        }
    }

    @objc func lock(_ call: CAPPluginCall) {
        let mode = call.getString("mode") ?? "any"
        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController as? CAPBridgeViewController else {
                call.reject("no_view_controller")
                return
            }
            let mask: UIInterfaceOrientationMask
            switch mode {
            case "landscape":
                vc.supportedOrientations = [
                    UIInterfaceOrientation.landscapeLeft.rawValue,
                    UIInterfaceOrientation.landscapeRight.rawValue,
                ]
                mask = .landscape
            case "portrait":
                vc.supportedOrientations = [UIInterfaceOrientation.portrait.rawValue]
                mask = .portrait
            default:
                vc.supportedOrientations = self.allOrientations
                mask = vc.supportedInterfaceOrientations
            }
            if #available(iOS 16.0, *) {
                vc.setNeedsUpdateOfSupportedInterfaceOrientations()
                /// الطلب يدير الجهاز الآن إن كان اتجاهُه الحاليّ خارج القناع؛
                /// وإن كان داخله لا يفعل شيئاً. وخطؤه لا يُعدّ فشلاً: القفل
                /// نفسه ثبت في `supportedOrientations` وسيُطبَّق مع أوّل دوران.
                vc.view.window?.windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
            } else {
                UIViewController.attemptRotationToDeviceOrientation()
            }
            call.resolve()
        }
    }
}

/// المتحكّم الجذر — يسجّل إضافات التطبيق نفسه (لا الحزم) عند تحميل الجسر.
class F6eenViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(OrientationPlugin())
    }
}
