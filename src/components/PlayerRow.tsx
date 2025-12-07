import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { GamePlayer } from '../types/challenge';

// TODO: Outsource bomb icon
const BOMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><g fill="#d35400"><path d="M17.981 2.353a.558.558 0 0 1 1.038 0l.654 1.66c.057.143.17.257.315.314l1.659.654c.47.186.47.852 0 1.038l-1.66.654a.56.56 0 0 0-.314.315l-.654 1.659a.558.558 0 0 1-1.038 0l-.654-1.66a.56.56 0 0 0-.315-.314l-1.659-.654a.558.558 0 0 1 0-1.038l1.66-.654a.56.56 0 0 0 .314-.315z"/><path fill-rule="evenodd" d="M17 14.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0m-5 2.25a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5zm2-4.25c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5.448-1.5 1-1.5 1 .672 1 1.5M9 14c.552 0 1-.672 1-1.5S9.552 11 9 11s-1 .672-1 1.5.448 1.5 1 1.5" clip-rule="evenodd"/><path d="m16.767 8.294-.75.75a8.6 8.6 0 0 0-1.06-1.061l.75-.75.76.3z"/></g></svg>`;

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
      {player.hasBomb && (
        <View style={styles.bombContainer}>
          <SvgXml xml={BOMB_SVG} width={24} height={24} />
        </View>
      )}
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
  bombContainer: {
    marginLeft: 10,
  },
  nextRecipient: {
    backgroundColor: 'red',
  },
});

export default PlayerRow;
