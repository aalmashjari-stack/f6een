---
name: publish
description: نشر تعديلٍ من فطين على f6een.com — فرعٌ نظيف من f6een/main، الفحوصات، PR ودمجٌ فوريّ، ثمّ قياس النشر الحيّ باسم الحزمة. يشغّله علي وحده.
disable-model-invocation: true
argument-hint: "[وصف قصير لما يُنشر، أو اسم الفرع المحلّيّ]"
---

# نشر فطين

`main` على الريموت `f6een` ينشر حيّاً على f6een.com عبر Railway. لا دفع إلى `main` مباشرة أبداً، ولا إلى `origin` (اسمه القديم `sahsahli-old`، تاريخٌ آخر).

ما يُنشر: $ARGUMENTS — وإن كان فارغاً فهو آخر ما اعتمده علي في المحادثة. إن التبس أيّ commit أو ملفّ يدخل، اسأل قبل الخطوة ١.

## ١. فرعٌ نظيف من f6een/main

```bash
git fetch -q f6een
git checkout -b <اسم-يصف-التعديل> f6een/main
```

ثمّ أدخِل التعديل وحده: `git cherry-pick <sha>…` لـcommits الفرع المحلّيّ، أو `git checkout <فرع> -- <ملفّات>` حين يحمل الفرع المحلّيّ شيئاً آخر.

**افحص الفرق قبل أيّ شيء:**

```bash
git diff --stat f6een/main
```

كلّ ملفٍّ في القائمة يجب أن يكون من هذا التعديل. ملفٌّ لا تعرفه = نسخةٌ قديمة ركبت الفرع (حدث في #335: فرع الافتتاحيّة حمل `IntroLanding.tsx` أقدم من المنشور). لا تكمل حتى يخلو منه.

لا تُدخل أبداً: ملفّات `dev-*.html` و`dev-*.json` و`tmp/` و`reports/` (معايناتٌ محلّيّة)، ولا تعديل DEV في `categoryArt.ts` مع `dev-old-art.json`.

## ٢. الفحوصات (CLAUDE.md)

```bash
npm run lint
npm run format      # الـCSS خارج Prettier عمداً
npm test            # إلزاميّ إن مسّ src/game/
npm run build
```

إن غيّر `format` ملفّاً فأدخله في الـcommit. أيّ فشلٍ يوقف النشر — أصلحه أو أخبر علي، ولا تتجاوزه.

## ٣. الهجرات

إن كان في الفرق `supabase/migrations/`: علي يطبّقها بيده (`npm run db:push`، والإعداد على جهازه). إن كانت الشيفرة تعتمد عليها فالهجرة **قبل** الدمج — توقّف واطلبها منه، ولا تدمج قبل أن يقول إنّها طُبّقت.

## ٤. الحزمة الحاليّة، ثمّ PR ودمج

احفظ اسم الحزمة الحيّة قبل الدمج:

```bash
curl -s https://f6een.com | grep -o 'assets/main-[A-Za-z0-9_-]*\.js' | head -1
```

ثمّ:

```bash
git commit   # رسالةٌ عربيّة تصف التعديل، وسطر Co-Authored-By في آخرها
git push f6een <الفرع>
gh pr create --head <الفرع> --base main --title "…" --body "…"
gh pr merge <الفرع> --merge --delete-branch
```

جسم الـPR بالعربيّة: ما تغيّر، وما قيس، ونتيجة الفحوصات، وما بقي عمداً. والدمج فوريّ بلا انتظار (قرار علي ١٩ سبتمبر ٢٠٢٦) — الـPR للتاريخ لا للمراجعة.

## ٥. القياس الحيّ

```bash
git checkout main && git pull -q f6een main
```

ثمّ راقب اسم الحزمة كلّ 20 ثانية حتى يتغيّر (عادةً 2–3 دقائق، وحدٌّ أقصى 10):

```bash
curl -s https://f6een.com | grep -o 'assets/main-[A-Za-z0-9_-]*\.js' | head -1
```

حين يتغيّر، **أثبت أنّ التعديل نفسه فيه**: ابحث عن نصٍّ مميّز منه (اسم class جديد، لونٌ، نصٌّ عربيّ). وقد لا يكون في `main-*.js`: الوحدات المنفصلة كـ`categoryArt-*.js` حزمٌ مستقلّة، والحزمة الرئيسة تذكرها بأسمائها وحدها بلا `assets/` — فاستخرجها هكذا وابحث فيها:

```bash
B=$(curl -s https://f6een.com | grep -o 'assets/main-[A-Za-z0-9_-]*\.js' | head -1)
for c in $B $(curl -s "https://f6een.com/$B" | grep -oE '[A-Za-z0-9_]+-[A-Za-z0-9_-]{8}\.js' | sort -u | sed 's#^#assets/#'); do
  curl -s "https://f6een.com/$c" | grep -q '<نصٌّ مميّز>' && echo "$c"
done
```

وانتبه: الـCSS المحقون نصّاً (`?inline`) يُصغَّر داخل الـJS، فابحث عن اسم class لا عن قاعدةٍ بمسافاتها.

لا تقس بمسار صورة مثل `assets/pics/x.jpg`: الصور المشحونة تُخدَم مجزَّأة فهو 404 دائماً.

**إن لم يتغيّر الاسم بعد 5 دقائق:** `gh api repos/aalmashjari-stack/f6een/deployments --jq '.[0].sha'`. إن لم يحمل sha الدمج فـRailway فوّته — اطلب من علي: الخدمة ← ⌘K ← **Deploy Latest Commit** (لا Redeploy: يعيد بناء النشر السابق).

## ٦. التقرير

بالعربيّة، قصيراً: رابط الـPR، وأنّ الحزمة الجديدة تحمل التعديل (أو ما لم يُقَس)، وما بقي.

والتطبيق المثبّت على الآيفون **لا يتحدّث بالنشر** — هو حزمةٌ داخل التطبيق. قل ذلك، واعرض التثبيت إن كان التعديل يظهر في التطبيق.
