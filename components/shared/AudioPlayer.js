import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';

// دالة مساعدة لتنسيق الوقت من ميلي ثانية إلى MM:SS
const formatTime = (millis) => {
  if (!millis) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioPlayer = ({ uri, duration, isMyMessage }) => {
  const soundRef = useRef(new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [soundDuration, setSoundDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  // Effect for loading and unloading the sound

  useEffect(() => {
    const loadSound = async () => {
      if (!uri) return;
      setIsLoading(true);
      try {
        // التأكد من تفريغ أي صوت قديم قبل تحميل الجديد
        await soundRef.current.unloadAsync();
        await soundRef.current.loadAsync(
          { uri },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 500,
            isLooping: false, // [إصلاح] التأكد من إيقاف التشغيل المتكرر بشكل صريح
          }
        );
        soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading audio:', error);
        setIsLoading(false);
      }
    };

    loadSound();

    return () => { // تفريغ الصوت عند مغادرة المكون لتوفير الذاكرة
      soundRef.current.unloadAsync();
    };
  }, [uri]);

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      if (status.error) console.log(`Playback Error: ${status.error}`);
      return;
    }

    // [تحسين] تحديث مدة المقطع من بيانات الصوت الفعلية بعد تحميلها
    if (status.durationMillis && status.durationMillis !== soundDuration) {
      setSoundDuration(status.durationMillis);
    }
    // [إصلاح] منطق حاسم للتعامل مع انتهاء المقطع لمنع التكرار
    if (status.didJustFinish && !status.isLooping) {
      setIsPlaying(false);
      setPosition(0); // إعادة المؤشر في الواجهة للبداية
      // إيقاف الصوت وإعادة مؤشره الفعلي للبداية في خطوة واحدة
      soundRef.current.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    } else {
      // تحديث الموضع وحالة التشغيل أثناء التشغيل
      if (!isSeeking) {
        setPosition(status.positionMillis);
      }
      setIsPlaying(status.isPlaying);
    }
  };

  const handlePlayPause = async () => {
    if (isLoading) return;
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const onSlidingComplete = async (value) => {
    await soundRef.current.setPositionAsync(value);
    setIsSeeking(false);
  };

  const playerColor = isMyMessage ? '#075E54' : '#128C7E';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePlayPause} disabled={isLoading} style={styles.playButton}>
        {isLoading ? (
          <ActivityIndicator color={playerColor} />
        ) : (
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={32} color={playerColor} />
        )}
      </TouchableOpacity>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={soundDuration}
          value={position}
          onSlidingStart={() => setIsSeeking(true)}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={playerColor}
          maximumTrackTintColor="#b3b3b3"
          thumbTintColor={playerColor}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(soundDuration)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', width: 250, paddingVertical: 5 },
  playButton: { paddingRight: 5 },
  sliderContainer: { flex: 1, marginLeft: 5 },
  slider: { width: '100%', height: 40 },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginTop: -10, // لتقريب الوقت من الشريط
  },
  timeText: { fontSize: 11, color: 'grey' },
});

export default AudioPlayer;