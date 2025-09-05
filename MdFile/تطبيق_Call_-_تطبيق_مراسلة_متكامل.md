# تطبيق Call - تطبيق مراسلة متكامل

## الوصف
تطبيق مراسلة متكامل مثل واتساب يدعم:
- إرسال الرسائل النصية
- إرسال الصور
- إرسال الفيديو
- التسجيل بالاسم وكلمة المرور
- دعم اللغتين العربية والإنجليزية
- الرسائل في الوقت الفعلي

## التقنيات المستخدمة
- **Frontend**: React Native مع Expo
- **Backend**: Supabase (قاعدة بيانات، مصادقة، تخزين، الوقت الفعلي)
- **قاعدة البيانات**: PostgreSQL
- **التخزين**: Supabase Storage

## إعداد المشروع

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. تشغيل التطبيق للتطوير
```bash
npm start
```

### 3. بناء APK للأندرويد

#### الطريقة الأولى: باستخدام EAS Build
```bash
# تسجيل الدخول إلى Expo
npx expo login

# إعداد EAS
eas build:configure

# بناء APK
eas build --platform android --profile preview
```

#### الطريقة الثانية: باستخدام Expo CLI (محلياً)
```bash
# تثبيت Expo CLI
npm install -g @expo/cli

# بناء APK محلياً (يتطلب Android Studio)
npx expo run:android --variant release
```

#### الطريقة الثالثة: باستخدام React Native CLI
```bash
# تحويل إلى React Native عادي
npx expo eject

# بناء APK
cd android
./gradlew assembleRelease
```

## إعدادات Supabase

### معلومات الاتصال
- **Project URL**: https://xuigvkwnjnfgxxnuhnhr.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWd2a3duam5mZ3h4bnVobmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NTMwNjcsImV4cCI6MjA2NzMyOTA2N30.RTmIQFG0edxMAWK4FUHqlks9Nc9GcsMWZquYuFT4ayU

### الجداول المطلوبة
- `users`: معلومات المستخدمين
- `conversations`: المحادثات
- `conversation_members`: أعضاء المحادثات
- `messages`: الرسائل
- `message_reads`: حالة قراءة الرسائل

### Storage Bucket
- `call-files`: لتخزين الصور والفيديو

## الميزات المتاحة

### ✅ المكتملة
- تسجيل الدخول والتسجيل
- إنشاء المحادثات
- إرسال الرسائل النصية
- إرسال الصور
- الرسائل في الوقت الفعلي
- واجهة باللغة العربية

### 🔄 قيد التطوير
- إرسال الفيديو
- المجموعات
- الإشعارات
- البحث في الرسائل

## ملاحظات مهمة

1. **للحصول على APK جاهز للتثبيت**: استخدم EAS Build أو قم ببناء التطبيق محلياً
2. **للنشر على Google Play**: ستحتاج إلى حساب مطور وتوقيع التطبيق
3. **الأمان**: تم تطبيق Row Level Security على جميع الجداول
4. **الأداء**: التطبيق محسن للأجهزة المحمولة

## الدعم الفني
للمساعدة في بناء APK أو حل أي مشاكل، يرجى اتباع التعليمات أعلاه أو الاتصال بالدعم الفني.

