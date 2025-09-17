// MessageInput Component
// This component handles the message input field and related buttons

import React from 'react';
import { Paperclip, Send, Mic, CornerDownLeft } from 'lucide-react';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onAttachmentClick: () => void;
  onStartRecording: () => void;
  isUploading: boolean;
  isRecording: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  onSendMessage,
  onAttachmentClick,
  onStartRecording,
  isUploading,
  isRecording,
  inputRef,
  disabled = false
}) => {
  // حساب عدد الأحرف المتبقية
  const maxCharacters = 1000;
  const remainingCharacters = maxCharacters - newMessage.length;

  // التحقق مما إذا كان النص طويلاً جداً
  const isTextTooLong = remainingCharacters < 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // تحديد طول النص إلى الحد الأقصى
    if (text.length <= maxCharacters) {
      setNewMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // إرسال الرسالة عند الضغط على Enter بدون Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        onSendMessage(e as any);
      }
    }
  };

  return (
    <div className="flex flex-col px-2">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onAttachmentClick}
          disabled={isUploading || disabled}
          className={`p-2 rounded-full flex-shrink-0 transition-all ${
            disabled || isUploading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
          }`}
          aria-label="إرفاق ملف"
        >
          <Paperclip size={24} className="rotate-45" />
        </button>

        <div className="flex-1 relative mx-2 min-w-0">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالة..."
            rows={1}
            className={`w-full border rounded-2xl py-2 px-4 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
              isTextTooLong
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-indigo-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={disabled}
            style={{ maxHeight: '120px' }}
          />

          {/* مؤشر عدد الأحرف */}
          {newMessage.length > 0 && (
            <div className={`absolute bottom-1 right-2 text-xs ${
              isTextTooLong ? 'text-red-500' : 'text-gray-400'
            }`}>
              {remainingCharacters}
            </div>
          )}
        </div>

        {newMessage.length > 0 ? (
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => {
                if (inputRef.current) {
                  const currentValue = newMessage;
                  setNewMessage(currentValue + '\n');
                  // التركيز على حقل الإدخال بعد إضافة السطر الجديد
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                      inputRef.current.selectionStart = inputRef.current.value.length;
                    }
                  }, 0);
                }
              }}
              disabled={disabled || isTextTooLong || isRecording}
              className={`rounded-full p-2 flex-shrink-0 transition-all ${
                disabled || isTextTooLong || isRecording
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } text-indigo-600`}
              aria-label="سطر جديد"
            >
              <CornerDownLeft size={18} className="transform -rotate-90" />
            </button>
            <button
              type="submit"
              disabled={disabled || isTextTooLong || isRecording}
              onClick={(e) => { if (!disabled && !isTextTooLong && !isRecording) onSendMessage && onSendMessage(e as any); }}
              className={`rounded-full p-3 flex-shrink-0 transition-all ${
                disabled || isTextTooLong || isRecording
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } text-white`}
              aria-label="إرسال الرسالة"
            >
              <Send size={20} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartRecording}
            disabled={isUploading || isRecording || disabled}
            className={`rounded-full p-3 flex-shrink-0 transition-all relative group ${
              disabled || isUploading || isRecording
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            } text-white`}
            aria-label="تسجيل رسالة صوتية"
          >
            <Mic size={20} />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
              اضغط لتسجيل رسالة صوتية
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
            </div>
          </button>
        )}
      </div>

      {/* رسالة تحذير للنص الطويل */}
      {isTextTooLong && (
        <div className="text-red-500 text-xs mt-1 text-right">
          الرسالة طويلة جداً، يرجى تقصيرها
        </div>
      )}
    </div>
  );
};