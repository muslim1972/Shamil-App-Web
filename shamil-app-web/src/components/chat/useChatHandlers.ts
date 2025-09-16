import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Message } from '../../types';

export const useChatHandlers = (
  conversationId: string | undefined,
  _messagesEndRef: React.RefObject<HTMLDivElement>,
  scrollToBottom: () => void,
  sendMessage: (text: string) => Promise<void>,
  handleSendRecording: (caption?: string) => Promise<boolean>
) => {
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [messageMenu, setMessageMenu] = useState<{ x: number; y: number; message: Message } | null>(null);

  // دالة للتعامل مع النقر الطويل على الرسالة
  const handleMessageLongPress = useCallback((target: EventTarget | null, message: Message) => {
    if (!target) return;
    const targetElement = target as HTMLElement;
    const rect = targetElement.getBoundingClientRect();

    // إذا كانت هناك رسائل محددة بالفعل، أضف هذه الرسالة إلى القائمة
    if (selectedMessages.length > 0) {
      if (selectedMessages.includes(message.id)) {
        setSelectedMessages(prev => prev.filter(id => id !== message.id));
      } else {
        setSelectedMessages(prev => [...prev, message.id]);
      }
    } else {
      // إذا لم تكن هناك رسائل محددة، اعرض القائمة
      setMessageMenu({ x: rect.left, y: rect.bottom, message });
    }
  }, [selectedMessages]);

  const handleCloseMessageMenu = useCallback(() => {
    setMessageMenu(null);
  }, []);

  // دالة لتحديد رسالة
  const handleSelectMessage = useCallback((messageId: string) => {
    setSelectedMessages(prev => [...prev, messageId]);
    setMessageMenu(null);
  }, []);

  // دالة لإلغاء تحديد جميع الرسائل
  const handleDeselectAllMessages = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  const handleSendMessage = async (e: React.FormEvent, newMessage: string, setNewMessage: (value: string) => void, isOnline: boolean) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversationId) return;

    if (!isOnline) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }

    try {
      setIsSending(true);
      await sendMessage(newMessage);
      setNewMessage('');
      scrollToBottom();
      toast.success('تم إرسال الرسالة');

      // إزالة التركيز من حقل الإدخال بعد إرسال الرسالة لمنع ظهور لوحة المفاتيح
      setTimeout(() => {
        const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
        if (inputElement) {
          inputElement.blur();
        }
      }, 100);
    } catch (error) {
      console.error('فشل في إرسال الرسالة:', error);
      toast.error('فشل في إرسال الرسالة، حاول مرة أخرى');
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = useCallback(() => {
    navigate('/conversations');
  }, [navigate]);

  const handleSendRecordingWithCaption = async (caption?: string): Promise<boolean> => {
    try {
      setIsSending(true);
      const success = await handleSendRecording(caption);
      if (success) {
        scrollToBottom();
        toast.success('تم إرسال الرسالة الصوتية');
      } else {
        toast.error('فشل في إرسال الرسالة الصوتية، حاول مرة أخرى');
      }
      return success;
    } catch (error) {
      console.error('فشل في إرسال الرسالة الصوتية:', error);
      toast.error('فشل في إرسال الرسالة الصوتية، حاول مرة أخرى');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    selectedMessages,
    messageMenu,
    handleMessageLongPress,
    handleCloseMessageMenu,
    handleSelectMessage,
    handleDeselectAllMessages,
    handleSendMessage,
    handleBack,
    handleSendRecordingWithCaption
  };
};
