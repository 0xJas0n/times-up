import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Challenge, ReactionChallenge as ReactionChallengeType } from '../../data/challenges';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: (isCorrect?: boolean, customDeltaTime?: number) => void;
  disabled: boolean;
}

export const ReactionChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const reactionChallenge = challenge as ReactionChallengeType;
  const [isWaiting, setIsWaiting] = useState(true);
  const [showGreen, setShowGreen] = useState(false);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [tooEarly, setTooEarly] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const waitTime = Math.random() * (reactionChallenge.waitTimeMax - reactionChallenge.waitTimeMin) + reactionChallenge.waitTimeMin;

    const timeout = setTimeout(() => {
      setIsWaiting(false);
      setShowGreen(true);
      setStartTime(Date.now());
    }, waitTime);

    return () => clearTimeout(timeout);
  }, [disabled]);

  const handlePress = () => {
    if (disabled) return;

    if (isWaiting) {
      // Pressed too early - give them a huge penalty time so they definitely lose
      setTooEarly(true);
      onComplete(false, 999999); // Massive penalty time
      return;
    }

    if (showGreen && !reactionTime) {
      const endTime = Date.now();
      const reaction = endTime - startTime;
      setReactionTime(reaction);

      setTimeout(() => {
        onComplete(true, reaction); // Pass reaction time as customDeltaTime
      }, 1000);
    }
  };

  const getBackgroundColor = () => {
    if (tooEarly) return '#FF4444';
    if (showGreen) return '#2DD881';
    return '#FF6B6B';
  };

  const getStatusText = () => {
    if (tooEarly) return 'Too Early!';
    if (reactionTime) return `${reactionTime}ms`;
    if (showGreen) return 'Tap!';
    return 'Wait!';
  };

  const getEmoji = () => {
    if (tooEarly) return '❌';
    if (!reactionTime) return '⏱️';
    if (reactionTime < 200) return '⚡';
    if (reactionTime < 300) return '🔥';
    if (reactionTime < 400) return '✨';
    return '👍';
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.reactionButton,
          { backgroundColor: getBackgroundColor() }
        ]}
        onPress={handlePress}
        disabled={disabled || tooEarly || !!reactionTime}
      >
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  reactionButton: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginVertical: 10,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2DD881',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
  },
});
