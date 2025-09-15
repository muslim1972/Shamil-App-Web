import React from 'react';
import { FileIcon, Download, MapPin } from 'lucide-react';
import { AudioPlayer } from '../AudioPlayer';
import type { Message } from '../../types';
import { isLocationMessage, extractLocationFromMessage, extractMapUrlFromMessage } from '../../utils/messageHelpers';
import { getFilenameFromPath } from '../../utils/fileHelpers';
import useLongPress from '../../hooks/useLongPress';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onLongPress: (target: EventTarget | null, message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isOwnMessage, onLongPress }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const longPressEvents = useLongPress((target) => onLongPress(target, message), { delay: 500 });

  const renderMessageContent = () => {
    if ((message as any).message_type === 'image' && (message as any).signedUrl) {
      return <img src={(message as any).signedUrl} alt="Image message" className="rounded-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />;
    }
    if ((message as any).message_type === 'video' && (message as any).signedUrl) {
      return <video src={(message as any).signedUrl} controls className="rounded-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />;
    }
    if ((message as any).message_type === 'file' && (message as any).signedUrl) {
      return (
        <a href={(message as any).signedUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          <FileIcon className="w-6 h-6 mr-2 text-gray-600" />
          <span className="truncate text-sm font-medium text-gray-800">{getFilenameFromPath(message.text)}</span>
          <Download className="w-5 h-5 ml-auto text-gray-500" />
        </a>
      );
    }
    if (((message as any).message_type === 'audio' || ((message as any).signedUrl && ['dat', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes((message as any).signedUrl.split('.').pop()?.toLowerCase() || ''))) && (message as any).signedUrl) {
        return <div className="w-full"><AudioPlayer message={message} isOwnMessage={isOwnMessage} /></div>;
    }
    if (isLocationMessage(message.text)) {
        return (
            <div className="w-full">
              <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                <div className="p-2 bg-gray-100 text-center font-medium text-gray-700">📍 موقعي الحالي</div>
                <div className="relative h-40 bg-gray-200">
                  <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${extractLocationFromMessage(message.text)?.latitude},${extractLocationFromMessage(message.text)?.longitude}&zoom=15&size=400x200&markers=color:red%7C${extractLocationFromMessage(message.text)?.latitude},${extractLocationFromMessage(message.text)?.longitude}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`} alt="موقع على الخريطة" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { const mapUrl = extractMapUrlFromMessage(message.text); if (mapUrl) { window.open(mapUrl, '_blank'); } }}>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                      <MapPin size={16} className="ml-2 text-green-500" />
                      <span className="font-medium">فتح في الخرائط</span>
                    </div>
                  </div>
                </div>
                <div className="p-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-200">{extractLocationFromMessage(message.text)?.latitude.toFixed(6)}, {extractLocationFromMessage(message.text)?.longitude.toFixed(6)}</div>
              </div>
            </div>
        );
    }
    return <p>{message.text}</p>;
  };

  return (
    <div 
      {...longPressEvents}
      data-id={message.id}
      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      isOwnMessage
        ? 'bg-indigo-500 text-white'
        : 'bg-white text-gray-800 shadow-sm'
    }`}>
      {renderMessageContent()}
      <div
        className={`text-xs mt-1 text-right w-full ${
          isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
        }`}
      >
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
