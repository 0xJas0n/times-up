import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Challenge, CompassChallenge as CompassChallengeType } from '../../data/challenges';
import { Magnetometer } from 'expo-sensors';

export interface ChallengeProps {
  challenge: Challenge;
  onComplete: () => void;
  disabled: boolean;
}

export const CompassChallenge: React.FC<ChallengeProps> = ({ challenge, onComplete, disabled }) => {
  const compassChallenge = challenge as CompassChallengeType;
  const [heading, setHeading] = useState(0);
  const [isCorrectDirection, setIsCorrectDirection] = useState(false);
  const [progress, setProgress] = useState(0);

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
    let interval: NodeJS.Timeout;

    if (isCorrectDirection && !disabled) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100;
          if (newProgress >= 2000) { // Hold for 2 seconds
            onComplete();
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
  }, [isCorrectDirection, disabled]);

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

      <View style={styles.compassContainer}>
        <View style={[
          styles.compass,
          { transform: [{ rotate: `${-heading}deg` }] }
        ]}>
          <View style={styles.needle}>
            <View style={styles.needleNorth} />
            <View style={styles.needleSouth} />
          </View>
          <Text style={styles.northLabel}>N</Text>
          <Text style={styles.eastLabel}>E</Text>
          <Text style={styles.southLabel}>S</Text>
          <Text style={styles.westLabel}>W</Text>
        </View>
      </View>

      <View style={styles.targetContainer}>
        <Text style={[
          styles.targetDirection,
          isCorrectDirection && styles.targetDirectionActive
        ]}>
          {getDirectionIcon()}
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
        {isCorrectDirection ? 'Hold steady!' : 'Keep turning...'}
      </Text>

      <Text style={styles.headingText}>
        {Math.round(heading)}°
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
  compassContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compass: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: '#2DD881',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  needle: {
    position: 'absolute',
    width: 4,
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  needleNorth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF4444',
  },
  needleSouth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#666',
  },
  northLabel: {
    position: 'absolute',
    top: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  eastLabel: {
    position: 'absolute',
    right: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  southLabel: {
    position: 'absolute',
    bottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  westLabel: {
    position: 'absolute',
    left: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  targetContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  targetDirection: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#666',
  },
  targetDirectionActive: {
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
  headingText: {
    fontSize: 18,
    color: '#999',
  },
});
