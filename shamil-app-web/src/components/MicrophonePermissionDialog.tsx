import React from 'react';
import { Settings, X } from 'lucide-react';

interface MicrophonePermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const MicrophonePermissionDialog: React.FC<MicrophonePermissionDialogProps> = ({
  isOpen,
  onClose,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-95 animate-in fade-in-90 zoom-in-90">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">الوصول إلى الميكروفون</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="إغلاق"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          
          <p className="text-gray-600 text-center mb-4">
            تم رفض إذن استخدام الميكروفون. لاستخدام ميزة تسجيل الرسائل الصوتية، يرجى السماح بالوصول إلى الميكروفون.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">كيفية تفعيل الميكروفون:</h4>
            <ol className="text-blue-700 text-sm list-decimal list-inside space-y-1">
              <li>انقر على زر "إعدادات الميكروفون" أدناه</li>
              <li>ابحث عن إعدادات الموقع أو الصلاحيات</li>
              <li>قم بتغيير إذن الميكروفون إلى "السماح"</li>
              <li>عد إلى التطبيق وحاول مرة أخرى</li>
            </ol>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOpenSettings}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Settings size={18} />
            إعدادات الميكروفون
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
