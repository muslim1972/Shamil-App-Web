import { useState, useCallback } from "react";
import { supabase } from '../../lib/supabase';

export const useArchivedConversations = (user) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchArchivedConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    // استخدام الدالة الجديدة لجلب المحادثات المؤرشفة مع اسم المستخدم الآخر
    const { data, error } = await supabase
      .rpc('get_user_archived_conversations');

    if (error) {
      console.error("Error fetching archived conversations:", error.message);
      setConversations([]);
    } else {
      // تحويل البيانات إلى الهيكل المتوقع
      const filteredConversations = (data || []).map(conv => ({
        id: conv.id,
        participants: [user.id, conv.other_user_id], // إعادة بناء مصفوفة المشاركين
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        is_archived: conv.is_archived,
        archived_at: conv.archived_at,
        name: conv.other_username, // إضافة اسم المستخدم الآخر
        last_message_content: conv.last_message_content,
        last_message_created_at: conv.last_message_created_at
      }));
      setConversations(filteredConversations);
    }
    setIsLoading(false);
  }, [user]);

  return {
    conversations,
    setConversations,
    isLoading,
    fetchArchivedConversations
  };
};