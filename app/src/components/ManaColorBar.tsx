import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';

export function ManaColorBar() {
  return (
    <View style={styles.bar}>
      {Colors.manaColors.map((color, index) => (
        <View key={index} style={[styles.segment, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 3,
  },
  segment: {
    flex: 1,
  },
});
