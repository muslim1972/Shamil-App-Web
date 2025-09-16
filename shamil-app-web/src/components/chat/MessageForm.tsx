// MessageForm Component - Optimized Version
// This component handles the message input form with improved focus and keyboard handling

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  reducedEffects?: boolean;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isIOS, setIsIOS] = useState(false);

  // التحقق من نوع الجهاز
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  // منع التركيز التلقائي على حقل الإدخال عند تحميل المكون
  useEffect(() => {
    if (inputRef.current && !isRecording && !isUploading && document.activeElement === inputRef.current) {
      inputRef.current.blur();
    }
  }, [isRecording, isUploading]);

  // التعامل مع تغيير ارتفاع لوحة المفاتيح
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const heightDiff = windowHeight - viewportHeight;

        // إذا كان الفرق كبيرًا، فهذا يعني أن لوحة المفاتيح مفتوحة
        if (heightDiff > 100) {
          setKeyboardHeight(heightDiff);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    if (isIOS) {
      window.visualViewport?.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, [isIOS]);

  // ضبط ارتفاع textarea تلقائيًا بناءً على محتواه
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // منع السلوك الافتراضي الذي قد يسبب فقدان التركيز
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        onSendMessage(e as any);
        // الحفاظ على التركيز بعد الإرسال باستخدام requestAnimationFrame
        requestAnimationFrame(() => {
          if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
          }
        });
      }
    }
  }, [disabled, onSendMessage]);

  const handleAttachmentClick = useCallback(() => {
    if (!disabled) {
      setAttachmentMenuOpen(!isAttachmentMenuOpen);
    }
  }, [disabled, isAttachmentMenuOpen, setAttachmentMenuOpen]);

  const handleStartRecording = useCallback(() => {
    if (!disabled) {
      onStartRecording();
    }
  }, [disabled, onStartRecording]);

  // دالة لإرسال التسجيل مع النص المكتوب
  const handleSendRecordingWithCaption = useCallback(async () => {
    try {
      // حفظ النص المكتوب مؤقتاً
      const captionText = newMessage.trim();

      // إرسال التسجيل مع النص ككابشن
      const success = await handleSendRecording(captionText);

      // إذا تم الإرسال بنجاح، قم بتفريغ حقل النص
      if (success) {
        setNewMessage('');
        // الحفاظ على التركيز بعد الإرسال باستخدام requestAnimationFrame
        requestAnimationFrame(() => {
          if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
          }
        });
      }
    } catch (error) {
      console.error('فشل في إرسال التسجيل:', error);
    }
  }, [newMessage, handleSendRecording, setNewMessage]);

  // دالة للتعامل مع التركيز على حقل الإدخال
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // دالة للتعامل مع فقدان التركيز من حقل الإدخال
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // منع فقدان التركيز عند إرسال الرسالة
  const preventFocusLoss = useCallback(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form
      className={`bg-white border-t border-gray-200 p-4 relative ${disabled ? 'opacity-60' : ''}`}
      onSubmit={onSendMessage}
      onKeyDown={handleKeyDown}
      style={{ marginBottom: isIOS ? `${keyboardHeight}px` : '0' }}
      // منع إعادة التصيير غير الضرورية
      onMouseUp={preventFocusLoss}
      onTouchEnd={preventFocusLoss}
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        isFocused={isFocused}
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
