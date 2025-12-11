import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Challenge, TapSequenceChallenge as TapSequenceChallengeType } from '../../data/challenges';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: () => void;
  disabled: boolean;
}

export const TapSequenceChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const sequenceChallenge = challenge as TapSequenceChallengeType;
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(true);
  const [highlightedButton, setHighlightedButton] = useState<number | null>(null);
  const [isWrong, setIsWrong] = useState(false);

  // Generate random sequence on mount
  useEffect(() => {
    const newSequence: number[] = [];
    for (let i = 0; i < sequenceChallenge.sequenceLength; i++) {
      newSequence.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSequence);
  }, [sequenceChallenge.sequenceLength]);

  // Show sequence animation
  useEffect(() => {
    if (sequence.length === 0) return;

    let timeoutIds: NodeJS.Timeout[] = [];

    const showSequence = async () => {
      setShowingSequence(true);

      for (let i = 0; i < sequence.length; i++) {
        const timeoutId = setTimeout(() => {
          setHighlightedButton(sequence[i]);
        }, i * 800);
        timeoutIds.push(timeoutId);

        const clearTimeoutId = setTimeout(() => {
          setHighlightedButton(null);
        }, i * 800 + 400);
        timeoutIds.push(clearTimeoutId);
      }

      const finalTimeout = setTimeout(() => {
        setShowingSequence(false);
      }, sequence.length * 800 + 500);
      timeoutIds.push(finalTimeout);
    };

    showSequence();

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [sequence]);

  const handleButtonPress = (index: number) => {
    if (showingSequence || disabled || isWrong) return;

    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    // Check if the tap is correct
    if (sequence[newUserSequence.length - 1] !== index) {
      setIsWrong(true);
      return;
    }

    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  };

  const getButtonStyle = (index: number) => {
    if (highlightedButton === index) {
      return [styles.button, styles.highlightedButton];
    }
    if (isWrong && userSequence[userSequence.length - 1] === index) {
      return [styles.button, styles.wrongButton];
    }
    return styles.button;
  };

  const getButtonColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F'];
    return colors[index];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.challengeTitle}>{sequenceChallenge.title}</Text>
      <Text style={styles.instruction}>
        {showingSequence ? 'Watch the pattern...' : sequenceChallenge.instruction}
      </Text>

      <View style={styles.progressContainer}>
        <Text style={styles.progress}>
          {isWrong ? 'Wrong!' : `${userSequence.length} / ${sequence.length}`}
        </Text>
      </View>

      <View style={styles.buttonGrid}>
        {[0, 1, 2, 3].map((index) => (
          <Pressable
            key={index}
            style={[
              getButtonStyle(index),
              { backgroundColor: getButtonColor(index) }
            ]}
            onPress={() => handleButtonPress(index)}
            disabled={showingSequence || disabled || isWrong}
          >
            <Text style={styles.buttonText}>{index + 1}</Text>
          </Pressable>
        ))}
      </View>

      {isWrong && (
        <Text style={styles.feedback}>Try again next time!</Text>
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
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  progress: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  highlightedButton: {
    transform: [{ scale: 1.1 }],
    elevation: 10,
    shadowOpacity: 0.6,
  },
  wrongButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
  feedback: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 10,
  },
});
