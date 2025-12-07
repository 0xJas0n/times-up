import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Challenge } from '../../data/challenges';
import { TapChallenge, ChallengeProps } from './TapChallenge';

interface ChallengeRendererProps {
  challenge: Challenge | null;
  onComplete: () => void;
  disabled: boolean;
}

export const ChallengeRenderer: React.FC<ChallengeRendererProps> = ({
  challenge,
  onComplete,
  disabled,
}) => {
  if (!challenge) {
    return null;
  }

  // Map challenge types to their respective components
  const challengeComponents: Record<string, React.FC<ChallengeProps>> = {
    TAP: TapChallenge,
    // Add new challenge types here:
    // SHAKE: ShakeChallenge,
    // SWIPE: SwipeChallenge,
    // etc.
  };

  const ChallengeComponent = challengeComponents[challenge.type];

  if (!ChallengeComponent) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          Unknown challenge type: {challenge.type}
        </Text>
      </View>
    );
  }

  return (
    <ChallengeComponent
      challenge={challenge}
      onComplete={onComplete}
      disabled={disabled}
    />
  );
};

const styles = StyleSheet.create({
  error: {
    padding: 20,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
