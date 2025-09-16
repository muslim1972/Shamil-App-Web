import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Archive, Lock, Trash2, Ban } from 'lucide-react';
import type { Conversation } from '../../types';

interface ConversationContextMenuProps {
  menu: { x: number; y: number; conversation: Conversation } | null;
  onArchiveConversation: () => void;
  onDeleteConversationForAll: () => void;
  onCloseMenu: () => void;
}

export const ConversationContextMenu: React.FC<ConversationContextMenuProps> = ({
  menu,
  onArchiveConversation,
  onDeleteConversationForAll,
  onCloseMenu
}) => {
  return (
    <>
      <Transition as={Fragment} show={!!menu}>
        <div 
          className="fixed inset-0 z-20" 
          onClick={onCloseMenu}
        />
      </Transition>
      <Transition as={Fragment} show={!!menu}>
        <Menu as="div" className="fixed z-30" style={{ top: menu?.y, left: menu?.x }}>
          <Menu.Items static className="origin-top-left mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={() => { 
                      onArchiveConversation(); 
                      onCloseMenu(); 
                    }} 
                    className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}
                  >
                    <Archive className="mr-3 h-5 w-5" />
                    أرشفة المحادثة
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={onCloseMenu} 
                    className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}
                  >
                    <Lock className="mr-3 h-5 w-5" />
                    إخفاء المحادثة
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={() => { 
                      onDeleteConversationForAll(); 
                      onCloseMenu(); 
                    }} 
                    className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}
                  >
                    <Trash2 className="mr-3 h-5 w-5" />
                    حذف المحادثة لدى الجميع
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={onCloseMenu} 
                    className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}
                  >
                    <Ban className="mr-3 h-5 w-5" />
                    حظر المستخدم
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </Transition>
    </>
  );
};
