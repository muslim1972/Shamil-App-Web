import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ContactsScreen from './screens/ContactsScreen';
import ChatScreen from './screens/ChatScreen';
import CustomDrawer from './components/CustomDrawer';
import SearchUserModal from './components/SearchUserModal';
// يمكنك إضافة شاشة إنشاء الحساب وتسجيل الدخول هنا إذا كانت جاهزة
// import SignupScreen from './screens/SignupScreen';
// import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const navigationRef = useRef();

  const handleDrawerSelect = (label) => {
    setDrawerVisible(false);
    if (label === 'جهات الاتصال') {
      navigationRef.current?.navigate('Contacts');
    }
    if (label === 'محادثة جماعية') {
      navigationRef.current?.navigate('Chats');
    }
    if (label === 'تسجيل خروج') {
      // تنفيذ عملية تسجيل الخروج هنا إذا رغبت
    }
    if (label === 'بحث') {
      setSearchModalVisible(true);
    }
    // أضف خيارات أخرى حسب الحاجة
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        {drawerVisible && <CustomDrawer onSelect={handleDrawerSelect} />}
        <SearchUserModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} />
        <Stack.Navigator initialRouteName="Contacts" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          {/* أضف شاشة إنشاء الحساب وتسجيل الدخول هنا إذا كانت جاهزة */}
          {/* <Stack.Screen name="Signup" component={SignupScreen} /> */}
          {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
        </Stack.Navigator>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 36,
            left: 16,
            backgroundColor: '#388e3c',
            borderRadius: 24,
            padding: 10,
            elevation: 8,
            zIndex: 99,
          }}
          onPress={() => setDrawerVisible(!drawerVisible)}
        />
      </View>
    </NavigationContainer>
  );
}