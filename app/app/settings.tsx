import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { SecureStoreService } from '@/services/SecureStoreService';

export default function SettingsScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    SecureStoreService.loadApiKey().then((key) => {
      if (key) {
        setHasExistingKey(true);
        setApiKey(key);
      }
    });
  }, []);

  async function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an API key.');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      Alert.alert('Invalid Key', 'Anthropic API keys start with "sk-ant-".');
      return;
    }
    await SecureStoreService.saveApiKey(trimmed);
    router.back();
  }

  async function handleClear() {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your stored API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await SecureStoreService.deleteApiKey();
            setApiKey('');
            setHasExistingKey(false);
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anthropic API Key</Text>
          <Text style={styles.sectionSubtitle}>
            Your key is stored securely in the iOS Keychain and never leaves your device.
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-..."
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowKey((v) => !v)}
            >
              <Ionicons
                name={showKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Key</Text>
          </TouchableOpacity>

          {hasExistingKey && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Remove Key</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get an API Key</Text>
          <Text style={styles.sectionSubtitle}>
            You need an Anthropic API key to use Judge Greg.
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://console.anthropic.com')}
          >
            <Text style={styles.linkButtonText}>Open Anthropic Console</Text>
            <Ionicons name="open-outline" size={16} color={Colors.accentBlue} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B2121',
  },
  clearButtonText: {
    color: '#F08080',
    fontSize: 15,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkButtonText: {
    color: Colors.accentBlue,
    fontSize: 15,
  },
});
