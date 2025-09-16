import React from 'react';
import { ConversationListScreen as OptimizedConversationListScreen } from './conversation-list/ConversationListScreen';

/**
 * مكون شاشة قائمة المحادثات الرئيسي
 * يستخدم النسخة المحسنة والمقسمة من شاشة قائمة المحادثات
 */
const ConversationListScreen: React.FC = () => {
  return <OptimizedConversationListScreen />;
};

export default ConversationListScreen;
