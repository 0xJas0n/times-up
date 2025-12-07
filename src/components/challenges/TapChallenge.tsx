import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Challenge } from '../../data/challenges';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: () => void;
  disabled: boolean;
}

export const TapChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const [counter, setCounter] = useState(0);

  const handleTap = () => {
    if (disabled) return;

    const newVal = counter + 1;
    setCounter(newVal);

    if (newVal >= challenge.target) {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.challengeTitle}>{challenge.title}</Text>
      <Text style={styles.instruction}>{challenge.instruction}</Text>

      <Pressable
        style={[styles.tapBtn, disabled && styles.disabledBtn]}
        onPress={handleTap}
        disabled={disabled}
      >
        <Text style={styles.tapText}>
          {disabled ? 'DONE!' : 'TAP!'}
        </Text>
      </Pressable>

      <Text style={styles.progress}>
        {counter} / {challenge.target}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  challengeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2DD881',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  tapBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#2DD881',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disabledBtn: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  tapText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  progress: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
});
