import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Player } from './RoomScreen';
import { ChallengeProgress, GamePlayer } from '../types/challenge';
import Leaderboard from '../components/Leaderboard';
import { PatternBackground } from '../components/PatternBackground';
import { debounce } from 'lodash';

type RootStackParamList = {
  Room: { roomCode: string; username: string; players: Player[] };
  Game: { roomCode: string; username: string; players: Player[] };
  Home: undefined;
};

type GameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

const GameScreen = ({ route, navigation }: GameScreenProps) => {
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

  const handleLeave = () => {
    Alert.alert('Leave Game', 'Are you sure you want to leave the game?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Leave',
        onPress: () => navigation.navigate('Home'),
        style: 'destructive',
      },
    ]);
  };

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
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={handleLeave}>
            <Text style={styles.leaveButtonText}>Leave</Text>
          </Pressable>
        </View>
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
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 10,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
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
