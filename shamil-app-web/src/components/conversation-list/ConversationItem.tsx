import React, { useMemo } from 'react';
import type { Conversation } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}

export const ConversationItem: React.FC<ConversationItemProps> = React.memo(({ 
  conversation, 
  onSelect, 
  style 
}) => {
  const formattedTimestamp = useMemo(() => {
    if (!conversation.timestamp) return '';
    try {
      return formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true, locale: ar });
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  }, [conversation.timestamp]);

  return (
    <div 
      style={style}
      onClick={() => onSelect(conversation.id)}
      className="p-3 sm:p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center space-x-4 rtl:space-x-reverse pointer-events-none">
        <div className="flex-shrink-0">
          <div className="relative inline-flex items-center justify-center w-12 h-12 overflow-hidden bg-slate-200 dark:bg-slate-600 rounded-full">
            <span className="font-medium text-slate-600 dark:text-slate-300 uppercase">
              {(conversation.name || '#').charAt(0)}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className={`text-sm font-semibold truncate ${conversation.unread ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-50'}`}>
              {conversation.name || 'مستخدم غير معروف'}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formattedTimestamp}
            </span>
          </div>
          <p className={`text-sm truncate ${conversation.unread ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
            {conversation.lastMessage || 'لا توجد رسائل بعد'}
          </p>
        </div>
        {conversation.unread && (
          <div className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-500"></div>
        )}
      </div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';
