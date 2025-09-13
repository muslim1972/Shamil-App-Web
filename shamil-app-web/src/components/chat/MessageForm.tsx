// MessageForm Component
// This component handles the message input form

import React, { useRef, useEffect } from 'react';
import { MessageInput } from './MessageInput';
import { AttachmentMenu } from './AttachmentMenu';
import { RecordingHeader } from './RecordingHeader';

interface MessageFormProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isAttachmentMenuOpen: boolean;
  setAttachmentMenuOpen: (open: boolean) => void;
  onStartRecording: () => void;
  isUploading: boolean;
  isRecording: boolean;
  recordingDuration: number;
  handleCancelRecording: () => void;
  handleSendRecording: (caption?: string) => Promise<boolean>;
  pickAndSendMedia: (type: string) => void;
  handleSendLocation: () => void;
  disabled?: boolean;
}

export const MessageForm: React.FC<MessageFormProps> = ({
  newMessage,
  setNewMessage,
  onSendMessage,
  isAttachmentMenuOpen,
  setAttachmentMenuOpen,
  onStartRecording,
  isUploading,
  isRecording,
  recordingDuration,
  handleCancelRecording,
  handleSendRecording,
  pickAndSendMedia,
  handleSendLocation,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // التركيز على حقل الإدخال عند فتح المحادثة
  useEffect(() => {
    if (inputRef.current && !isRecording && !isUploading) {
      inputRef.current.focus();
    }
  }, [isRecording, isUploading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // منع السلوك الافتراضي الذي قد يسبب فقدان التركيز
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        onSendMessage(e as any);
      }
    }
  };

  const handleAttachmentClick = () => {
    if (!disabled) {
      setAttachmentMenuOpen(!isAttachmentMenuOpen);
    }
  };

  const handleStartRecording = () => {
    if (!disabled) {
      onStartRecording();
    }
  };

  // دالة لإرسال التسجيل مع النص المكتوب
  const handleSendRecordingWithCaption = async () => {
    try {
      // حفظ النص المكتوب مؤقتاً
      const captionText = newMessage.trim();
      
      // إرسال التسجيل مع النص ككابشن
      const success = await handleSendRecording(captionText);
      
      // إذا تم الإرسال بنجاح، قم بتفريغ حقل النص
      if (success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('فشل في إرسال التسجيل:', error);
    }
  };

  return (
    <form
      className={`bg-white border-t border-gray-200 p-4 relative ${disabled ? 'opacity-60' : ''}`}
      onSubmit={onSendMessage}
      onKeyDown={handleKeyDown}
    >
      <AttachmentMenu
        isOpen={isAttachmentMenuOpen}
        onClose={() => setAttachmentMenuOpen(false)}
        onPickMedia={pickAndSendMedia}
        onSendLocation={handleSendLocation}
      />

      {isRecording && (
        <RecordingHeader
          duration={recordingDuration}
          onCancel={handleCancelRecording}
          onSend={handleSendRecordingWithCaption}
        />
      )}

      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={onSendMessage}
        onAttachmentClick={handleAttachmentClick}
        onStartRecording={handleStartRecording}
        isUploading={isUploading}
        isRecording={isRecording}
        inputRef={inputRef}
        disabled={disabled}
      />

      {/* مؤشر رفع الملفات */}
      {isUploading && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 text-white text-xs p-2 text-center rounded-t-lg">
          جاري رفع الملف...
        </div>
      )}
    </form>
  );
};