import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Challenge, MathChallenge as MathChallengeType } from '../../data/challenges';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: (isCorrect?: boolean, customDeltaTime?: number) => void;
  disabled: boolean;
}

export const MathChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const mathChallenge = challenge as MathChallengeType;
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);

  // Shuffle answers on mount
  useEffect(() => {
    const allAnswers = [
      mathChallenge.correctAnswer,
      ...mathChallenge.wrongAnswers,
    ];
    // Fisher-Yates shuffle
    const shuffled = [...allAnswers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledAnswers(shuffled);
  }, [mathChallenge]);

  const handleAnswerPress = (answer: string) => {
    if (disabled || selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === mathChallenge.correctAnswer;

    // Answer is locked in - complete after brief feedback regardless of correctness
    setTimeout(() => {
      onComplete(isCorrect);
    }, 300);
  };

  const getButtonStyle = (answer: string) => {
    if (selectedAnswer === null) {
      return styles.answerBtn;
    }

    if (answer === mathChallenge.correctAnswer) {
      return [styles.answerBtn, styles.correctBtn];
    }

    if (answer === selectedAnswer) {
      return [styles.answerBtn, styles.wrongBtn];
    }

    return [styles.answerBtn, styles.fadedBtn];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.challengeTitle}>{mathChallenge.title}</Text>
      <Text style={styles.instruction}>{mathChallenge.instruction}</Text>

      <View style={styles.questionContainer}>
        <Text style={styles.question}>{mathChallenge.question}</Text>
      </View>

      <View style={styles.answersGrid}>
        {shuffledAnswers.map((answer, index) => (
          <Pressable
            key={index}
            style={getButtonStyle(answer)}
            onPress={() => handleAnswerPress(answer)}
            disabled={disabled || selectedAnswer !== null}
          >
            <Text style={styles.answerText}>{answer}</Text>
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
    gap: 12,
    width: '100%',
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2DD881',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginBottom: 8,
  },
  question: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingHorizontal: 10,
  },
  answerBtn: {
    width: '45%',
    minWidth: 120,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#2DD881',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  correctBtn: {
    backgroundColor: '#00C853',
  },
  wrongBtn: {
    backgroundColor: '#D32F2F',
  },
  fadedBtn: {
    opacity: 0.3,
  },
  answerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});
