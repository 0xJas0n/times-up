import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Challenge, ReactionChallenge as ReactionChallengeType } from '../../data/challenges';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: () => void;
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
      // Pressed too early
      setTooEarly(true);
      return;
    }

    if (showGreen && !reactionTime) {
      const endTime = Date.now();
      const reaction = endTime - startTime;
      setReactionTime(reaction);

      setTimeout(() => {
        onComplete();
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
    if (showGreen) return 'TAP NOW!';
    return 'Wait for green...';
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
      <Text style={styles.challengeTitle}>{reactionChallenge.title}</Text>
      <Text style={styles.instruction}>{reactionChallenge.instruction}</Text>

      <Pressable
        style={[
          styles.reactionButton,
          { backgroundColor: getBackgroundColor() }
        ]}
        onPress={handlePress}
        disabled={disabled || tooEarly || !!reactionTime}
      >
        <Text style={styles.emoji}>{getEmoji()}</Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </Pressable>

      {reactionTime && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {reactionTime < 200 ? 'Lightning fast!' :
             reactionTime < 300 ? 'Impressive!' :
             reactionTime < 400 ? 'Good reflexes!' :
             'Not bad!'}
          </Text>
        </View>
      )}

      {tooEarly && (
        <View style={styles.resultContainer}>
          <Text style={styles.errorText}>
            Wait for the color to change!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
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
  reactionButton: {
    width: 280,
    height: 280,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginVertical: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2DD881',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
  },
});
