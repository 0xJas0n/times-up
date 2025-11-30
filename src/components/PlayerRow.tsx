import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { GamePlayer } from '../types/challenge';

interface PlayerRowProps {
  player: GamePlayer;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, index, isFirst, isLast }) => {
  const translateY = useRef(new Animated.Value(index * 60)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: index * 60,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [index, translateY]);

  const animatedStyle = {
    transform: [{ translateY }],
  };

  return (
    <Animated.View
      style={[
        styles.playerRow,
        animatedStyle,
        player.isNextRecipient && styles.nextRecipient,
        isFirst && styles.firstPlayer,
        isLast && styles.lastPlayer,
      ]}
    >
      <Text style={styles.rank}>{player.currentRank}</Text>
      <Text style={styles.name}>{player.name}</Text>
      {player.hasBomb && <Text style={styles.bomb}>💣</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    height: 58,
    position: 'absolute',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  firstPlayer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lastPlayer: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    flex: 1,
  },
  bomb: {
    fontSize: 24,
    marginLeft: 10,
  },
  nextRecipient: {
    backgroundColor: 'red',
  },
});

export default PlayerRow;
