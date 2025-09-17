ما تم تغييره لحل مشكلة تداخل الكيبورد في Android (Infinix Android 15)

ملخص التغييرات:
1) AndroidManifest.xml
   - تأكدنا أن تاغ الـ <activity> يحتوي على:
     android:windowSoftInputMode="adjustResize"

   (في repo لديك هذا السطر مُدرج بالفعل في android/app/src/main/AndroidManifest.xml)

2) MainActivity.java
   - أضفنا تعيينًا برمجيًا في onCreate:
       getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
   - أضفنا تعليقًا يذكر أن بعض أرقام OEM/fullscreen flags قد تمنع adjustResize، وفي حالة استمرار المشكلة نوصي مؤقتًا بإزالة FLAG_FULLSCREEN/IMMERSIVE في `decorView.setSystemUiVisibility(...)` للاختبار.

كيفية التجربة:
1) بعد تطبيق التغييرات اعمل build ونسخ إلى منصة Android (Capacitor):
   cd shamil-app-web
   npm run build
   npx cap copy android
   npx cap open android

2) في Android Studio: Build -> Clean Project ثم Run على جهاز Infinix

ملاحظة: إذا كنت تستخدم سيرفر dev أو LiveReload قد لا تنعكس التغييرات native إلا بعد عمل clean/build وإعادة تثبيت التطبيق.

إذا رغبت أستطيع تحضير patch جاهز للتطبيق في حال أردت مني تعديل أي ملف آخر أو تجهيز APK مباشرة.