import React, { useEffect, useState } from 'react';
import { AppFooter } from '../common/AppFooter';
import { useLocation } from 'react-router-dom';
import { useGlobalUIStore } from '@/stores/useGlobalUIStore'; // Using alias path

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const setActiveScreen = useGlobalUIStore((state) => state.setActiveScreen);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [initialViewportHeight, setInitialViewportHeight] = useState(0);

  useEffect(() => {
    // Set active screen based on current path
    if (location.pathname.startsWith('/chat')) {
      setActiveScreen('chat');
    } else if (location.pathname.startsWith('/conversations') || location.pathname === '/') {
      setActiveScreen('conversations');
    } else if (location.pathname.startsWith('/profile')) {
      setActiveScreen('profile');
    } else if (location.pathname.startsWith('/settings')) {
      setActiveScreen('settings');
    } else if (location.pathname.startsWith('/archived')) { // Added for archived screen
      setActiveScreen('conversations'); // Treat archived as part of conversations for footer active state
    }
    else {
      setActiveScreen('conversations'); // Default
    }
  }, [location.pathname, setActiveScreen]);

  // التعامل مع ظهور وإخفاء لوحة المفاتيح
  useEffect(() => {
    // حفظ الارتفاع الأصلي للشاشة
    setInitialViewportHeight(window.visualViewport?.height || window.innerHeight);
    
    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // إذا كان الفرق في الارتفاع كبيرًا (أكثر من 100 بكسل)، نعتبر أن لوحة المفاتيح ظاهرة
      setIsKeyboardVisible(heightDifference > 100);
    };
    
    // استخدام visualViewport API للتعامل مع تغيير حجم الشاشة بدقة
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      // كر بديل للمتصفحات التي لا تدعم visualViewport
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [initialViewportHeight]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      {/* إخفاء الفوتر عند ظهور لوحة المفاتيح */}
      {!isKeyboardVisible && <AppFooter />}
    </div>
  );
};