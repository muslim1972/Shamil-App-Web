import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Pin, Forward, Home, MessageSquare, Settings, User, Archive, X } from 'lucide-react';
import { useGlobalUIStore } from '@/stores/useGlobalUIStore'; // Using alias path
import { useNavigate } from 'react-router-dom';

export const AppFooter: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeScreen,
    selectionMode,
    selectedItems,
    clearSelection,
    setActiveScreen,
    triggerAction,
  } = useGlobalUIStore();

  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDeleteMenu && deleteButtonRef.current && !deleteButtonRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteMenu]);

  const selectedCount = selectedItems.length;

  // If in conversations selection mode
  if (selectionMode === 'conversations') {
    return (
      <div className="bg-white border-t border-gray-200 p-2 flex justify-between items-center min-h-[50px]">
        <div className="text-sm font-medium text-gray-700">{selectedCount} محادثة محددة</div>
        <div className="flex space-x-2">
          <button
            onClick={() => triggerAction('deleteConversation')}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => triggerAction('archiveConversation')}
            disabled={selectedCount === 0} // Assuming canArchive is true if items are selected
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive size={16} />
          </button>
          <button
            onClick={clearSelection}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // If in messages selection mode
  if (selectionMode === 'messages') {
    // Assuming canPin and canDeleteForAll logic will be handled by the screen that sets selectedItems
    // For now, we'll just enable them if items are selected.
    const canPin = selectedCount === 1; // Only one message can be pinned
    const canDeleteForAll = true; // This logic needs to be moved to ChatScreen

    return (
      <div className="bg-white border-t border-gray-200 p-2 flex justify-between items-center min-h-[50px]">
        <div className="text-sm font-medium text-gray-700">{selectedCount} رسالة محددة</div>
        <div className="flex space-x-2">
          <>
            <button
              ref={deleteButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteMenu(!showDeleteMenu);
              }}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <Trash2 size={16} />
            </button>

            {showDeleteMenu && (
              <div className="absolute bottom-14 mb-1 right-4 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteMenu(false);
                    triggerAction('deleteForMe');
                  }}
                  className="block w-full text-right px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  الحذف لدي
                </button>
                {canDeleteForAll && ( // This condition should come from ChatScreen
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteMenu(false);
                      triggerAction('deleteForAll');
                    }}
                    className="block w-full text-right px-3 py-1 text-sm text-red-600 hover:bg-gray-100"
                  >
                    الحذف لدى الجميع
                  </button>
                )}
              </div>
            )}
          </>
          <button
            onClick={() => triggerAction('pin')}
            disabled={!canPin}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pin size={16} />
          </button>
          <button onClick={() => triggerAction('forward')} className="p-1 rounded-full hover:bg-gray-100 text-gray-600">
            <Forward size={16} />
          </button>
          <button
            onClick={clearSelection}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Default footer with navigation
  return (
    <div className="bg-white border-t border-gray-200 p-2 flex justify-around items-center min-h-[50px]">
      <button
        onClick={() => { setActiveScreen('conversations'); navigate('/conversations'); }}
        className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'conversations' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <Home size={20} />
        <span className="text-xs mt-1">المحادثات</span>
      </button>
      <button
        onClick={() => { setActiveScreen('chat'); navigate('/chat/some-default-id'); }} // TODO: Handle default chat ID or navigate to a new chat screen
        className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'chat' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <MessageSquare size={20} />
        <span className="text-xs mt-1">الرسائل</span>
      </button>
      <button
        onClick={() => { setActiveScreen('profile'); navigate('/profile'); }} // TODO: Create profile route
        className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'profile' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <User size={20} />
        <span className="text-xs mt-1">الملف الشخصي</span>
      </button>
      <button
        onClick={() => { setActiveScreen('settings'); navigate('/settings'); }} // TODO: Create settings route
        className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'settings' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <Settings size={20} />
        <span className="text-xs mt-1">الإعدادات</span>
      </button>
    </div>
  );
};

AppFooter.displayName = 'AppFooter';
