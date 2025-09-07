import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ChatHeader = ({ conversationDetails, onStartRecording }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
        <MaterialIcons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {conversationDetails?.name || 'محادثة'}
      </Text>
      <View style={styles.rightContainer}>
        {/* تم نقل أيقونة المايكروفون إلى حقل الكتابة */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#25D366',
        paddingTop: Platform.OS === 'android' ? 40 : 50,
        paddingBottom: 15,
        paddingHorizontal: 10,
    },
    headerButton: {
        padding: 5,
        width: 50,
        alignItems: 'flex-start',
      },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    rightContainer: {
        width: 50,
        alignItems: 'flex-end',
    },
    actionButton: {
        padding: 10,
        marginRight: -5, // To align it better visually
    },
});

export default ChatHeader;

