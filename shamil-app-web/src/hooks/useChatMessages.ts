// useChatMessages Hook - Optimized Version
// This hook handles chat messages display and scrolling with performance improvements

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatMessages as useMessages } from './useMessages';
import { supabase } from '../services/supabase';

interface UseChatMessagesProps {
  conversationId?: string;
}

interface ConversationDetails {
  id: string;
  name: string;
}

// مفتاح التخزين المؤقت للرسائل
const MESSAGES_CACHE_KEY = 'shamil_messages_cache';
// مدة صلاحية التخزين المؤقت (5 دقائق)
const CACHE_EXPIRY_TIME = 1000 * 60 * 5;
// عدد الرسائل التي يتم تحميلها في كل مرة
const MESSAGES_BATCH_SIZE = 30;

export const useChatMessages = ({ conversationId }: UseChatMessagesProps = {}) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, messagesEndRef, isUploading, pickAndSendMedia, sendAudioMessage } = useMessages({ conversationId });
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Ref for messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // دالة للحصول على البيانات المخزنة محلياً
  const getCachedMessages = useCallback((convId: string) => {
    try {
      const cachedData = localStorage.getItem(`${MESSAGES_CACHE_KEY}_${convId}`);
      if (!cachedData) return null;

      const { data, timestamp } = JSON.parse(cachedData);

      // التحقق من انتهاء صلاحية التخزين المؤقت
      if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(`${MESSAGES_CACHE_KEY}_${convId}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached messages:', error);
      return null;
    }
  }, []);

  // دالة لتخزين البيانات محلياً
  const cacheMessages = useCallback((convId: string, data: any[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${MESSAGES_CACHE_KEY}_${convId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  }, []);

  // دالة لمسح التخزين المؤقت
  const clearCache = useCallback((convId?: string) => {
    if (convId) {
      localStorage.removeItem(`${MESSAGES_CACHE_KEY}_${convId}`);
    } else {
      // مسح جميع الرسائل المخزنة مؤقتاً
      Object.keys(localStorage)
        .filter(key => key.startsWith(MESSAGES_CACHE_KEY))
        .forEach(key => localStorage.removeItem(key));
    }
  }, []);

  // دالة للتمرير إلى آخر رسالة
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // استخدام requestAnimationFrame لتحسين الأداء
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        
        // التأكد من وصول التمرير إلى القاع تمامًا
        const container = document.getElementById('messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, [messagesEndRef]);

  // دالة لتحميل المزيد من الرسائل (التحميل التدريجي)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMoreMessages || isFetchingRef.current || isLoadingMore) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      // الحصول على أقدم رسالة حالية
      const oldestMessage = messages.length > 0 ? messages[0] : null;
      const oldestTimestamp = oldestMessage ? new Date(oldestMessage.timestamp).toISOString() : new Date().toISOString();

      const { data, error } = await supabase
        .rpc('get_conversation_messages_paginated', {
          p_conversation_id: conversationId,
          p_before_timestamp: oldestTimestamp,
          p_limit: MESSAGES_BATCH_SIZE
        });

      if (error) {
        console.error('Error loading more messages:', error);
        return;
      }

      if (data && data.length > 0) {
        // إضافة الرسائل الجديدة في بداية القائمة
        // سيتم تحديث القائمة في useMessages
        setHasMoreMessages(data.length === MESSAGES_BATCH_SIZE);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Unexpected error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [conversationId, hasMoreMessages, isLoadingMore, messages]);

  // دالة للتعامل مع التمرير لأعلى لتحميل المزيد من الرسائل
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    // إذا كان التمرير بالقرب من الأعلى، قم بتحميل المزيد من الرسائل
    if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, participants')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation details:', convError);
        return;
      }

      if (convData && convData.participants) {
        const otherUserId = convData.participants.find((id: string) => id !== user.id);
        if (otherUserId) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Error fetching other user details:', userError);
          } else if (userData) {
            setConversationDetails({
              id: convData.id,
              name: userData.username,
            });
          }
        } else {
          setConversationDetails({
            id: convData.id,
            name: 'محادثة جماعية',
          });
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching conversation details:', err);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  useEffect(() => {
    // مسح التخزين المؤقت عند تغيير المحادثة
    if (conversationId) {
      // محاولة الحصول على الرسائل من التخزين المؤقت
      // سيتم استخدام هذه الرسائل في useMessages
    }
  }, [conversationId, getCachedMessages]);

  // إضافة مستمع لحدث التمرير
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // التمرير إلى آخر رسالة عند تحديث الرسائل أو اكتمال التحميل
  useEffect(() => {
    // فقط قم بالتمرير عندما لا تكون هناك رسائل قيد التحميل
    if (!loading && messages.length > 0) {
      // استخدام requestAnimationFrame لضمان التمرير بعد اكتمال العرض
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, loading, scrollToBottom]);

  // تخزين الرسائل في التخزين المؤقت عند تحديثها
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      cacheMessages(conversationId, messages);
    }
  }, [conversationId, messages, cacheMessages]);

  // استخدام useMemo لمنع إعادة إنشاء الكائن عند كل تصيير
  const value = useMemo(() => ({
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    isUploading,
    pickAndSendMedia,
    sendAudioMessage,
    conversationDetails,
    scrollToBottom,
    messagesContainerRef,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    clearCache
  }), [
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    isUploading,
    pickAndSendMedia,
    sendAudioMessage,
    conversationDetails,
    scrollToBottom,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    clearCache
  ]);

  return value;
};
