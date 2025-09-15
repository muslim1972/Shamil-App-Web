import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, QrCode, Camera, Image, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSearchStore } from '@/stores/searchStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface SearchDialogProps {
  onOpenConversation: (userId: string) => void;
  onGenerateQR: () => void;
  onOpenCamera: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  onOpenConversation,
  onGenerateQR,
  onOpenCamera
}) => {
  const [searchText, setSearchText] = useState('');
  const [showQRMenu, setShowQRMenu] = useState(false);
  const { addToSearchHistory } = useSearchStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qrMenuRef = useRef<HTMLDivElement>(null);

  // البحث عن المستخدمين في قاعدة البيانات
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users', searchText],
    queryFn: async () => {
      if (!searchText.trim()) return [];

      // تحسين البحث ليعمل بشكل أفضل مع البداية وليس يحتوي فقط
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .or(`username.ilike.${searchText}%,email.ilike.${searchText}%`)
        .limit(10);

      if (error) {
        toast.error('حدث خطأ أثناء البحث');
        return [];
      }

      return data || [];
    },
    enabled: searchText.length > 0,
  });

  // إغلاق قائمة QR عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qrMenuRef.current && !qrMenuRef.current.contains(event.target as Node)) {
        setShowQRMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserSelect = (user: User) => {
    addToSearchHistory(user.username);
    onOpenConversation(user.id);
    setSearchText('');
    toast.success(`تم فتح محادثة مع ${user.username}`);
  };

  const handleQRMenuToggle = () => {
    setShowQRMenu(!showQRMenu);
  };

  const handleGenerateQR = () => {
    setShowQRMenu(false);
    onGenerateQR();
  };

  const handleOpenCamera = () => {
    setShowQRMenu(false);
    onOpenCamera();
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-500" />
        <Input
          ref={searchInputRef}
          placeholder="ابحث عن مستخدم بالاسم أو البريد الإلكتروني"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10 pr-12 py-3 text-right border-2 border-indigo-200 focus:border-indigo-500 rounded-lg shadow-sm transition-colors"
          dir="rtl"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleQRMenuToggle}
            className="h-8 w-8 text-indigo-600 hover:bg-indigo-100 rounded-full"
          >
            <QrCode className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* قائمة خيارات QR */}
      <AnimatePresence>
        {showQRMenu && (
          <motion.div
            ref={qrMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-indigo-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
              <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">خيارات QR</div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              onClick={handleGenerateQR}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center ml-3">
                  <Image className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-800 dark:text-slate-100">من الاستوديو</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">إنشاء رمز QR من صورة</div>
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
              onClick={handleOpenCamera}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center ml-3">
                  <Camera className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-800 dark:text-slate-100">باستخدام الكاميرا</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">فتح الكاميرا لمسح QR</div>
                </div>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* قائمة نتائج البحث */}
      <AnimatePresence>
        {searchText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-1 w-full bg-white dark:bg-slate-800 border border-indigo-200 rounded-lg shadow-xl z-40 max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-6 text-center flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                <div className="text-indigo-600 dark:text-indigo-400 font-medium">جاري البحث...</div>
              </div>
            ) : users && users.length > 0 ? (
              <>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
                  <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">نتائج البحث</div>
                </div>
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                    className="p-4 cursor-pointer border-b border-slate-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-10 h-10 rounded-full ml-3 border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ml-3 text-white font-bold shadow-md">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{user.username}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{user.email}</div>
                      </div>
                      <div className="text-indigo-500">
                        <MessageSquarePlus size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="text-slate-400 dark:text-slate-500 mb-2">
                  <Search size={32} className="mx-auto" />
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-medium">لا يوجد مستخدمين بهذا الاسم</div>
                <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">جرب كلمات مفتاحية أخرى</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchDialog;