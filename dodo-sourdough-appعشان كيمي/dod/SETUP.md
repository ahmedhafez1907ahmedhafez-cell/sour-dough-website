# دليل التشغيل — دودو ساوردو (Admin + Orders System)

## 1. إنشاء مشروع Firebase (مجاني)
1. روح https://console.firebase.google.com → "Add project" → سمّيه `dodo-sourdough`
2. من القائمة الجانبية: **Build > Firestore Database** → Create database → اختار وضع "Production mode"
3. **Build > Authentication** → Get started → فعّل "Email/Password"
4. ~~Storage~~ — مش محتاجينه. Firebase Storage بقى من أكتوبر 2024 بيطلب خطة
   الدفع (Blaze) حتى لو مش هتستخدم فلوس فعلياً، فمشيناها خالص من المشروع.
   صور المنتجات دلوقتي بتتحط كرابط (URL) في فورم إضافة المنتج، مش رفع ملف.
   أسهل طريقتين مجانيتين للحصول على رابط صورة:
   - ارفع الصورة في مجلد `public/` في الريبو على GitHub بنفس اسم الملف،
     وبعد النشر حط في فورم المنتج `/اسم-الملف.jpg`
   - أو ارفعها مجاناً وبسرعة على https://imgbb.com (من غير حتى تعمل حساب)
     وهياخدلك رابط مباشر (Direct link) تلصقه في الفورم

## 2. مفاتيح الـ Client (آمنة تتحط في الكود مباشرة)
Project Settings (⚙️) > General > "Your apps" > Web app (</>) > سجّل تطبيق جديد
هيديك object فيه apiKey, authDomain... انسخهم في `.env.local` (أو Vercel) تحت الأسماء اللي في `.env.example`.

## 3. مفتاح الـ Admin SDK (سرّي — سيرفر بس)
Project Settings > Service Accounts > "Generate new private key" → هينزلك ملف JSON.
منه خد:
- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (خليه بين علامتي تنصيص زي ما هو، بالـ `\n` جواه)

⚠️ الملف ده متحطوش في git أبداً.

## 4. عمل حساب الأدمن بتاعك
1. Authentication > Users > Add user → حط إيميلك وباسورد قوي
2. انسخ الـ **User UID** بتاعه من نفس الصفحة
3. روح Firestore Database > Start collection → اسمها `admins`
4. Document ID = الـ UID اللي نسخته → سيب المحتوى فاضي أو حط `{ role: "admin" }` — خلاص كده هو أدمن

كرر الخطوة دي لأي حد تاني عايزه يبقى أدمن.

## 5. رفع قواعد الأمان (Firestore Rules)
لو معاك Firebase CLI:
```
npm install -g firebase-tools
firebase login
firebase init firestore   # اختار نفس المشروع
firebase deploy --only firestore:rules
```
لو مش عايز تنزل حاجة، تقدر تنسخ محتوى `firestore.rules` وتلزقه يدوي في:
Firestore Database > Rules (في الكونسول) واضغط Publish.

## 6. البريد الإلكتروني عند وصول أوردر (Resend)
1. اعمل حساب على https://resend.com (مجاني لحد 3000 إيميل/شهر)
2. خد الـ API Key وحطه في `RESEND_API_KEY`
3. `ADMIN_NOTIFY_EMAIL` = إيميلك اللي عايز تستقبل عليه التنبيهات
4. للتجربة السريعة قبل ما توثّق دومين، سيب `ORDER_FROM_EMAIL=orders@resend.dev`

## 7. J&T Express (لما يكون عندك API access فعلاً)
كلم فريق J&T Express مصر واطلب منهم بالظبط: **"Open API access / Merchant integration"**
(مش نفس حساب التطبيق اللي بتستخدمه دلوقتي). هيديوك sandbox الأول.
لما تجيبهم:
- حط القيم في `JT_API_BASE_URL`, `JT_MERCHANT_USERNAME`, `JT_API_KEY`, `JT_SECRET_KEY`
- غيّر `JT_ENABLED=true`
- افتح `lib/jtExpress.js` وعدّل شكل الـ payload/response بالظبط حسب التوثيق اللي هيديوهولك
  (كل نسخة بلد شوية مختلفة عن التانية، اللي كتبته هو الشكل العام المتكرر بس)

## 8. التشغيل محلياً
```
npm install
cp .env.example .env.local   # واملى القيم
npm run dev
```
افتح http://localhost:3000 للموقع، و http://localhost:3000/admin/login للوحة التحكم.

## 9. النشر على Vercel
1. ادفع الفولدر ده لـ GitHub repo
2. من Vercel: Import Project → اختار الـ repo
3. Settings > Environment Variables → حط كل المتغيرات اللي في `.env.example` (بنفس الأسماء بالظبط)
4. Deploy

## اللي لسه محتاج يتعمل (خطوة تانية)
الملفات دي هيكل شغال (سلة → أوردر يتحفظ في قاعدة البيانات → لوحة تحكم فيها الطلبات
وإضافة منتجات، مفيش واتساب خالص). التصميم الكامل بتاع الموقع القديم (الهيرو،
الأنيميشن، صفحات المراجعات والجاليري...) لسه محتاج ينقل هنا فوق الأساس ده —
قوللي لما تخلص الإعداد وهنكمل نقل التصميم.

## 10. صفحة "المحتوى" (منشورات السوشيال ميديا)
مفيش أي مفتاح أو حساب مطلوب لتشغيلها — بتستخدم كود الـ Embed الرسمي المجاني
من كل منصة (انستجرام/تيك توك/فيسبوك/يوتيوب)، وده بيعرض المنشور الحقيقي
بلايكاته وكومنتاته الحقيقية، ولايك/كومنت الزائر بيروح للمنصة الأصلية.

**إزاي تستخدمها:** كل ما تنشر بوست/ريل/فيديو، روح `/admin/content`، اختار
المنصة، الصق رابط المنشور، احفظ. هيظهر فوراً في `/content` على الموقع.

**ملحوظة مهمة:** ده *مش* مزامنة أوتوماتيكية — يعني لازم تضيف كل منشور
يدوياً بعد ما تنشره (بياخد ٥ ثواني بس). مزامنة أوتوماتيكية حقيقية (يظهر
لوحده من غير ما تلمس حاجة) ممكنة بس لكل منصة على حدة وبمجهود مختلف:
- **يوتيوب**: أسهل حاجة، مجرد مفتاح API مجاني من Google Cloud Console
  (دقايق معدودة، مفيش موافقة أو مراجعة مطلوبة)
- **انستجرام/فيسبوك**: محتاج حساب Meta for Developers + مراجعة من فيسبوك
  للصلاحيات (ممكن تاخد أسابيع)
- **تيك توك**: محتاج حساب TikTok for Developers ومراجعة برضو، وأصعب واحدة
  فيهم عادة

لو حبيت نعمل يوتيوب أوتوماتيك كخطوة تانية، قولّي وهنعملها — سهلة وسريعة.
