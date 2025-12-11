import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { colors } from '../theme/colors';

interface PatternBackgroundProps {
  speed?: number;
  tileSize?: number;
  gap?: number;
}

const BombIcon: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G fill={colors.primary} opacity={0.3}>
      <Path d="M17.981 2.353a.558.558 0 0 1 1.038 0l.654 1.66c.057.143.17.257.315.314l1.659.654c.47.186.47.852 0 1.038l-1.66.654a.56.56 0 0 0-.314.315l-.654 1.659a.558.558 0 0 1-1.038 0l-.654-1.66a.56.56 0 0 0-.315-.314l-1.659-.654a.558.558 0 0 1 0-1.038l1.66-.654a.56.56 0 0 0 .314-.315z" />
      <Path
        fillRule="evenodd"
        d="M17 14.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0m-5 2.25a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5zm2-4.25c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5.448-1.5 1-1.5 1 .672 1 1.5M9 14c.552 0 1-.672 1-1.5S9.552 11 9 11s-1 .672-1 1.5.448 1.5 1 1.5"
        clipRule="evenodd"
      />
      <Path d="m16.767 8.294-.75.75a8.6 8.6 0 0 0-1.06-1.061l.75-.75.76.3z" />
    </G>
  </Svg>
);

export const PatternBackground: React.FC<PatternBackgroundProps> = ({
  speed = 30,
  tileSize = 80,
  gap = 0,
}) => {
  const translateAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const effectiveTileSize = tileSize + gap;

  useEffect(() => {
    const duration = speed * 1000; // convert to milliseconds

    Animated.loop(
      Animated.timing(translateAnim, {
        toValue: { x: effectiveTileSize, y: effectiveTileSize },
        duration,
        useNativeDriver: true,
      })
    ).start();
  }, [speed, effectiveTileSize]);

  const rows = Math.ceil(1000 / effectiveTileSize) + 2;
  const cols = Math.ceil(600 / effectiveTileSize) + 2;

  const tiles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push(
        <View
          key={`${row}-${col}`}
          style={[
            styles.tile,
            {
              top: row * effectiveTileSize - effectiveTileSize,
              left: col * effectiveTileSize - effectiveTileSize,
              width: tileSize,
              height: tileSize,
            },
          ]}
        >
          <BombIcon size={tileSize} />
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animatedGrid,
          {
            transform: [
              { translateX: translateAnim.x },
              { translateY: translateAnim.y },
            ],
          },
        ]}
      >
        {tiles}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  animatedGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
