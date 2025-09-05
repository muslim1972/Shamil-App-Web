import React from "react";
import { useNavigation } from '@react-navigation/native';
import { ConversationListScreen as ConversationListScreenNew } from './conversationList';

export default function ConversationListScreen() {
  const navigation = useNavigation();
  return <ConversationListScreenNew navigation={navigation} />;
}
