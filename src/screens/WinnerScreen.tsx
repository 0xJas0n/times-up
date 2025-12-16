import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatternBackground } from '../components/PatternBackground';
import { useGameConnection } from '../hooks/useGameConnection';
import { colors } from '../theme/colors';

type RootStackParamList = {
  Home: undefined;
  Winner: { winnerName: string };
};

type WinnerScreenProps = NativeStackScreenProps<RootStackParamList, 'Winner'>;

const WinnerScreen = ({ route, navigation }: WinnerScreenProps) => {
  const { winnerName } = route.params;
  const { disconnect } = useGameConnection();

  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(Math.random() * 400 - 200),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Disconnect immediately - we're done with the network
    // No need to delay, we're already on the winner screen
    disconnect();

    // Winner text pop-in animation
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Confetti falling animation
    confettiAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: 800,
          duration: 3000 + Math.random() * 2000,
          delay: i * 100,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    });
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <PatternBackground speed={15} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        {/* Confetti */}
        {confettiAnims.map((anim, i) => {
          const rotateConfetti = anim.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];
          const color = colors[i % colors.length];

          return (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  backgroundColor: color,
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { rotate: rotateConfetti },
                  ],
                },
              ]}
            />
          );
        })}

        <View style={styles.content}>
          {/* Trophy/Crown Animation */}
          <Animated.View
            style={[
              styles.crownContainer,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <Text style={styles.crownEmoji}>👑</Text>
          </Animated.View>

          {/* Winner Text */}
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text style={styles.winnerTitle}>WINNER!</Text>
            <Text style={styles.winnerName}>{winnerName}</Text>
          </Animated.View>

          {/* Celebration Emojis */}
          <View style={styles.emojiRow}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.emoji}>🏆</Text>
            <Text style={styles.emoji}>🎊</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleHome}
              style={({ pressed }) => [
                styles.homeButton,
                pressed && styles.homeButtonPressed,
              ]}
            >
              <Text style={styles.homeButtonText}>Home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    top: 0,
    borderRadius: 2,
  },
  crownContainer: {
    marginBottom: 20,
  },
  crownEmoji: {
    fontSize: 100,
  },
  winnerTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  winnerName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 50,
  },
  emoji: {
    fontSize: 50,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  homeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  homeButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default WinnerScreen;
