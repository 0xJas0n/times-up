import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SpectatorView: React.FC = () => {
  return (
    <View style={styles.spectatorView}>
      <Text style={styles.spectatorEmoji}>👻</Text>
      <Text style={styles.spectatorTitle}>You are eliminated!</Text>
      <Text style={styles.spectatorText}>Spectating the game...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  spectatorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  spectatorEmoji: {
    fontSize: 100,
  },
  spectatorTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'center',
  },
  spectatorText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
  },
});
