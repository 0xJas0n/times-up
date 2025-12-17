import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface ChallengeTimerProps {}

const TIMER_DURATION = 15;
const YELLOW_THRESHOLD = 10;
const RED_THRESHOLD = 5;

type ColorState = 'green' | 'yellow' | 'red';

export const ChallengeTimer: React.FC<ChallengeTimerProps> = () => {
  const progressWidth = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const [colorState, setColorState] = useState<ColorState>('green');

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: 0,
      duration: TIMER_DURATION * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const yellowTimeout = setTimeout(() => {
      setColorState('yellow');
    }, (TIMER_DURATION - YELLOW_THRESHOLD) * 1000);

    const redTimeout = setTimeout(() => {
      setColorState('red');
    }, (TIMER_DURATION - RED_THRESHOLD) * 1000);

    return () => {
      clearTimeout(yellowTimeout);
      clearTimeout(redTimeout);
    };
  }, []);

  useEffect(() => {
    if (colorState === 'red') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1.0,
            duration: 250,
            useNativeDriver: false,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseOpacity.setValue(1);
      };
    } else {
      pulseOpacity.setValue(1);
    }
  }, [colorState]);

  const barColor = colorState === 'green' ? '#2DD881' : colorState === 'yellow' ? '#FFA500' : '#FF4444';

  const widthInterpolated = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barProgress,
            {
              backgroundColor: barColor,
              width: widthInterpolated,
              opacity: pulseOpacity,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 20,
  },
  barBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barProgress: {
    height: '100%',
    borderRadius: 3,
  },
});
