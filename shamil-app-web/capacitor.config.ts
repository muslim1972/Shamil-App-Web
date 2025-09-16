import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shamil.app',
  appName: 'SHAMIL App',
  webDir: 'dist',
  bundledWebRuntime: true, // تغيير إلى true لتحسين الأداء
  server: {
    // في بيئة التطوير، استخدم الخادم المحلي
    // في بيئة الإنتاج، سيتم تجاهل هذا الإعداد
    // تم حذف url للسماح بالاتصال المباشر بالملفات المبنية
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    // إضافة هذه الخاصية للتحكم في سلوك لوحة المفاتيح
    softInputMode: 'adjustResize'
  }
};

export default config;
