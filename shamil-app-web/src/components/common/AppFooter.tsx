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
      // Only close the menu if the click is outside both the delete button and the menu itself
      if (showDeleteMenu && deleteButtonRef.current && 
          !deleteButtonRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.delete-menu')) {
        setShowDeleteMenu(false);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteMenu]);

  const selectedCount = selectedItems.length;

  const handleActionClick = (actionType: 'deleteConversation' | 'deleteConversationForAll' | 'archiveConversation' | 'deleteForMe' | 'deleteForAll' | 'pin' | 'forward') => {
    triggerAction(actionType);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-1 flex justify-around items-center min-h-[35px]">
      {selectionMode === 'none' ? (
        // Default navigation icons
        <>
          <button
            onClick={() => { setActiveScreen('conversations'); navigate('/conversations'); }}
            className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'conversations' ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <Home size={20} />
          </button>
          <button
            onClick={() => { setActiveScreen('chat'); navigate('/chat/some-default-id'); }} // TODO: Handle default chat ID or navigate to a new chat screen
            className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'chat' ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={() => { setActiveScreen('profile'); navigate('/profile'); }} // TODO: Create profile route
            className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'profile' ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <User size={20} />
          </button>
          <button
            onClick={() => { setActiveScreen('settings'); navigate('/settings'); }} // TODO: Create settings route
            className={`flex flex-col items-center p-1 rounded-lg ${activeScreen === 'settings' ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <Settings size={20} />
          </button>
        </>
      ) : (
        // Selection mode actions
        <div className="flex justify-around items-center w-full">
          <div className="text-sm font-medium text-gray-700">{selectedCount} محددة</div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteMenu(!showDeleteMenu);
              }}
              ref={deleteButtonRef}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <Trash2 size={20} />
            </button>
            {showDeleteMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 delete-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(selectionMode === 'conversations' ? 'deleteConversation' : 'deleteForMe');
                    setShowDeleteMenu(false);
                  }}
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {selectionMode === 'conversations' ? 'حذف المحادثة لدي' : 'حذف الرسالة لدي'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(selectionMode === 'conversations' ? 'deleteConversationForAll' : 'deleteForAll');
                    setShowDeleteMenu(false);
                  }}
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {selectionMode === 'conversations' ? 'حذف المحادثة لدى الجميع' : 'حذف الرسالة لدى الجميع'}
                </button>
              </div>
            )}
          </div>
          {selectionMode === 'conversations' && (
            <button
              onClick={() => handleActionClick('archiveConversation')}
              disabled={selectedCount === 0}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Archive size={20} />
            </button>
          )}
          {selectionMode === 'messages' && (
            <>
              <button
                onClick={() => handleActionClick('pin')}
                disabled={selectedCount !== 1}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pin size={20} />
              </button>
              <button
                onClick={() => handleActionClick('forward')}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <Forward size={20} />
              </button>
            </>
          )}
          <button
            onClick={clearSelection}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

AppFooter.displayName = 'AppFooter';
