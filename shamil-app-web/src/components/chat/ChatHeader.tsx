// ChatHeader Component
// This component renders the header of the chat screen

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  displayConversationName: string;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ displayConversationName, onBack }) => {
  return (
    <div className="bg-teal-400 bg-opacity-90 backdrop-blur-sm shadow-sm p-4 flex items-center border-b border-gray-200">
      <button
        onClick={onBack}
        className="p-2 text-white hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-white rounded-full mr-2"
      >
        <ArrowLeft size={24} />
      </button>
      <div>
        <h2 className="text-lg font-semibold text-white">{displayConversationName}</h2>
      </div>
    </div>
  );
};
