import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';

const SUGGESTIONS = [
  'What does deathtouch do?',
  'Can I respond to a sorcery?',
  'Is Ragavan legal in Modern?',
];

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="scale-balance" size={48} color={Colors.accentBlue} />
      </View>
      <Text style={styles.title}>Ask the Judge</Text>
      <Text style={styles.subtitle}>
        Get precise rulings on Magic: The Gathering cards and interactions.
      </Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={styles.chip}
            onPress={() => onSuggestion(suggestion)}
          >
            <Text style={styles.chipText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 64,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  suggestions: {
    gap: 10,
    alignSelf: 'stretch',
  },
  chip: {
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
});
