---
name: install-iphone
description: بناء تطبيق فطين وتثبيته على آيفون علي «Bou 3azooz» وعلى المحاكي معاً، ثمّ تشغيله. من main افتراضاً، أو من فرعٍ محلّيّ لمعاينةٍ قبل النشر. يشغّله علي وحده.
disable-model-invocation: true
argument-hint: "[اسم فرع لمعاينته — يُترك فارغاً للبناء من main]"
---

# تثبيت فطين على الآيفون والمحاكي

التطبيق (Capacitor 8، `com.f6een.app`) يحمل حزمة الويب **داخله**: نشرُ الموقع لا يحدّثه، ولا يتحدّث إلّا ببناءٍ وتثبيتٍ جديدين. والقاعدة الدائمة: كلّ تثبيتٍ على الجوال **و**المحاكي معاً.

| | المعرّف |
|---|---|
| آيفون علي «Bou 3azooz» | `8A2DA890-CB55-501A-866F-BCF1FFE6DE3B` |
| المحاكي iPhone 17 Pro Max | `6C9ECD3D-499F-4E56-9916-B869A622CB6A` |
| فريق التوقيع | `8P4B62L4C6` (حساب مجّانيّ — البروفايل 7 أيّام) |

`S` أدناه مجلّد الـscratchpad لهذه الجلسة (لا داخل المستودع: Documents مزامَن مع iCloud).

## ١. المصدر

- بلا وسيط: من main المحدَّث — `git checkout main && git pull -q f6een main`.
- بفرع ($ARGUMENTS): فرع معاينةٍ محلّيّ لم يُنشر. قل لعلي صراحةً إنّ الجوال سيحمل ما ليس على الموقع. وإن كان التعديل موزّعاً على أكثر من فرع، اجمعها في فرعٍ محلّيّ واحد (`git merge`) من main — ولا تدفعه.
- في worktree: انسخ `.env` من الشجرة الأصليّة قبل البناء، وإلّا خرج التطبيق شاشةً فارغة.

## ٢. البناء

```bash
npm run sync        # build ثمّ cap sync؛ postbuild ينظّف نسخ iCloud المكرّرة («اسم 2.jpg»)
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath "$S/dd" -allowProvisioningUpdates build
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'id=6C9ECD3D-499F-4E56-9916-B869A622CB6A' -derivedDataPath "$S/dd-sim" build
```

البناءان يستغرقان دقائق — شغّلهما في الخلفية إن كان شيءٌ آخر يُنجَز. وأيّ `error:` في السجلّ يوقف الخطوة: اعرضه ولا تثبّت بناءً قديماً بدلاً منه.

## ٣. الجوال

```bash
xcrun devicectl list devices | grep 8A2DA890      # يجب: available (paired)
xcrun devicectl device install app --device 8A2DA890-CB55-501A-866F-BCF1FFE6DE3B \
  "$S/dd/Build/Products/Release-iphoneos/App.app"
xcrun devicectl device process launch --device 8A2DA890-CB55-501A-866F-BCF1FFE6DE3B com.f6een.app
```

أخطاءٌ معروفة — ليست عطباً في البناء:

- **`DeviceLocked`**: اطلب من علي فتح قفل الجوال **ثمّ** أعد المحاولة. لا تكرّرها قبل ذلك.
- **`unavailable`**: الجوال بعيد أو مطفأ الشبكة/الكابل. قل ذلك وثبّت على المحاكي وحده.
- **«invalid code signature… not explicitly trusted»** عند التشغيل: علي يفتح الإعدادات ← عام ← إدارة VPN والجهاز ← almashjari@live.com ← وثوق، ثمّ أعد `process launch`.
- **«التطبيق لا يعمل» بعد أيّام**: البروفايل انتهى (7 أيّام). تاريخه:
  `security cms -D -i "$S/dd/Build/Products/Release-iphoneos/App.app/embedded.mobileprovision" | plutil -extract ExpirationDate raw -`
  والعلاج إعادة هذه المهارة كلّها.
- **«فطين is no longer available»**: iOS أزاح التطبيق (Offload Unused Apps) — أعد التثبيت.

## ٤. المحاكي

افتح لوحة المحاكي **أوّلاً** (أداة المحاكي: `attach`)، ثمّ `launch` بـ`app_path` = `$S/dd-sim/Build/Products/Debug-iphonesimulator/App.app`. خذ لقطة بعد التشغيل وتأكّد أنّه لم يخرج شاشةً فارغة.

نقرات أداة المحاكي تتأخّر نقرة: لقطةٌ بعد كلّ نقرة، وانتبه أنّ النقرة المكرّرة قد تقع على الشاشة التالية. وما بعد الدخول يحتاج حساباً — الدخول لعلي، لا تُدخل كلمة سرّ. لمعاينة شاشة الإعداد بلا حساب: `dev-setup.html` على سيرفر المعاينة في سفاري المحاكي.

## ٥. التقرير

بالعربيّة، قصيراً: من أيّ مصدرٍ بُني (main أو أيّ فرع)، وأنّه ثُبّت وشُغّل على الجوال والمحاكي (أو ما فشل ولماذا)، وتاريخ انتهاء التوقيع إن كان قريباً. ولم ترَ شاشة جوال علي بعينك — قل ذلك.
