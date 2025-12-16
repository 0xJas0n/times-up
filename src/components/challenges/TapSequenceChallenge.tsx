import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Challenge, TapSequenceChallenge as TapSequenceChallengeType } from '../../data/challenges';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: (isCorrect?: boolean, customDeltaTime?: number) => void;
  disabled: boolean;
}

export const TapSequenceChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const sequenceChallenge = challenge as TapSequenceChallengeType;
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(true);
  const [highlightedButton, setHighlightedButton] = useState<number | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startedShowing, setStartedShowing] = useState(false); // distinguish pre-delay vs showing

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
      const initialDelay = 700; // small delay before pattern starts showing
      const stepDuration = 800;
      const highlightDuration = 400;

      setStartedShowing(false); // entering pre-delay phase
      setShowingSequence(true);

      // mark when the pattern actually starts
      const startMark = setTimeout(() => {
        setStartedShowing(true);
      }, initialDelay);
      timeoutIds.push(startMark);

      for (let i = 0; i < sequence.length; i++) {
        const timeoutId = setTimeout(() => {
          setHighlightedButton(sequence[i]);
        }, initialDelay + i * stepDuration);
        timeoutIds.push(timeoutId);

        const clearTimeoutId = setTimeout(() => {
          setHighlightedButton(null);
        }, initialDelay + i * stepDuration + highlightDuration);
        timeoutIds.push(clearTimeoutId);
      }

      const finalTimeout = setTimeout(() => {
        setShowingSequence(false);
        setStartedShowing(false);
      }, initialDelay + sequence.length * stepDuration + 500);
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
      // Wrong answer - complete with false
      setTimeout(() => {
        onComplete(false);
      }, 300);
      return;
    }

    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      setIsCorrect(true);
      setTimeout(() => {
        onComplete(true);
      }, 300);
    }
  };

  const getButtonStyle = (index: number) => {
    const isClickable = !showingSequence && !disabled && !isWrong;
    if (highlightedButton === index) {
      return [styles.button, styles.highlightedButton];
    }
    if (isWrong && userSequence[userSequence.length - 1] === index) {
      return [styles.button, styles.wrongButton];
    }
    if (!isClickable) {
      return [styles.button, styles.inactiveButton];
    }
    return [styles.button, styles.activeButton];
  };

  const getButtonColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F'];
    return colors[index];
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progress}>
          {isWrong
            ? 'Wrong!'
            : isCorrect
            ? 'Correct!'
            : showingSequence
            ? startedShowing
              ? 'Watch the pattern...'
              : 'Get ready...'
            : `Your turn: ${userSequence.length} / ${sequence.length}`}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  progress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 15,
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
  inactiveButton: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },
  wrongButton: {
    opacity: 0.5,
  },
  activeButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
});
