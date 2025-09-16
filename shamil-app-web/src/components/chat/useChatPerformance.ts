import { useCallback, useMemo } from 'react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

/**
 * Hook مخصص لتحسين أداء شاشة الدردشة
 */
export const useChatPerformance = () => {
  const { 
    shouldUseAnimation, 
    isLowEndDevice, 
    useDeferredLoading 
  } = usePerformanceOptimization();

  // تحديد ما إذا كان يجب عرض الخلفية المتحركة بناءً على أداء الجهاز
  const shouldShowAnimatedBackground = useMemo(
    () => shouldUseAnimation() && !useDeferredLoading(),
    [shouldUseAnimation, useDeferredLoading]
  );

  // معالج محسن لفتح/إغلاق قائمة المرفقات
  const handleToggleAttachmentMenu = useCallback(
    (setAttachmentMenuOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
      setAttachmentMenuOpen(prev => !prev);
    },
    []
  );

  // تحسين اسم المحادثة لمنع إعادة التصيير غير الضرورية
  const getOptimizedConversationName = useCallback(
    (conversationDetails?: { name?: string }) => {
      return conversationDetails?.name || 'محادثة';
    },
    []
  );

  return {
    shouldShowAnimatedBackground,
    handleToggleAttachmentMenu,
    getOptimizedConversationName,
    isLowEndDevice
  };
};
