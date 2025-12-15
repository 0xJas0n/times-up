import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Text } from 'react-native';

interface ExplosionAnimationProps {
  playerName: string;
  onComplete: () => void;
}

export const ExplosionAnimation: React.FC<ExplosionAnimationProps> = ({ playerName, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    // Explosion boom animation
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.5,
        tension: 20,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Particles explosion
    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const distance = 150;

      Animated.parallel([
        Animated.timing(particle.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Fade out main explosion
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Explosion particles */}
      {particles.map((particle, i) => {
        const colors = ['#FF6B6B', '#FFD93D', '#FF8C42', '#FF4444', '#FFA500'];
        const color = colors[i % colors.length];

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: color,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        );
      })}

      {/* Main explosion */}
      <Animated.View
        style={[
          styles.explosionContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <Text style={styles.explosionEmoji}>💥</Text>
        <Text style={styles.explosionText}>BOOM!</Text>
        <Text style={styles.eliminatedText}>{playerName} is eliminated!</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  explosionContainer: {
    alignItems: 'center',
  },
  explosionEmoji: {
    fontSize: 150,
    marginBottom: 20,
  },
  explosionText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 68, 68, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  eliminatedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
