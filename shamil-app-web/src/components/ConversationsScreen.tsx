import React, { useState } from 'react';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface ConversationsScreenProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onLogout: () => void;
  onCreateNewConversation: () => void;
}

const ConversationsScreen: React.FC<ConversationsScreenProps> = ({ 
  conversations, 
  onSelectConversation, 
  onLogout,
  onCreateNewConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">المحادثات</h1>
          <div className="flex space-x-2">
            <button 
              onClick={onCreateNewConversation}
              className="p-2 rounded-full hover:bg-indigo-500 transition-colors"
              aria-label="محادثة جديدة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-indigo-500 transition-colors"
              aria-label="تسجيل الخروج"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن محادثة..."
              className="w-full p-2 pl-10 rounded-lg bg-indigo-500 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredConversations.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {searchTerm ? 'لا توجد محادثات تطابق بحثك' : 'لا توجد محادثات'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <li 
                key={conversation.id} 
                className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors ${conversation.unread ? 'bg-blue-50' : ''}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                    {conversation.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h3 className={`text-sm font-medium truncate ${conversation.unread ? 'text-indigo-700 font-bold' : 'text-gray-900'}`}>
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unread ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread && (
                    <div className="ml-2 flex-shrink-0">
                      <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationsScreen;
