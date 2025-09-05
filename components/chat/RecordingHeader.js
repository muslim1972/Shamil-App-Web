import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const RecordingHeader = ({ duration, onCancel, onSend }) => {
  // تحويل المدة من مللي ثانية إلى ثواني ودقائق
  const formatDuration = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
        <MaterialIcons name="close" size={24} color="white" />
      </TouchableOpacity>
      <View style={styles.recordingInfo}>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>تسجيل</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>
      <TouchableOpacity onPress={onSend} style={styles.headerButton}>
        <MaterialIcons name="send" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#25D366',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 10,
  },
  headerButton: {
    padding: 5,
    width: 50,
    alignItems: 'center',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 5,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
  },
  duration: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecordingHeader;
