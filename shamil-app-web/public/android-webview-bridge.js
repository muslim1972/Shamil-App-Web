// واجهة اتصال بين JavaScript و Android للتعامل مع أذونات الميكروفون

class AndroidWebViewBridge {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.isWebView = /(wv|WebView|Android.*Version\/[0-9][0-9]*\.\S+|Version\/\d+\.\d+\s+Chrome\/\d+\.\d+\.\d+\.\d+\s+Mobile\s+Safari\/\d+\.\d+)/i.test(navigator.userAgent);
  }

  // طلب إذن الميكروفون من Android
  async requestMicrophonePermission() {
    return new Promise((resolve, reject) => {
      if (!this.isAndroid || !this.isWebView) {
        // إذا لم يكن الجهاز Android أو WebView، استخدم الطريقة العادية
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            resolve(true);
          })
          .catch(err => {
            reject(err);
          });
        return;
      }

      // التحقق من وجود واجهة Android
      if (window.AndroidInterface && window.AndroidInterface.requestMicrophonePermission) {
        // استخدام واجهة Android المخصصة
        window.AndroidInterface.requestMicrophonePermission((granted) => {
          if (granted) {
            resolve(true);
          } else {
            reject(new Error('تم رفض الإذن من قبل المستخدم'));
          }
        });
      } else {
        // إذا لم تكن الواجهة متاحة، حاول الطريقة العادية
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            resolve(true);
          })
          .catch(err => {
            reject(err);
          });
      }
    });
  }

  // فتح إعدادات التطبيق في Android
  openAppSettings() {
    if (this.isAndroid && this.isWebView && window.AndroidInterface && window.AndroidInterface.openAppSettings) {
      window.AndroidInterface.openAppSettings();
    } else {
      alert('يرجى الذهاب إلى إعدادات التطبيق يدويًا والسماح بالوصول إلى الميكروفون');
    }
  }
}

// إنشاء نسخة عامة من الواجهة
window.AndroidWebViewBridge = new AndroidWebViewBridge();

// تصدير الواجهة للاستخدام في الوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AndroidWebViewBridge;
}
