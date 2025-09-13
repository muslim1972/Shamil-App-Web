// useLocation Hook
// This hook handles location sharing functionality

import { useCallback } from 'react';

interface UseLocationProps {
  sendMessage: (message: string) => Promise<void>;
}

export const useLocation = ({ sendMessage }: UseLocationProps) => {
  const handleSendLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('المتصفح الخاص بك لا يدعم خدمة تحديد الموقع.');
      return;
    }

    try {
      // طلب إذن الوصول إلى الموقع
      const permissions = await navigator.permissions.query({ name: 'geolocation' });

      if (permissions.state === 'denied') {
        alert('تم رفض إذن الوصول إلى الموقع. يرجى تفعيل خدمة الموقع من إعدادات المتصفح.');
        return;
      }

      // الحصول على الموقع الحالي
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // إنشاء رابط خرائط جوجل للموقع
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

      // إرسال الموقع كرسالة مع تنسيق خاص لعرض الخريطة
      const locationMessage = `📍 موقعي الحالي\n${latitude}, ${longitude}\n[عرض على الخريطة](${locationUrl})`;
      await sendMessage(locationMessage);

    } catch (error) {
      console.error('Error getting location:', error);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('تم رفض إذن الوصول إلى الموقع. يرجى تفعيل خدمة الموقع من إعدادات المتصفح.');
        } else if (error.name === 'PositionUnavailableError') {
          alert('لا يمكن الوصول إلى معلومات الموقع. يرجى التحقق من اتصال الإنترنت وإعدادات الموقع.');
        } else if (error.name === 'TimeoutError') {
          alert('انتهت مهلة الحصول على الموقع. يرجى المحاولة مرة أخرى.');
        } else {
          alert(`فشل الحصول على الموقع: ${error.message}`);
        }
      } else {
        alert('فشل الحصول على الموقع. يرجى المحاولة مرة أخرى.');
      }
    }
  }, [sendMessage]);

  return {
    handleSendLocation
  };
};
