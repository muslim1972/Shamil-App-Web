import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ProcessingModal } from './shared/ProcessingModal';
import SearchDialog from './shared/SearchDialog';
import { LoadingScreen } from './shared/LoadingScreen';
import { UserItem } from './shared/UserItem';

export default function UserListScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();
  const route = useRoute(); // استخدام useRoute للوصول إلى معلومات المسار
  const [isLoading, setIsLoading] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isSearchDialogVisible, setIsSearchDialogVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  // التعديل: استلام الباراميترز من route.params
  const { selectedMessages } = route.params || {};
  // --- [تحسين] استخدام useFocusEffect لضمان تحديث البيانات عند كل مرة يتم فيها عرض الشاشة ---
  useFocusEffect(
    useCallback(() => {
      const fetchUsers = async () => {
        // --- [تتبع] إضافة Logs لمتابعة الخطأ ---
        // console.log('--- [UserList] fetchUsers: Starting to fetch users.');
        
        setIsLoading(true);
        
        if (!user) {
          // console.log('--- [UserList] fetchUsers: Aborting, user is not available.');
          setIsLoading(false);
          return;
        }
        
        // console.log(`--- [UserList] fetchUsers: Fetching for user.id: ${user.id}`);

        try {
          // --- [تعديل] جلب المستخدمين الذين شاركوا في محادثة فقط ---
          // console.log('--- [UserList] Fetching contact users for user.id:', user.id);

          const { data: contactUsers, error } = await supabase.rpc('get_contact_users', {
            p_user_id: user.id,
          });

          if (error) {
            console.error('--- [UserList] Error fetching contact users:', error); // Uncommented
            Alert.alert('خطأ', 'لم نتمكن من جلب قائمة جهات الاتصال.');
            setUsers([]);
          } else {
            // console.log(`--- [UserList] Successfully fetched ${contactUsers?.length || 0} contact users.`);
            setUsers(contactUsers || []);
          }
        } catch (error) {
          console.error('--- [UserList] Exception while fetching contact users:', error); // Uncommented
          Alert.alert('خطأ', 'حدث خطأ أثناء جلب جهات الاتصال.');
          setUsers([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUsers();
    }, [user])
  );


  // --- [تحسين] فصل منطق إعادة التوجيه في دالة خاصة ---
  const forwardMessagesToConversation = async (conversationId) => {
    setIsForwarding(true);
    const { error: forwardError } = await supabase.rpc('forward_messages', {
      p_source_message_ids: selectedMessages,
      p_target_conversation_id: conversationId,
    });
    setIsForwarding(false);

    if (forwardError) {
      Alert.alert('خطأ', 'فشل إعادة توجيه الرسائل.');
      // console.error('Error forwarding messages:', forwardError);
      return;
    }

    // [تحسين] الانتقال مباشرة إلى المحادثة بعد إعادة التوجيه
    navigation.navigate('Chat', { conversationId: conversationId });
  };

  const handleUserSelect = async (selectedUser) => {
    // إذا كنا في وضع إعادة التوجيه، أظهر شاشة المعالجة
    if (selectedMessages) {
      setIsForwarding(true);
    }

    // استدعاء دالة RPC لإنشاء محادثة أو جلب محادثة موجودة
    const { data: conversationId, error } = await supabase.rpc('create_or_get_conversation_with_user', {
      p_other_user_id: selectedUser.id,
    });

    if (error) {
      if (selectedMessages) setIsForwarding(false);
      Alert.alert('خطأ', 'لم نتمكن من بدء المحادثة.');
      // console.error('Error creating/getting conversation:', error);
      return;
    }

    if (selectedMessages) {
      await forwardMessagesToConversation(conversationId);
    } else {
      if (conversationId) {
        navigation.replace('Chat', { // استبدال الشاشة الحالية بشاشة الدردشة
          conversationId: conversationId
        });
      }

    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => { 
        if (isSearchDialogVisible) {
          setIsSearchDialogVisible(false);
          return true;
        }
        navigation.goBack(); 
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, isSearchDialogVisible])
  );

  // وظائف البحث مع LOGS مفصلة
  const handleSearch = async (searchText) => {
    // console.log('🔍 بدء عملية البحث...');
    // console.log('📝 النص المدخل للبحث:', searchText);
    // console.log('👤 المستخدم الحالي:', user?.id, user?.email);
    
    setIsSearchDialogVisible(false);
    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);

    try {
      // التحقق من صحة النص المدخل
      if (!searchText || searchText.trim().length === 0) {
        // console.log('❌ النص المدخل فارغ');
        setSearchError('الرجاء إدخال نص للبحث');
        return;
      }

      const cleanSearchText = searchText.trim();
      // console.log('🧹 النص بعد التنظيف:', cleanSearchText);

      // البحث في جميع المستخدمين أولاً للتحقق من وجود البيانات
      // console.log('📊 جلب جميع المستخدمين من قاعدة البيانات...');
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, username, email, display_name');

      // console.log('📋 استجابة قاعدة البيانات:');
      // console.log('  - البيانات:', allUsers);
      // console.log('  - الخطأ:', allUsersError);
      // console.log('  - عدد المستخدمين:', allUsers?.length || 0);

      if (allUsersError) {
        // console.error('❌ خطأ في جلب المستخدمين:', allUsersError);
        setSearchError('حدث خطأ أثناء البحث في قاعدة البيانات');
        return;
      }

      if (!allUsers || allUsers.length === 0) {
        // console.log('⚠️ لا توجد بيانات مستخدمين في قاعدة البيانات');
        setSearchError('لا توجد بيانات مستخدمين');
        return;
      }

      // البحث اليدوي في النتائج
      const searchLower = cleanSearchText.toLowerCase();
      // console.log('🔤 النص بالأحرف الصغيرة:', searchLower);
      
      // console.log('🔍 بدء البحث في كل مستخدم...');
      
      const foundUsers = allUsers.filter((u, index) => {
        // console.log(`👤 فحص المستخدم ${index + 1}:`, u);

        // التحقق من تطابق اسم المستخدم
        const usernameMatch = u.username && u.username.toLowerCase().includes(searchLower);
        // console.log(`  📝 اسم المستخدم: "${u.username}" -> تطابق: ${usernameMatch}`);
        
        // التحقق من تطابق البريد الإلكتروني
        const emailMatch = u.email && u.email.toLowerCase().includes(searchLower);
        // console.log(`  📧 البريد الإلكتروني: "${u.email}" -> تطابق: ${emailMatch}`);
        
        // التحقق من تطابق اسم العرض
        const displayNameMatch = u.display_name && u.display_name.toLowerCase().includes(searchLower);
        // console.log(`  🏷️ اسم العرض: "${u.display_name}" -> تطابق: ${displayNameMatch}`);

        const isMatch = usernameMatch || emailMatch || displayNameMatch;
        // console.log(`  ✅ النتيجة النهائية: ${isMatch}`);
        
        return isMatch;
      });

      // console.log('🎯 نتائج البحث:', foundUsers);
      // console.log('📊 عدد النتائج:', foundUsers.length);

      if (foundUsers.length > 0) {
        // console.log('✅ تم العثور على مستخدمين!');
        console.log('👤 أول مستخدم:', foundUsers[0]);
        
        // إذا تم العثور على مستخدم واحد أو أكثر
        setSearchResult(foundUsers[0]);
        
        // إضافة المستخدم إلى قائمة المستخدمين إذا لم يكن موجوداً
        setUsers(prevUsers => {
          const existingIds = prevUsers.map(u => u.id);
          const newUsers = foundUsers.filter(u => !existingIds.includes(u.id));
          console.log('➕ إضافة مستخدمين جدد:', newUsers);
          return [...newUsers, ...prevUsers];
        });
        
        console.log('🎉 تم البحث بنجاح!');
      } else {
        console.log('❌ لم يتم العثور على أي مستخدم');
        setSearchError(`لا يوجد مستخدم يحتوي على "${cleanSearchText}"`);
      }
    } catch (err) {
      console.error('💥 خطأ في عملية البحث:', err);
      console.error('📊 تفاصيل الخطأ:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setSearchError('حدث خطأ تقني أثناء البحث');
    } finally {
      setIsSearching(false);
      
    }
  };

  const handleGenerateQR = () => {
    // سيتم تنفيذ هذه الوظيفة في المرحلة الثانية
    Alert.alert('تنبيه', 'سيتم إنشاء رمز QR');
    setIsSearchDialogVisible(false);
  };

  const handleOpenCamera = () => {
    // سيتم تنفيذ هذه الوظيفة في المرحلة الثانية
    Alert.alert('تنبيه', 'سيتم فتح الكاميرا لقراءة رمز QR');
    setIsSearchDialogVisible(false);
  };

  const renderItem = ({ item }) => (
    <UserItem user={item} onPress={handleUserSelect} />
  );

  if (isLoading) {
    return <LoadingScreen message="جاري تحميل المستخدمين..." />;
  }

  return (
    <View style={styles.container}>
      <ProcessingModal visible={isForwarding || isSearching} />
      <SearchDialog
        visible={isSearchDialogVisible}
        onClose={() => setIsSearchDialogVisible(false)}
        onSearch={handleSearch}
        onGenerateQR={handleGenerateQR}
        onOpenCamera={handleOpenCamera}
      />
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButtonContainer}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>جهات الاتصال</Text>
        <TouchableOpacity onPress={() => setIsSearchDialogVisible(true)} style={styles.headerButtonContainer}>
          <MaterialIcons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            {searchError ? (
              <>
                <Text style={styles.errorText}>{searchError}</Text>
                <Text style={styles.inviteText}>وجه له دعوة ليشاركك لحظاتك الجميلة</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>لا يوجد مستخدمون آخرون لبدء محادثة.</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

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
    headerButtonContainer: {
      width: 50, // To balance the empty view on the other side
      alignItems: 'center',
    },
    emptyText: { fontSize: 16, color: 'grey', marginTop: 50 },
    errorText: { fontSize: 16, color: 'red', marginTop: 50, textAlign: 'center' },
    inviteText: { fontSize: 14, color: '#25D366', marginTop: 10, textAlign: 'center' },
});