import React, { useEffect } from 'react';
import { AppFooter } from '../common/AppFooter';
import { useLocation } from 'react-router-dom';
import { useGlobalUIStore } from '@/stores/useGlobalUIStore'; // Using alias path

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const setActiveScreen = useGlobalUIStore((state) => state.setActiveScreen);

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

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      <AppFooter />
    </div>
  );
};