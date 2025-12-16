import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BombIcon from '../../assets/bomb-orange.svg';

interface BombViewProps {
  statusText: string;
}

export const BombView: React.FC<BombViewProps> = ({ statusText }) => {
  return (
    <View style={styles.centerBox}>
      <BombIcon width={120} height={120} />
      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centerBox: {
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
