import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface ConnectionStatusProps {
  onStatusChange: (isOnline: boolean) => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onStatusChange(true);
      toast.success('تم استعادة الاتصال بالإنترنت');
    };

    const handleOffline = () => {
      setIsOnline(false);
      onStatusChange(false);
      toast.error('فقدت الاتصال بالإنترنت');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  return isOnline ? null : (
    <div className="bg-red-500 text-white text-center py-1 text-sm">غير متصل بالإنترنت</div>
  );
};
