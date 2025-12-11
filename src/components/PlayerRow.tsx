import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { GamePlayer } from '../types/challenge';
import BombIcon from '../assets/bomb-orange.svg';
import { colors } from '../theme/colors';

interface PlayerRowProps {
  player: GamePlayer;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isEliminated?: boolean;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, index, isFirst, isLast, isEliminated = false }) => {
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
        isEliminated && styles.eliminatedPlayer,
      ]}
    >
      <Text style={[styles.rank, isEliminated && styles.eliminatedText]}>{player.currentRank}</Text>
      <Text style={[styles.name, isEliminated && styles.eliminatedText]}>
        {player.name} {isEliminated && '(ELIMINATED)'}
      </Text>
      {player.hasBomb && !isEliminated && (
        <View style={styles.bombContainer}>
          <BombIcon width={24} height={24} />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    padding: 10,
    height: 58,
    position: 'absolute',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.mediumGray,
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
    color: colors.textDark,
  },
  name: {
    fontSize: 18,
    flex: 1,
    color: colors.textDark,
  },
  bombContainer: {
    marginLeft: 10,
  },
  nextRecipient: {
    backgroundColor: colors.warning,
  },
  eliminatedPlayer: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  eliminatedText: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
});

export default PlayerRow;
