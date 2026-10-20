# دليل النشر — شركة البراء النعيمي العقارية

هذا المستند يشرح متغيرات البيئة المطلوبة، ولماذا أُزيلت بعض الأسرار من الكود،
وكيفية ترقية حساب إلى مدير.

---

## 1) المتغيرات المطلوبة

انسخ `.env.example` إلى `.env` ثم املأ القيم. **لا ترفع `.env` إلى Git.**

| المتغير | مطلوب؟ | الوظيفة |
|---|---|---|
| `GEMINI_API_KEY` | نعم | استدعاءات الذكاء الاصطناعي (تصميم ديكور، فيديو، استشارة) |
| `GOOGLE_MAPS_PLATFORM_KEY` | نعم | الخريطة وعرض 360° |
| `INTERNAL_API_TOKEN` | **نعم** | رمز الماكينة للاستدعاء على `/api/cron/*` |
| `ADMIN_API_TOKEN` | **نعم** | رمز المشغّل للوحة الإدارة |
| `STRIPE_SECRET_KEY` | عند الدفع | إنشاء نوايا الدفع |
| `VITE_STRIPE_PUBLISHABLE_KEY` | عند الدفع | مفتاح Stripe في المتصفح |
| `FIREBASE_SERVICE_EMAIL` / `FIREBASE_SERVICE_PASSWORD` | اختياري | التذكيرات الآلية عبر واتساب |

توليد رمز قوي:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> بدون `INTERNAL_API_TOKEN` أو `ADMIN_API_TOKEN` سيرفض الخادم كل النقاط المحمية
> (يرجع `503`) بدل تعريضها. هذا سلوك مقصود: الفشل مغلق.

---

## 2) لماذا تغيّر سلوك نقاط النهاية

### البروكسي `/api-proxy/*`

هذا البروكسي موجود لأن الوصول المباشر إلى واجهات Google محجوب في بعض الشبكات.
كان مفتوحاً لأي هدف على الإنترنت — أي أن أي شخص يجعله وسيطاً لطلباته
والفوترة عليه.

الآن يقبل **قائمة نطاقات محددة فقط** (نطاقات Firebase/Google) + حد لمعدل الطلبات.
طلب إلى أي مضيف آخر يُرفض بـ `403`.

### المصادقة

كانت كل النقاط التالية متاحة للجميع، وهذا يعني أن أي زائر يستطيع:

- إرسال رسائل واتساب باسم الشركة (`/api/whatsapp/send`).
- تشغيل التذكيرات المجدولة (`/api/cron/*`).
- إنشاء نوايا دفع بأي مبلغ (`/api/payment/create-intent`).
- رفع ملفات (`/api/upload-app`).
- استهلاك حصة Gemini.

أصبحت تتطلب رأس `Authorization: Bearer <token>`:

```bash
curl -X POST https://your-app.run.app/api/cron/reminders \
  -H "Authorization: Bearer $INTERNAL_API_TOKEN"
```

### الدفع

كان الخادم يأخذ `amount` من جسم الطلب، أي أن المهاجم يختار المبلغ. صار المبلغ
يُقرأ من سجل الموعد في قاعدة البيانات (أو `BOOKING_FEE_CENTS` كقيمة افتراضية).

### رفع الملفات

كان يُقبل أي ملف ويُخدَم كملف ثابت. صار:

- الفحص يتم على **محتوى** الملف (توقيع البايتات) لا على الاسم والامتداد.
- الامتداد يجب أن يطابق المحتوى الفعلي.
- الملفات التنفيذية والسكريبتات تُرفض.
- الملفات تُقدَّم كتنزيل (`Content-Disposition: attachment`) مع `nosniff`
  حتى لا تُنفَّذ في نطاق الموقع.
- الاسم يُولَّد من الخادم.

---

## 3) ترقية حساب إلى مدير

لم تعد القواعد تقارن ببريد إلكتروني مكتوب داخلها. المدير يُحدَّد عبر
`custom claim` موقّع:

```bash
# مرة واحدة: تسجيل دخول إلى Google
gcloud auth application-default login

# ترقية مستخدم
node scripts/set-admin-claim.mjs someone@example.com

# سحب الترقية
node scripts/set-admin-claim.mjs someone@example.com --revoke
```

أو يدوياً من Firebase Console: **Authentication > Users > (المستخدم) > Edit >
Custom Claims** وأضف:

```json
{ "admin": true }
```

> المستخدم يحتاج تسجيل خروج ثم دخول كي يحمل الرمز الجديد.

**مهم:** كان البريدان القديمان مُدرجَين كمديرين في القواعد، **وأيضاً داخل كود
الواجهة** — وهو ما كان ثغرة تصعيد صلاحيات: المتصفح كان يقرّر الدور بنفسه
ويكتبه في ملف المستخدم. لذلك:

1. صُفِّرت كل مقارنة بريد من `src/`، وصار الدور يُقرأ من الـ `admin` claim الموقّع.
2. البريدان الإداريان المعتمدان هما `omarha12ha@gmail.com` و`qasemkhaled2004@gmail.com`.
3. أدوارهم مثبّتة في `users/{uid}.role = 'admin'` على قاعدة البيانات
   `ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc`، وكل منهما يحمل الـ claim.
4. بقية الحسابات الستة التي كانت تحمل `role: 'admin'` رُقِّيت إلى `client`
   في 2026-09-28.
5. يجب **تغيير كلمة مرور** حساب خدمة Firebase وإنشاء حساب جديد، لأن كلمة المرور
   السابقة كانت مكتوبة نصياً في `server.ts`.

لإضافة أو تنزيل إداري، استعمل السكربت (يقبل عدة عناوين مفصولة بفواصل):

```bash
node scripts/promote-admin.cjs omarha12ha@gmail.com
node scripts/promote-admin.cjs qasemkhaled2004@gmail.com --demote "email1@gmail.com,email2@gmail.com"
```

---

## 4) التذكيرات الآلية (واتساب)

العامل الخلفي يتوقّف تلقائياً إذا لم تُعيّن بيانات حساب الخدمة.

الإنشاء:

1. Firebase Console > Authentication > Users > Add user — أنشئ المستخدم.
2. في Firestore أضف `users/{uid}` بالحقول:
   `uid`, `email`, `name`, `role: "admin"`, `createdAt`.
3. ضع البريد وكلمة المرور في `FIREBASE_SERVICE_EMAIL` / `FIREBASE_SERVICE_PASSWORD`.

> **غيّر كلمة المرور أولاً** إن كان الحساب القديم ما زال مستخدماً، فالنسخة
> السابقة من الكود كانت تحتويها كنص صريح.

---

## 5) جدولة التذكيرات

داخلياً يشغّل الخادم مهمة كل 5 دقائق ومهمة يومية 9:00 صباحاً. للاستدعاء من
خارجي (Cloud Scheduler مثلاً):

```
POST https://your-app.run.app/api/cron/appointments-reminders
Authorization: Bearer <INTERNAL_API_TOKEN>
```

---

## 6) الفحوصات

```bash
npm run lint   # tsc + eslint
npm test       # اختبارات الأمان
npm run build  # بناء الإنتاج
```

`npm test` يفحص أن القواعد لا تحتوي بريد مدير مكتوب، وأن المواعيد ليست عامة
القراءة، وأن العميل لا يستطيع ترقية نفسه إلى مدير، وأن أسرار الخادم في البيئة
وليس في الكود.
