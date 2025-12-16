import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Challenge, TiltChallenge as TiltChallengeType } from '../../data/challenges';
import { Accelerometer } from 'expo-sensors';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: (isCorrect?: boolean, customDeltaTime?: number) => void;
  disabled: boolean;
}

export const TiltChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const tiltChallenge = challenge as TiltChallengeType;
  const [tiltData, setTiltData] = useState({ x: 0, y: 0, z: 0 });
  const [progress, setProgress] = useState(0);
  const [isCorrectAngle, setIsCorrectAngle] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let subscription: any;
    let progressInterval: NodeJS.Timeout;

    const startAccelerometer = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Accelerometer not available');
        return;
      }

      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener((accelerometerData) => {
        setTiltData(accelerometerData);

        const correct = checkCorrectAngle(accelerometerData);
        setIsCorrectAngle(correct);
      });
    };

    startAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, []);

  // Track progress when at correct angle
  useEffect(() => {
    if (isComplete) return; // Don't update progress once complete

    let interval: NodeJS.Timeout;

    if (isCorrectAngle && !disabled) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100;
          if (newProgress >= tiltChallenge.holdDuration) {
            return tiltChallenge.holdDuration;
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
  }, [isCorrectAngle, disabled, isComplete]);

  // Check if challenge is complete
  useEffect(() => {
    if (progress >= tiltChallenge.holdDuration && !disabled && !isComplete) {
      setIsComplete(true);
      onComplete(true);
    }
  }, [progress, tiltChallenge.holdDuration, disabled, isComplete]);

  const checkCorrectAngle = (data: { x: number; y: number; z: number }): boolean => {
    const threshold = 0.5;

    switch (tiltChallenge.targetAngle) {
      case 'left':
        return data.x > threshold;
      case 'right':
        return data.x < -threshold;
      case 'forward':
        return data.y < -threshold;
      case 'backward':
        return data.y > threshold;
      default:
        return false;
    }
  };

  const progressPercentage = (progress / tiltChallenge.holdDuration) * 100;

  return (
    <View style={styles.container}>
      {/* Phone icon - stationary */}
      <View style={styles.phoneContainer}>
        <View style={styles.phoneIcon}>
          {/* Phone outline */}
          <View style={styles.phoneOutline}>
            {/* Progress fill */}
            <View style={[
              styles.phoneFill,
              {
                height: `${progressPercentage}%`,
                backgroundColor: isCorrectAngle ? '#2DD881' : '#666'
              }
            ]} />
          </View>
        </View>
      </View>

      {/* Simple percentage display */}
      <Text style={[styles.percentageText, isComplete && styles.completeText]}>
        {isComplete ? 'Complete! ✓' : `${Math.round(progressPercentage)}%`}
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
  phoneContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  phoneIcon: {
    width: 100,
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  phoneOutline: {
    width: 100,
    height: 160,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: 'white',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  phoneFill: {
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
  completeText: {
    color: '#2DD881',
    fontSize: 32,
  },
});
