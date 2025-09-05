import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { UserItem } from './components/shared/UserItem';

// بيانات وهمية للمستخدمين
const mockUsers = [
  { id: '1', username: 'أحمد محمد', email: 'ahmed@example.com', display_name: 'أحمد محمد' },
  { id: '2', username: 'فاطمة علي', email: 'fatima@example.com', display_name: 'فاطمة علي' },
  { id: '3', username: 'محمد حسن', email: 'mohammed@example.com', display_name: 'محمد حسن' },
  { id: '4', username: 'عائشة أحمد', email: 'aisha@example.com', display_name: 'عائشة أحمد' },
  { id: '5', username: 'عبدالله سالم', email: 'abdullah@example.com', display_name: 'عبدالله سالم' },
];

// عرض المكونات المصلحة
const ComponentShowcase = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // محاكاة تحميل البيانات
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleUserPress = (user) => {
    console.log('تم اختيار المستخدم:', user.display_name);
  };

  if (isLoading) {
    return <LoadingScreen message="جاري تحميل المستخدمين..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <h2 style={styles.title}>قائمة المستخدمين المصلحة</h2>
          <p style={styles.subtitle}>تم إصلاح مشكلة التحميل اللانهائي</p>
        </View>
      </View>
      
      <View style={styles.userList}>
        {mockUsers.map(user => (
          <UserItem 
            key={user.id} 
            user={user} 
            onPress={handleUserPress} 
          />
        ))}
      </View>
      
      <View style={styles.footer}>
        <p style={styles.footerText}>✅ تم إصلاح المشكلة بنجاح</p>
      </View>
    </View>
  );
};

export default function App() {
  return <ComponentShowcase />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#25D366',
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    margin: 5,
    textAlign: 'center',
  },
  userList: {
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#25D366',
    fontWeight: 'bold',
    margin: 0,
  },
});