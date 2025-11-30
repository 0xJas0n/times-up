import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Player } from './RoomScreen';
import { ChallengeProgress, GamePlayer } from '../types/challenge';
import Leaderboard from '../components/Leaderboard';
import { debounce } from 'lodash';

type RootStackParamList = {
  Room: { roomCode: string; username: string; players: Player[] };
  Game: { roomCode: string; username: string; players: Player[] };
};

type GameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

const GameScreen = ({ route }: GameScreenProps) => {
  const { players: initialPlayers } = route.params;
  const [players, setPlayers] = useState<GamePlayer[]>(() =>
    initialPlayers.map((p, index) => ({
      ...p,
      currentRank: index + 1,
      score: 0,
      hasBomb: false,
      isNextRecipient: false,
    }))
  );

  const throttledUpdates = useRef<{ [key: string]: ChallengeProgress }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateRankings = useCallback(() => {
    setPlayers((prevPlayers) => {
      const sortedPlayers = [...prevPlayers].sort((a, b) => {
        const aProgress = throttledUpdates.current[a.id] || { isComplete: false, customRank: Infinity, timestamp: Infinity };
        const bProgress = throttledUpdates.current[b.id] || { isComplete: false, customRank: Infinity, timestamp: Infinity };

        if (aProgress.isComplete && !bProgress.isComplete) return -1;
        if (!aProgress.isComplete && bProgress.isComplete) return 1;

        if (aProgress.customRank !== bProgress.customRank) {
          return (aProgress.customRank || Infinity) - (bProgress.customRank || Infinity);
        }

        return aProgress.timestamp - bProgress.timestamp;
      });

      return sortedPlayers.map((p, index) => ({ ...p, currentRank: index + 1 }));
    });
  }, []);

  const debouncedCalculateRankings = useRef(debounce(calculateRankings, 50)).current;

  const handleProgressUpdate = (progress: ChallengeProgress) => {
    throttledUpdates.current[progress.playerId] = progress;
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        const updates = { ...throttledUpdates.current };
        throttledUpdates.current = {};
        timeoutRef.current = null;

        setPlayers((prevPlayers) => {
          const newPlayers = [...prevPlayers];
          Object.values(updates).forEach((update) => {
            const playerIndex = newPlayers.findIndex((p) => p.id === update.playerId);
            if (playerIndex !== -1) {
              // Apply updates
              newPlayers[playerIndex].score += update.isCorrect ? 10 : 0;
            }
          });
          return newPlayers;
        });

        debouncedCalculateRankings();

      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.leaderboardContainer}>
          <Leaderboard players={players} />
        </View>
        <View style={styles.challengeContainer}>
          <Text style={styles.challengeText}>Challenge Area</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardContainer: {
    flex: 1,
  },
  leaderboardText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  challengeContainer: {
    flex: 2,
  },
  challengeText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
});

export default GameScreen;
