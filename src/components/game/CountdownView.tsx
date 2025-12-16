import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownViewProps {
  countdownNumber: number;
}

export const CountdownView: React.FC<CountdownViewProps> = ({ countdownNumber }) => {
  return (
    <View style={styles.centerBox}>
      <Text style={styles.countdownText}>{countdownNumber}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centerBox: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#2DD881',
  },
});
