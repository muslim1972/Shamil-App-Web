import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ArchivedConversationItem } from './ArchivedConversationItem';
import ActionMenu from '../shared/ActionMenu';

export const ArchivedConversationsUI = ({
  conversations,
  isLoading,
  isProcessing,
  selectedConversation,
  isActionMenuVisible,
  actionMenuActions,
  handleSelectConversation,
  handleConversationOptions,
  closeActionMenu,
  navigation
}) => {
  // دالة لعرض القائمة المخصصة
  const renderActionMenu = () => {
    if (!selectedConversation) return null;

    return (
      <ActionMenu
        visible={isActionMenuVisible}
        title={`خيارات "${selectedConversation.name}"`}
        actions={actionMenuActions}
        onRequestClose={closeActionMenu}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderActionMenu()}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المحادثات المؤرشفة</Text>
        <View style={{ width: 24 }} />
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#25D366" />
      ) : (
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <ArchivedConversationItem
              item={item}
              onSelect={handleSelectConversation}
              onLongPress={handleConversationOptions}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>لا توجد محادثات مؤرشفة.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#25D366',
    paddingTop: 40,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerButton: { padding: 5 },
  emptyText: { fontSize: 16, color: 'grey', marginTop: 50 },
});
