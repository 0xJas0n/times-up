import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Challenge } from '../../data/challenges';
import { ChallengeRenderer } from '../challenges/ChallengeRenderer';
import { ChallengeTimer } from '../challenges/ChallengeTimer';
import { SpectatorView } from './SpectatorView';
import { colors } from '../../theme/colors';

interface ChallengeViewProps {
  challenge: Challenge;
  isEliminated: boolean;
  isFinished: boolean;
  onComplete: (isCorrect: boolean, customDeltaTime?: number) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  challenge,
  isEliminated,
  isFinished,
  onComplete,
}) => {
  return (
    <View style={styles.wrapper}>
      {isEliminated ? (
        <SpectatorView />
      ) : (
        <>
          {/* Header (title + instruction) at top */}
          <View style={styles.header}>
            <Text style={styles.title}>{challenge.title}</Text>
            <Text style={styles.instruction}>{challenge.instruction}</Text>
          </View>

          {/* Centered challenge content */}
          <View style={styles.centerContent}>
            <ChallengeRenderer
              challenge={challenge}
              onComplete={onComplete}
              disabled={isFinished}
            />
          </View>

          {/* Timer/progress anchored at bottom */}
          <View style={styles.footer}>
            <ChallengeTimer />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
