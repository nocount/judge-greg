import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/types/ChatMessage';
import { JudgeIcon } from './JudgeIcon';
import { Colors } from '@/theme/colors';

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
          <Text style={styles.userTimestamp}>{formatTime(message.timestamp)}</Text>
        </View>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>U</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.judgeRow}>
      <JudgeIcon size={32} />
      <View style={[styles.judgeBubble, message.isError && styles.errorBubble]}>
        <Text style={[styles.judgeText, message.isError && styles.errorText]}>
          {message.content}
        </Text>
        <Text style={styles.judgeTimestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // User message
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginVertical: 4,
    gap: 8,
  },
  userBubble: {
    backgroundColor: Colors.userBubble,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  userText: {
    color: Colors.textUser,
    fontSize: 15,
    lineHeight: 22,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Judge message
  judgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginVertical: 4,
    gap: 8,
  },
  judgeBubble: {
    backgroundColor: Colors.judgeBubble,
    borderWidth: 1,
    borderColor: Colors.judgeBubbleBorder,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  errorBubble: {
    borderColor: '#6B2121',
    backgroundColor: '#2A1010',
  },
  judgeText: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: '#F08080',
  },
  judgeTimestamp: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
