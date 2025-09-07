import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProcessingModal } from '../shared/ProcessingModal';
import ActionMenu from '../shared/ActionMenu';
import { ConversationListItem } from '../shared/ConversationListItem';

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // إغلاق القائمة عند النقر خارجها
  const handleBackdropPress = () => {
    if (menuVisible) {
      setMenuVisible(false);
      setActiveSubmenu(null);
    }
  };

  // خيارات القائمة المنسدلة
  const menuOptions = [
    { id: 'shygram', title: 'شاي كرام (ShyGram)', icon: 'chat' },
    { id: 'shopping', title: 'تسوق', icon: 'shopping-cart' },
    { 
      id: 'study', 
      title: 'دراستي', 
      icon: 'school', 
      hasSubmenu: true,
      submenu: [
        { id: 'assistant', title: 'المساعد الذكي', icon: 'smart-toy' },
        { id: 'exams', title: 'الامتحانات والاسئلة المرشحة', icon: 'quiz' }
      ]
    },
    { 
      id: 'games', 
      title: 'العاب تعليمية', 
      icon: 'sports-esports', 
      hasSubmenu: true,
      submenu: [
        { id: 'dictionary', title: 'قاموس الكلمات', icon: 'menu-book' },
        { id: 'crosswords', title: 'مصطلحات متقاطعة', icon: 'grid-view' },
        { id: 'challenge', title: 'تحدي الاذكياء', icon: 'psychology' }
      ]
    },
    { id: 'group', title: 'محادثة جماعية', icon: 'group' },
    { 
      id: 'themes', 
      title: 'ثيمات', 
      icon: 'palette', 
      hasSubmenu: true,
      submenu: [
        { id: 'warm', title: 'الوان دافئة', icon: 'wb-sunny' },
        { id: 'cool', title: 'الوان باردة', icon: 'ac-unit' },
        { id: 'youth', title: 'الوان شبابية', icon: 'auto-awesome' },
        { id: 'dark', title: 'الوضع الليلي', icon: 'dark-mode' }
      ]
    },
    { id: 'logout', title: 'تسجيل خروج', icon: 'logout' },
  ];

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
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.archiveButton} 
            onPress={() => navigation.navigate('Archived')}
          >
            <Text style={styles.archiveIcon}>🗄️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <MaterialIcons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* القائمة المنسدلة */}
      {menuVisible && (
        <>
          <TouchableOpacity 
            style={styles.menuBackdrop} 
            activeOpacity={1} 
            onPress={handleBackdropPress}
          />
          <View style={styles.dropdownMenu}>
          {activeSubmenu ? (
            // عرض القائمة الفرعية النشطة
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setActiveSubmenu(null)}
              >
                <MaterialIcons name="arrow-right" size={20} color="#333" style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>الرجوع</Text>
              </TouchableOpacity>
              {menuOptions.find(opt => opt.id === activeSubmenu)?.submenu.map((subOption) => (
                <TouchableOpacity
                  key={subOption.id}
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    setActiveSubmenu(null);
                    // هنا سيتم تنفيذ الإجراءات لاحقاً
                  }}
                >
                  <MaterialIcons name={subOption.icon} size={20} color="#333" style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>{subOption.title}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            // عرض القائمة الرئيسية
            <>
              {menuOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.menuItem}
                  onPress={() => {
                    if (option.hasSubmenu) {
                      setActiveSubmenu(option.id);
                    } else {
                      setMenuVisible(false);
                      // هنا سيتم تنفيذ الإجراءات لاحقاً
                    }
                  }}
                >
                  <MaterialIcons name={option.icon} size={20} color="#333" style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>{option.title}</Text>
                  {option.hasSubmenu && (
                    <MaterialIcons name="chevron-left" size={18} color="#666" />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
        </>
      )}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginLeft: 10,
    padding: 5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 95,
    left: '15%',
    width: '70%',
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    marginLeft: 10,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
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
  archiveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  archiveIcon: {
    fontSize: 20,
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
