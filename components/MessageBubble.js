import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import AudioPlayer from './shared/AudioPlayer';

const MessageBubble = React.memo(({ item, user, onPress, onLongPress, isGroupChat, isSelected, isSelectionMode, onPressImage, onImageLoad }) => {
  const isMyMessage = item.sender_id === user.id;
  const senderName = item.sender ? item.sender.username : '...';
  const messageTime = item.created_at ? new Date(item.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '';
  const bubbleStyle = [
    styles.messageBubble,
    isMyMessage ? styles.myMessage : styles.otherMessage,
    isSelected ? styles.selectedMessage : {}
  ];

  const handleBubblePress = () => {
    if (isSelectionMode) {
      onPress(item);
      return;
    }
    if (item.message_type === 'image' && item.signedUrl) {
      onPressImage(item.signedUrl);
    }
  };

  const handleBubbleLongPress = () => {
    onLongPress(item);
  };

  return (
    <TouchableOpacity
      onPress={handleBubblePress}
      onLongPress={handleBubbleLongPress}
      delayLongPress={200}
      activeOpacity={0.8}
    >
      <View style={bubbleStyle}>
        {isGroupChat && !isMyMessage && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        {item.message_type === 'image' ? (
          <View style={styles.imageContainer}>
            {item.signedUrl ? (
              <Image
                source={{ uri: item.signedUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoad={onImageLoad}
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <ActivityIndicator color="#888" />
              </View>
            )}
          </View>
        ) : item.message_type === 'audio' ? (
          <View>
            {item.signedUrl ? (
              <AudioPlayer
                uri={item.signedUrl}
                duration={item.media_metadata?.duration || 0}
                isMyMessage={isMyMessage}
              />
            ) : (
              <ActivityIndicator color="#888" style={{ padding: 20 }} />
            )}
            {item.caption ? <Text style={styles.captionText}>{item.caption}</Text> : null}
          </View>
        ) : item.message_type === 'video' ? (
          <View style={styles.imageContainer}>
            {item.signedUrl ? (
              <Video
                source={{ uri: item.signedUrl }}
                style={styles.image}
                useNativeControls
                resizeMode="contain"
                isLooping={false}
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <ActivityIndicator color="#888" />
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.messageText}>{item.content}</Text>
        )}
        <Text style={styles.messageTime}>
          {messageTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 4,
    paddingBottom: 30,
    position: 'relative',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  selectedMessage: {
    backgroundColor: '#E0F7FA',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  senderName: {
    color: '#E91E63',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  captionText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    paddingHorizontal: 5,
    fontStyle: 'italic',
  },
  messageTime: {
    fontSize: 11,
    color: 'grey',
    position: 'absolute',
    bottom: 5,
    right: 10,
  },
  imageContainer: {
    width: 250,
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    marginBottom: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessageBubble;