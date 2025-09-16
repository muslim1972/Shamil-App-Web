import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook لتحسين أداء المكونات
 */
export const usePerformanceOptimization = () => {
  // لتتبع أداء المكون
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // كشف إذا كان الجهاز ضعيف الأداء
  useEffect(() => {
    // كشف أداء الجهاز بناءً على عدد النوى والذاكرة
    const isLowEnd = 
      // عدد النوى أقل من 4
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
      // ذاكرة الجهاز أقل من 4 جيجابايت (تقدير)
      // ملاحظة: هذه الطريقة غير دقيقة 100% ولكنها تعطي تقديراً جيداً
      ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4);

    setIsLowEndDevice(isLowEnd);
  }, []);

  // تتبع عدد مرات التصيير
  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    if (lastRenderTime.current) {
      const renderTime = now - lastRenderTime.current;
      // إذا كان وقت التصيير طويلاً، يمكن اتخاذ إجراءات لتحسين الأداء
      if (renderTime > 16) { // 60fps = 16.67ms لكل إطار
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
      }
    }
    lastRenderTime.current = now;
  });

  // دالة لتحسين الأداء بناءً على قدرات الجهاز
  const getOptimizedValue = useCallback(<T,>(
    highEndValue: T,
    lowEndValue: T,
    mediumEndValue?: T
  ): T => {
    if (isLowEndDevice) {
      return lowEndValue;
    } else if (mediumEndValue && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 8) {
      return mediumEndValue;
    }
    return highEndValue;
  }, [isLowEndDevice]);

  // دالة لتحسين الرسوم المتحركة بناءً على قدرات الجهاز
  const shouldUseAnimation = useCallback((): boolean => {
    // تعطيل الرسوم المتحركة على الأجهزة الضعيفة
    if (isLowEndDevice) {
      return false;
    }

    // التحقق من تفضيلات المستخدم للرسوم المتحركة المخفضة
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !prefersReducedMotion;
  }, [isLowEndDevice]);

  // دالة لتحسين عدد العناصر المعروضة
  const getOptimizedItemCount = useCallback((
    highEndCount: number,
    lowEndCount: number,
    mediumEndCount?: number
  ): number => {
    return getOptimizedValue(highEndCount, lowEndCount, mediumEndCount);
  }, [getOptimizedValue]);

  // دالة للتحقق من اتصال الشبكة
  const isSlowConnection = useCallback((): boolean => {
    // التحقق من نوع الاتصال
    const connection = (navigator as any).connection;
    if (connection) {
      // إذا كان الاتصال بطيئاً أو محدود البيانات
      if (
        connection.saveData || 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g'
      ) {
        return true;
      }
    }
    return false;
  }, []);

  // دالة لتحميل الصور بشكل محسن
  const optimizedImageLoad = useCallback((src: string, lowQualitySrc?: string): string => {
    if (isSlowConnection() && lowQualitySrc) {
      return lowQualitySrc;
    }
    return src;
  }, [isSlowConnection]);

  // دالة لتأخير تحميل المكونات غير الضرورية
  const useDeferredLoading = useCallback((): boolean => {
    // تأخير تحميل المكونات غير الضرورية على الأجهزة الضعيفة أو الاتصالات البطيئة
    return isLowEndDevice || isSlowConnection();
  }, [isLowEndDevice, isSlowConnection]);

  return {
    renderCount: renderCount.current,
    isLowEndDevice,
    getOptimizedValue,
    shouldUseAnimation,
    getOptimizedItemCount,
    isSlowConnection: isSlowConnection(),
    optimizedImageLoad,
    useDeferredLoading
  };
};

/**
 * Hook لتحسين أداء القوائم الطويلة
 */
export const useVirtualList = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  // حساب العناصر المرئية
  const { visibleItems, startIndex } = (() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);

    return { visibleItems, startIndex };
  })();

  // حساب الإزاحة والارتفاع الإجمالي
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    containerProps: {
      onScroll: (e: React.UIEvent<HTMLDivElement>) => 
        setScrollTop(e.currentTarget.scrollTop),
      style: { height: `${containerHeight}px`, overflow: 'auto' }
    },
    innerProps: {
      style: { 
        height: `${totalHeight}px`, 
        position: 'relative' as const 
      }
    },
    itemsProps: {
      style: { 
        position: 'absolute' as const, 
        top: 0, 
        width: '100%',
        transform: `translateY(${offsetY}px)`
      }
    }
  };
};

/**
 * Hook لتحسين الأداء باستخدام Debouncing
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

/**
 * Hook لتحسين الأداء باستخدام Throttling
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]) as T;
};
