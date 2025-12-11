import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Challenge, TiltChallenge as TiltChallengeType } from '../../data/challenges';
import { Accelerometer } from 'expo-sensors';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: () => void;
  disabled: boolean;
}

export const TiltChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const tiltChallenge = challenge as TiltChallengeType;
  const [tiltData, setTiltData] = useState({ x: 0, y: 0, z: 0 });
  const [progress, setProgress] = useState(0);
  const [isCorrectAngle, setIsCorrectAngle] = useState(false);

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
    let interval: NodeJS.Timeout;

    if (isCorrectAngle && !disabled) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100;
          if (newProgress >= tiltChallenge.holdDuration) {
            onComplete();
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
  }, [isCorrectAngle, disabled]);

  const checkCorrectAngle = (data: { x: number; y: number; z: number }): boolean => {
    const threshold = 0.5;

    switch (tiltChallenge.targetAngle) {
      case 'left':
        return data.x < -threshold;
      case 'right':
        return data.x > threshold;
      case 'forward':
        return data.y < -threshold;
      case 'backward':
        return data.y > threshold;
      default:
        return false;
    }
  };

  const getAngleIcon = () => {
    switch (tiltChallenge.targetAngle) {
      case 'left':
        return '←';
      case 'right':
        return '→';
      case 'forward':
        return '↑';
      case 'backward':
        return '↓';
      default:
        return '•';
    }
  };

  const progressPercentage = (progress / tiltChallenge.holdDuration) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.challengeTitle}>{tiltChallenge.title}</Text>
      <Text style={styles.instruction}>{tiltChallenge.instruction}</Text>

      <View style={styles.angleIndicator}>
        <Text style={[
          styles.angleIcon,
          isCorrectAngle && styles.angleIconActive
        ]}>
          {getAngleIcon()}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercentage}%` }
          ]}
        />
      </View>

      <Text style={styles.status}>
        {isCorrectAngle ? 'Hold it!' : 'Tilt to the correct angle'}
      </Text>

      <Text style={styles.debugText}>
        {Math.round(progressPercentage)}%
      </Text>
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
  angleIndicator: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  angleIcon: {
    fontSize: 80,
    color: '#666',
  },
  angleIconActive: {
    color: '#2DD881',
  },
  progressBarContainer: {
    width: '80%',
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2DD881',
    borderRadius: 15,
  },
  status: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
});
