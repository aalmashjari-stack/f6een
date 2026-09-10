import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // انعكاس الشاشة (AirPlay) إلى تلفزيون: قبل iOS 27 يفتح النظامُ للتطبيق
        // مشهداً ثانياً بدور «شاشة خارجيّة غير تفاعليّة» تلقائيّاً، ويتركُ له
        // القرار: إن أضاف نافذةً إلى هذا المشهد عُرضت هي على التلفزيون بدل
        // المرآة؛ وإن لم يضف شيئاً عكس النظامُ شاشةَ التلفون كما هي.
        // القالبُ كان يبني نافذةً وCAPBridgeViewController لأيّ مشهد، فأخذ
        // التلفزيون نسخةً ثانيةً من التطبيق لا تتبع لمسَ التلفون وتجمّدت
        // على أوّل صورة. لا نافذةَ لغير المشهد الرئيس — فتعود المرآة.
        // (مرجع: جواب مهندس آبل، developer.apple.com/forums/thread/745553)
        guard session.role == .windowApplication else {
            window?.windowScene = nil
            window = nil
            return
        }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
