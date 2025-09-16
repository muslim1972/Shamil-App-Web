import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Pin, Trash2, CheckSquare } from 'lucide-react';
import type { Message } from '../../types';

interface MessageContextMenuProps {
  messageMenu: { x: number; y: number; message: Message } | null;
  onClose: () => void;
  onSelectMessage: (messageId: string) => void;
  currentUserId?: string;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  messageMenu,
  onClose,
  onSelectMessage,
  currentUserId
}) => {
  if (!messageMenu) return null;

  return (
    <>
      <Transition as={Fragment} show={!!messageMenu}>
        <div className="fixed inset-0 z-20" onClick={onClose} />
      </Transition>
      <Transition
        as={Fragment}
        show={!!messageMenu}
        enter="transition ease-out duration-100" 
        enterFrom="transform opacity-0 scale-95" 
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75" 
        leaveFrom="transform opacity-100 scale-100" 
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu as="div" className="fixed z-30" style={{ top: messageMenu?.y, left: messageMenu?.x }}>
          <Menu.Items static className="origin-top-left mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={() => onSelectMessage(messageMenu?.message?.id || '')} 
                    className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                  >
                    <CheckSquare className="mr-3 h-5 w-5" />
                    تأشير
                  </button>
                )}
              </Menu.Item>
              {messageMenu?.message?.senderId === currentUserId && (
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={onClose} 
                      className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <Pin className="mr-3 h-5 w-5" />
                      تثبيت
                    </button>
                  )}
                </Menu.Item>
              )}
              <div className="px-4 my-1"><hr /></div>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={onClose} 
                    className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                  >
                    <Trash2 className="mr-3 h-5 w-5" />
                    حذف لدي
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={onClose} 
                    className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}
                  >
                    <Trash2 className="mr-3 h-5 w-5" />
                    حذف لدى الجميع
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
