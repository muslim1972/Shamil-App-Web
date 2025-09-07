import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// دالة مساعدة لتنسيق الوقت من ميلي ثانية إلى MM:SS
const formatDuration = (millis) => {
  if (!millis) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const RecordingHeader = ({ duration, onCancel, onSend }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onCancel} style={styles.button}>
        <MaterialIcons name="delete" size={28} color="#F44336" />
      </TouchableOpacity>
      <View style={styles.timerContainer}>
        <View style={styles.redDot} />
        <Text style={styles.timerText}>{formatDuration(duration)}</Text>
      </View>
      <TouchableOpacity onPress={onSend} style={styles.button}>
        {/* استخدام أيقونة المثلث كرمز للإرسال وإيقاف التسجيل */}
        <MaterialIcons name="send" size={32} color="white" style={styles.sendIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#128C7E', // لون داكن متناسق مع شريط التحديد
    paddingVertical: 10,
    paddingHorizontal: 15,
    // إزالة الحشوة العلوية الكبيرة لجعله ملاصقاً لحقل الكتابة
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  button: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 60, // لضمان عدم اهتزاز الواجهة عند تغير الوقت
    textAlign: 'center',
  },
  sendIcon: {
    backgroundColor: '#25D366', // لون أخضر للإرسال
    borderRadius: 25,
    padding: 4,
  },
});

export default RecordingHeader;