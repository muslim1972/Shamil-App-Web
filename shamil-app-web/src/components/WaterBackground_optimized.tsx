import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
  waveNumber: number;
}

export const WaterBackgroundOptimized: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);
  const rafRef = useRef<number>(0);
  const lastRippleTime = useRef<number>(0);

  // إنشاء تموج جديد في موقع عشوائي مع 4 موجات متعاقبة
  const createRandomRipple = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const x = Math.random() * container.clientWidth;
    const y = Math.random() * container.clientHeight;
    const size = 50 + Math.random() * 100; // تقليل حجم التموجات

    // إنشاء 4 موجات متعاقبة
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const newRipple = {
          x,
          y,
          size,
          id: rippleId.current++,
          waveNumber: i
        };

        setRipples(prev => [...prev, newRipple]);

        // إزالة التموج بعد انتهاء الحركة
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 2000); // تقليل مدة التموج
      }, i * 300); // زيادة الفاصل بين الموجات لتقليل العبء
    }
  };

  // استخدام requestAnimationFrame بدلاً من setInterval
  const animate = (timestamp: number) => {
    if (timestamp - lastRippleTime.current > 1000) { // زيادة الفاصل بين التموجات
      createRandomRipple();
      lastRippleTime.current = timestamp;
    }
    rafRef.current = requestAnimationFrame(animate);
  };

  // إنشاء تموجات بشكل دوري
  useEffect(() => {
    // إنشاء تموج أولي فوراً
    createRandomRipple();
    lastRippleTime.current = performance.now();

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // تقليل عدد التموجات المعروضة في نفس الوقت
  const visibleRipples = ripples.slice(-12); // عرض آخر 12 تموج فقط

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden z-0"
        style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)' }} // تقليل شفافية الخلفية
      >
        {visibleRipples.map(ripple => (
          <div
            key={ripple.id}
            className="water-ripple"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              animation: 'ripple 2s linear forwards', // تقليل مدة الرسوم المتحركة
              animationDelay: `${ripple.waveNumber * 0.3}s`,
              zIndex: 10 - ripple.waveNumber,
              willChange: 'transform, opacity' // تحسين الأداء
            }}
          />
        ))}
      </div>

      <style>{`
        .water-ripple {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(94, 234, 212, 0.8); // تقليل سماكة الحدود والشفافية
          transform: scale(0);
          box-shadow: none; // إزالة الظل الذي يستهلك موارد كبيرة
        }

        @keyframes ripple {
          0% {
            transform: scale(0.2);
            opacity: 0.6;
            border-width: 2px;
          }
          100% {
            transform: scale(4); // تقليل حجم التموج النهائي
            opacity: 0;
            border-width: 1px;
          }
        }
      `}</style>
    </>
  );
};
