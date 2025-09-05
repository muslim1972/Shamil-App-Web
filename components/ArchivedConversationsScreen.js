import React from "react";
import { useNavigation } from '@react-navigation/native';
import { ArchivedConversationsScreen as ArchivedConversationsScreenNew } from './archivedConversations';

export default function ArchivedConversationsScreen() {
  const navigation = useNavigation();
  return <ArchivedConversationsScreenNew navigation={navigation} />;
}
