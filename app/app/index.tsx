import React, { useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ManaColorBar } from '@/components/ManaColorBar';
import { MessageBubble } from '@/components/MessageBubble';
import { LoadingBubble } from '@/components/LoadingBubble';
import { EmptyState } from '@/components/EmptyState';
import { ChatInput } from '@/components/ChatInput';
import { useChatViewModel } from '@/hooks/useChatViewModel';
import { ChatMessage } from '@/types/ChatMessage';
import { Colors } from '@/theme/colors';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const {
    messages,
    inputText,
    isLoading,
    toolActivity,
    setInputText,
    sendMessage,
    clearSession,
  } = useChatViewModel();

  // Configure header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClearSession}
        >
          <Ionicons name="refresh-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isLoading]);

  function handleClearSession() {
    if (messages.length === 0) return;
    Alert.alert(
      'New Session',
      'Clear the current conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearSession },
      ]
    );
  }

  function handleSuggestion(text: string) {
    setInputText(text);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ManaColorBar />

        {messages.length === 0 && !isLoading ? (
          <EmptyState onSuggestion={handleSuggestion} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={isLoading ? <LoadingBubble /> : null}
            showsVerticalScrollIndicator={false}
          />
        )}

        {toolActivity && (
          <Text style={styles.toolActivity}>{toolActivity}</Text>
        )}

        <View style={styles.inputBorder}>
          <ChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={sendMessage}
            isLoading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingVertical: 12,
  },
  toolActivity: {
    color: Colors.textSecondary,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
    textAlign: 'center',
  },
  inputBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceLight,
  },
  headerButton: {
    padding: 4,
    marginHorizontal: 8,
  },
});
