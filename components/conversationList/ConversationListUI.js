import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ProcessingModal } from '../shared/ProcessingModal';
import ActionMenu from '../shared/ActionMenu';
import { ConversationListItem } from '../shared/ConversationListItem';
import { ArchivedRow } from '../shared/ArchivedRow';

export const ConversationListUI = ({
  conversations,
  isLoading,
  isProcessing,
  selectedConversation,
  isActionMenuVisible,
  actionMenuActions,
  handleSelectConversation,
  handleConversationOptions,
  closeActionMenu
}) => {
  const navigation = useNavigation();

  // التعامل مع زر الرجوع لإغلاق القائمة
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isActionMenuVisible) {
          closeActionMenu();
          return true; // تمنع الخروج من التطبيق
        }
        return false; // تسمح بالسلوك الافتراضي (الخروج من التطبيق)
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isActionMenuVisible, closeActionMenu])
  );

  const renderActionMenu = () => {
    if (!selectedConversation) return null;

    return (
      <ActionMenu
        visible={isActionMenuVisible}
        title={`خيارات المحادثة مع "${selectedConversation.name}"`}
        actions={actionMenuActions}
        onRequestClose={closeActionMenu}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ProcessingModal visible={isProcessing} />
      {renderActionMenu()}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المحادثات</Text>
      </View>
      {isLoading ? (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <ConversationListItem
              item={item}
              onSelect={handleSelectConversation}
              onLongPress={handleConversationOptions}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={ArchivedRow}
          ListEmptyComponent={() => (
            !isLoading && (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>لا توجد محادثات. ابدأ واحدة جديدة!</Text>
              </View>
            )
          )}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('UserList')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#25D366',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButton: {
    fontSize: 16,
    color: 'white',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: '#25D366',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 30,
    color: 'white',
  },
  emptyText: {
    fontSize: 16,
    color: 'grey',
    marginTop: 50,
  },
});
