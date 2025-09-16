import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import type { Conversation } from '../types';

// مفتاح التخزين المؤقت للمحادثات
const CONVERSATIONS_CACHE_KEY = 'shamil_conversations_cache';
// مدة صلاحية التخزين المؤقت (10 دقائق)
const CACHE_EXPIRY_TIME = 1000 * 60 * 10;

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // دالة للحصول على البيانات المخزنة محلياً
  const getCachedConversations = useCallback((): Conversation[] | null => {
    try {
      const cachedData = localStorage.getItem(CONVERSATIONS_CACHE_KEY);
      if (!cachedData) return null;

      const { data, timestamp } = JSON.parse(cachedData);

      // التحقق من انتهاء صلاحية التخزين المؤقت
      if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(CONVERSATIONS_CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached conversations:', error);
      return null;
    }
  }, []);

  // دالة لتخزين البيانات محلياً
  const cacheConversations = useCallback((data: Conversation[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching conversations:', error);
    }
  }, []);

  // دالة لمسح التخزين المؤقت
  const clearCache = useCallback(() => {
    localStorage.removeItem(CONVERSATIONS_CACHE_KEY);
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // محاولة الحصول على البيانات من التخزين المؤقت أولاً
      const cachedConversations = getCachedConversations();
      if (cachedConversations && cachedConversations.length > 0) {
        setConversations(cachedConversations);
        setLoading(false);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedConversations: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          name: conv.other_username,
          participants: conv.participants,
          lastMessage: conv.last_message,
          timestamp: conv.updated_at,
          unread: conv.unread_count > 0,
          archived: false,
        }));

        setConversations(formattedConversations);
        // تخزين البيانات في التخزين المؤقت
        cacheConversations(formattedConversations);
      }

    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'فشل في تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  }, [getCachedConversations, cacheConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // استخدام useMemo لمنع إعادة إنشاء الكائن عند كل تصيير
  const value = useMemo(() => ({
    conversations,
    loading,
    error,
    fetchConversations,
    setConversations,
    clearCache,
  }), [conversations, loading, error, fetchConversations, clearCache]);

  return value;
};
