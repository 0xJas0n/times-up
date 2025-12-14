import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Challenge, CompassChallenge as CompassChallengeType } from '../../data/challenges';
import { Magnetometer } from 'expo-sensors';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: (isCorrect?: boolean, customDeltaTime?: number) => void;
  disabled: boolean;
}

export const CompassChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const compassChallenge = challenge as CompassChallengeType;
  const [heading, setHeading] = useState(0);
  const [isCorrectDirection, setIsCorrectDirection] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let subscription: any;

    const startMagnetometer = async () => {
      const isAvailable = await Magnetometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Magnetometer not available');
        return;
      }

      Magnetometer.setUpdateInterval(100);
      subscription = Magnetometer.addListener((data) => {
        // Calculate heading from magnetometer data
        const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        const normalizedHeading = (angle + 360) % 360;
        setHeading(normalizedHeading);

        const correct = checkCorrectDirection(normalizedHeading);
        setIsCorrectDirection(correct);
      });
    };

    startMagnetometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Track progress when pointing in correct direction
  useEffect(() => {
    if (isComplete) return; // Don't update progress once complete

    let interval: NodeJS.Timeout;

    if (isCorrectDirection && !disabled) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100;
          if (newProgress >= 2000) { // Hold for 2 seconds
            return 2000;
          }
          return newProgress;
        });
      }, 100);
    } else {
      setProgress((prev) => Math.max(0, prev - 50));
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCorrectDirection, disabled, isComplete]);

  // Check if challenge is complete
  useEffect(() => {
    if (progress >= 2000 && !disabled && !isComplete) {
      setIsComplete(true);
      onComplete(true);
    }
  }, [progress, disabled, isComplete]);

  const checkCorrectDirection = (currentHeading: number): boolean => {
    const targetHeading = getTargetHeading();
    const tolerance = compassChallenge.tolerance;

    let diff = Math.abs(currentHeading - targetHeading);
    if (diff > 180) {
      diff = 360 - diff;
    }

    return diff <= tolerance;
  };

  const getTargetHeading = (): number => {
    switch (compassChallenge.targetDirection) {
      case 'north':
        return 0;
      case 'east':
        return 90;
      case 'south':
        return 180;
      case 'west':
        return 270;
      default:
        return 0;
    }
  };

  const getDirectionIcon = () => {
    switch (compassChallenge.targetDirection) {
      case 'north':
        return 'N ↑';
      case 'south':
        return 'S ↓';
      case 'east':
        return 'E →';
      case 'west':
        return 'W ←';
      default:
        return 'N';
    }
  };

  const progressPercentage = (progress / 2000) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.challengeTitle}>{compassChallenge.title}</Text>
      <Text style={styles.instruction}>{compassChallenge.instruction}</Text>

      {/* Compass icon - stationary */}
      <View style={styles.compassContainer}>
        <View style={styles.compassCircle}>
          {/* Progress fill */}
          <View style={[
            styles.compassFill,
            {
              height: `${progressPercentage}%`,
              backgroundColor: isCorrectDirection ? '#2DD881' : '#666'
            }
          ]} />
        </View>
      </View>

      {/* Simple percentage display */}
      <Text style={styles.percentageText}>
        {Math.round(progressPercentage)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
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
  compassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  compassCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'white',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  compassFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
});
