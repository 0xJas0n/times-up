import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Player } from './RoomScreen';
import { ChallengeProgress, GamePlayer } from '../types/challenge';
import Leaderboard from '../components/Leaderboard';
import { PatternBackground } from '../components/PatternBackground';
import { debounce } from 'lodash';
import { useGameConnection } from "../hooks/useGameConnection";
import { CHALLENGES, Challenge, getRandomChallengeID } from "../data/challenges";

type RootStackParamList = {
  Room: { roomCode: string; username: string; players: Player[] };
  Game: { roomCode: string; username: string; isHost: boolean; players: Player[] };
  Home: undefined;
};

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

const GameScreen = ({ route, navigation }: GameScreenProps) => {
  const { roomCode, username, isHost, players: initialPlayers } = route.params;
  const { broadcastGameState, sendGameAction, lastMessage, disconnect, clearLastMessage } = useGameConnection();

  // Clear stale messages on mount
  useEffect(() => {
    clearLastMessage();
  }, []);

  const [players, setPlayers] = useState<GamePlayer[]>(() =>
    initialPlayers.map((p, index) => ({
      ...p,
      currentRank: index + 1,
      score: 0,
      hasBomb: false,
      isNextRecipient: false,
    }))
  );

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [statusText, setStatusText] = useState('Get Ready...');
  const [bombHolder, setBombHolder] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const throttledUpdates = useRef<{ [key: string]: ChallengeProgress }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishedPlayers = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isHost) {
      setTimeout(() => startNewRound(), 3000);
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type === 'ROUND_START') {
      startClientRound(lastMessage.id);
    }
    else if (lastMessage.type === 'ROUND_OVER') {
      endClientRound(lastMessage.loser);
    }

    if (isHost && lastMessage.type === 'PLAYER_FINISHED') {
      handlePlayerFinished(lastMessage.name);
    }
  }, [lastMessage]);

  const startNewRound = () => {
    const nextId = getRandomChallengeID();
    finishedPlayers.current.clear();

    broadcastGameState('START_ROUND', { id:nextId });
    startClientRound(nextId);
  };

  const handlePlayerFinished = (playerName: string) => {
    if (finishedPlayers.current.has(playerName)) {
      return;
    }

    finishedPlayers.current.add(playerName);
    console.log(`Player finished: ${playerName} (${finishedPlayers.current.size}/${players.length})`);

    if (finishedPlayers.current.size === players.length) {
      endRound(playerName);
    }
  };

  const endRound = (loserName: string) => {
    broadcastGameState('ROUND_OVER', { loser: loserName });
    endClientRound(loserName);

    setTimeout(() => startNewRound(), 5000);
  }

  const startClientRound = (challengeId: number) => {
    const challenge = CHALLENGES[challengeId];

    if (challenge) {
      setCurrentChallenge(challenge);
      setCounter(0);
      setIsFinished(false);
      setStatusText(challenge.instruction);
      setBombHolder(null);
    }
  };

  const endClientRound = (loser: string) => {
    setCurrentChallenge(null);
    setBombHolder(loser);
    setStatusText(`${loser} got the BOMB!`);

    setPlayers(prev => prev.map(p => ({
      ...p,
      hasBomb: p.name === loser
    })));
  };

  const handleAction = () => {
    if (!currentChallenge || isFinished) {
      return;
    }

    if (currentChallenge.type === 'TAP') {
      const newVal = counter + 1;
      setCounter(newVal);
      if (newVal >= (currentChallenge.target || 10)) {
        finishChallenge();
      }
    }
    // TODO: Add other challenge types
    // TODO: Component for each challenge type
  };

  const finishChallenge = () => {
    setIsFinished(true);
    setStatusText('Waiting for others...');

    sendGameAction('FINISHED', { name: username });

    if (isHost) {
      handlePlayerFinished(username);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Game', 'Are you sure you want to leave the game?', [
      { text: 'Cancel', style: 'cancel', },
      { text: 'Leave', onPress: async () => {
        await disconnect();
        navigation.navigate('Home');
      }, style: 'destructive', },
    ]);
  };

  const calculateRankings = useCallback(() => {
    setPlayers((prevPlayers) => {
      // const sortedPlayers = [...prevPlayers].sort((a, b) => {
        // const aProgress = throttledUpdates.current[a.id] || { isComplete: false, customRank: Infinity, timestamp: Infinity };
        // const bProgress = throttledUpdates.current[b.id] || { isComplete: false, customRank: Infinity, timestamp: Infinity };

        // if (aProgress.isComplete && !bProgress.isComplete) return -1;
        // if (!aProgress.isComplete && bProgress.isComplete) return 1;

        // if (aProgress.customRank !== bProgress.customRank) {
          // return (aProgress.customRank || Infinity) - (bProgress.customRank || Infinity);
        // }

        // return aProgress.timestamp - bProgress.timestamp;
      // });

      // return sortedPlayers.map((p, index) => ({ ...p, currentRank: index + 1 }));

      // TODO: Simple ranking logic for now
      return prevPlayers;
    });
  }, []);


  // const handleProgressUpdate = (progress: ChallengeProgress) => {
    // throttledUpdates.current[progress.playerId] = progress;
  // if (!timeoutRef.current) {
     // timeoutRef.current = setTimeout(() => {
       // const updates = { ...throttledUpdates.current };
        // throttledUpdates.current = {};
        // timeoutRef.current = null;

        // setPlayers((prevPlayers) => {
          // const newPlayers = [...prevPlayers];
          // Object.values(updates).forEach((update) => {
            // const playerIndex = newPlayers.findIndex((p) => p.id === update.playerId);
            // if (playerIndex !== -1) {
              // Apply updates
              // newPlayers[playerIndex].score += update.isCorrect ? 10 : 0;
            // }
          // });
          // return newPlayers;
        // });

        // debouncedCalculateRankings();
      // }, 100);
    // }
  // };

  return (
    <View style={styles.container}>
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleLeave}>
            <Text style={styles.leaveButtonText}>Leave</Text>
          </Pressable>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardContainer}>
          <Leaderboard players={players} />
        </View>

        {/* Game Interaction Section (added completley) */}
        <View style={styles.challengeContainer}>
          {bombHolder ? (
              <View style={styles.centerBox}>
                <Text style={styles.bombText}>💣</Text>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
          ) : currentChallenge ? (
              <View style={styles.activeChallenge}>
                <Text style={styles.challengeTitle}>{currentChallenge.title}</Text>
                <Text style={styles.instruction}>{currentChallenge.instruction}</Text>
                {currentChallenge.type === 'TAP' && (
                    <Pressable
                        style={[styles.tapBtn, isFinished && styles.disabledBtn]}
                        onPress={handleAction}
                        disabled={isFinished}
                    >
                      <Text style={styles.tapText}>
                        {isFinished ? 'DONE!' : 'TAP!'}
                      </Text>
                    </Pressable>
                )}
                <Text style={styles.progress}>
                  {counter} / {currentChallenge.target}
                </Text>
              </View>
          ) : (
              <Text style={styles.statusText}>{statusText}</Text>
          )}
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
  challengeContainer: {
    flex: 2,
    backgroundColor: 'rgba(30, 31, 59, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChallenge: {
    width: '100%',
    alignItems: 'center',
  },
  challengeTitle: {
    color: '#2DD881',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    color: 'white',
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  tapBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  disabledBtn: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
  tapText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  progress: {
    color: '#94A3B8',
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bombText: {
    fontSize: 80,
    marginBottom: 20,
  },
  centerBox: {
    alignItems: 'center',
  },
});

export default GameScreen;
