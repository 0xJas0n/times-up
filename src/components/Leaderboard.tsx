import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GamePlayer } from '../types/challenge';
import PlayerRow from './PlayerRow';

interface LeaderboardProps {
  players: GamePlayer[];
  eliminatedPlayers?: string[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, eliminatedPlayers = [] }) => {
  const sortedPlayers = [...players].sort((a, b) => a.currentRank - b.currentRank).slice(0, 6);

  return (
    <View style={styles.container}>
      {sortedPlayers.map((player, index) => (
        <PlayerRow
          key={player.id}
          player={player}
          index={index}
          isFirst={index === 0}
          isLast={index === sortedPlayers.length - 1}
          isEliminated={eliminatedPlayers.includes(player.name)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60 * 6, // Height for 6 players
  },
});

export default Leaderboard;
