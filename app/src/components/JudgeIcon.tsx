import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';

interface JudgeIconProps {
  size?: number;
}

export function JudgeIcon({ size = 32 }: JudgeIconProps) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <MaterialCommunityIcons
        name="scale-balance"
        size={size * 0.55}
        color={Colors.accentBlue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
