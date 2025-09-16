import React from 'react';
import { LogOut, MessageSquarePlus, Archive, QrCode } from 'lucide-react';
import SearchDialog from '../SearchDialog';

interface ConversationHeaderProps {
  onCreateNewConversation: () => void;
  onNavigateToArchived: () => void;
  onLogout: () => void;
  onGenerateQR: () => void;
  onOpenCamera: () => void;
  onCreateConversation: (userId: string) => void;
  showQRMenu: boolean;
  setShowQRMenu: (show: boolean) => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  onCreateNewConversation,
  onNavigateToArchived,
  onLogout,
  onGenerateQR,
  onOpenCamera,
  onCreateConversation,
  showQRMenu,
  setShowQRMenu
}) => {

  return (
    <header className="bg-slate-50 dark:bg-slate-900/70 backdrop-blur-lg p-4 shadow-sm border-b border-slate-200 dark:border-slate-700 z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-50">المحادثات</h1>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button onClick={onCreateNewConversation} aria-label="محادثة جديدة">
            <MessageSquarePlus size={20} />
          </button>
          <button onClick={onNavigateToArchived} aria-label="المحادثات المؤرشفة">
            <Archive size={20} />
          </button>
          <button onClick={onLogout} aria-label="تسجيل الخروج">
            <LogOut size={20} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="relative flex-1">
          <SearchDialog
            onOpenConversation={onCreateConversation}
            onGenerateQR={onGenerateQR}
            onOpenCamera={onOpenCamera}
          />
        </div>
        <div className="relative">
          <button
            className="ml-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            aria-label="بحث عن مستخدم"
            onClick={() => setShowQRMenu(!showQRMenu)}
          >
            <QrCode size={20} />
          </button>
          {showQRMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-indigo-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
                <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">خيارات QR</div>
              </div>
              <button
                className="w-full text-right p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                onClick={onGenerateQR}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center ml-3">
                    <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-800 dark:text-slate-100">من الاستوديو</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">إنشاء رمز QR من صورة</div>
                  </div>
                </div>
              </button>
              <button
                className="w-full text-right p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
                onClick={onOpenCamera}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center ml-3">
                    <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-800 dark:text-slate-100">باستخدام الكاميرا</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">فتح الكاميرا لمسح QR</div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
