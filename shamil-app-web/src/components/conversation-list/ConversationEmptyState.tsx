import React from 'react';

interface ConversationEmptyStateProps {
  onCreateNewConversation: () => void;
}

export const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({ 
  onCreateNewConversation 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <div className="text-slate-500 dark:text-slate-400 mb-4">لا توجد محادثات بعد</div>
      <button
        onClick={onCreateNewConversation}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        بدء محادثة جديدة
      </button>
    </div>
  );
};
