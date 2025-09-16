import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
  waveNumber: number;
}

export const WaterBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  // إنشاء تموج جديد في موقع عشوائي مع 4 موجات متعاقبة
  const createRandomRipple = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const x = Math.random() * container.clientWidth;
    const y = Math.random() * container.clientHeight;
    const size = 50 + Math.random() * 150; // حجم عشوائي بين 50 و 200

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
        }, 3000);
      }, i * 200); // كل موجة تظهر بعد 200 مللي ثانية من التي تسبقها
    }
  };

  // إنشاء تموجات بشكل دوري
  useEffect(() => {
    // إنشاء تموج أولي فوراً
    createRandomRipple();

    const interval = setInterval(() => {
      createRandomRipple();
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 overflow-hidden z-0"
        style={{ backgroundColor: 'rgba(45, 212, 191, 0.3)' }} // bg-teal-400 بدرجة فاتحة جداً
      >
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="water-ripple"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              animation: 'ripple 3s linear forwards',
              animationDelay: `${ripple.waveNumber * 0.2}s`,
              zIndex: 10 - ripple.waveNumber
            }}
          />
        ))}
      </div>

      <style>{`
        .water-ripple {
          position: absolute;
          border-radius: 50%;
          border: 3px solid rgba(94, 234, 212, 1);
          transform: scale(0);
          box-shadow: 0 0 12px rgba(94, 234, 212, 0.8);
        }

        @keyframes ripple {
          0% {
            transform: scale(0.2);
            opacity: 0.8;
            border-width: 3px;
          }
          100% {
            transform: scale(6);
            opacity: 0;
            border-width: 1px;
          }
        }
      `}</style>
    </>
  );
};
