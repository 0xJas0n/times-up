import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Challenge } from '../../data/challenges';
import { ChallengeRenderer } from '../challenges/ChallengeRenderer';
import { ChallengeTimer } from '../challenges/ChallengeTimer';
import { SpectatorView } from './SpectatorView';

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
    <View style={styles.activeChallenge}>
      {isEliminated ? (
        <SpectatorView />
      ) : (
        <>
          <ChallengeRenderer
            challenge={challenge}
            onComplete={onComplete}
            disabled={isFinished}
          />
          <ChallengeTimer />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  activeChallenge: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
});
