import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChangeText, onSend, isLoading }: ChatInputProps) {
  const [focused, setFocused] = useState(false);
  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask the judge..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={1}
          maxLength={2000}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={canSend ? onSend : undefined}
          blurOnSubmit={false}
          returnKeyType="send"
          enablesReturnKeyAutomatically
        />
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChangeText('')}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={canSend ? onSend : undefined}
        disabled={!canSend}
      >
        <Ionicons
          name="arrow-up-circle"
          size={38}
          color={canSend ? Colors.accentBlue : Colors.surfaceLight}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceDark,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
  },
  inputFocused: {
    borderColor: Colors.accentBlue,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  clearButton: {
    marginLeft: 6,
    padding: 2,
  },
  sendButton: {
    marginBottom: 1,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
