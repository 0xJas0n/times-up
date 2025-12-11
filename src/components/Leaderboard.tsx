import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { GamePlayer } from '../types/challenge';
import PlayerRow from './PlayerRow';

interface LeaderboardProps {
  players: GamePlayer[];
  eliminatedPlayers?: string[];
}
const ROW_HEIGHT = 50;

const Leaderboard: React.FC<LeaderboardProps> = ({ players, eliminatedPlayers = [] }) => {
  const sortedPlayers = [...players].sort((a, b) => a.currentRank - b.currentRank).slice(0, 6);
  const { height: screenHeight } = useWindowDimensions();

  const containerHeight = Math.min(
    sortedPlayers.length * ROW_HEIGHT,
    screenHeight * 0.4
  );

  return (
    <View style={[{ height: containerHeight }]}>
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

export default Leaderboard;
