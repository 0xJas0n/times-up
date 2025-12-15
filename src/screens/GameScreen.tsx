import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { Player } from './RoomScreen';
import { ChallengeProgress, GamePlayer } from '../types/challenge';
import Leaderboard from '../components/Leaderboard';
import { PatternBackground } from '../components/PatternBackground';
import { debounce } from 'lodash';
import { useGameConnection } from "../hooks/useGameConnection";
import { CHALLENGES, Challenge, getRandomChallengeID } from "../data/challenges";
import { ChallengeRenderer } from '../components/challenges/ChallengeRenderer';
import { ChallengeTimer } from '../components/challenges/ChallengeTimer';

type RootStackParamList = {
  Room: { roomCode: string; username: string; players: Player[] };
  Game: { roomCode: string; username: string; isHost: boolean; players: Player[] };
  Home: undefined;
};

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

// TODO: Outsource bomb icon
const BOMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><g fill="#d35400"><path d="M17.981 2.353a.558.558 0 0 1 1.038 0l.654 1.66c.057.143.17.257.315.314l1.659.654c.47.186.47.852 0 1.038l-1.66.654a.56.56 0 0 0-.314.315l-.654 1.659a.558.558 0 0 1-1.038 0l-.654-1.66a.56.56 0 0 0-.315-.314l-1.659-.654a.558.558 0 0 1 0-1.038l1.66-.654a.56.56 0 0 0 .314-.315z"/><path fill-rule="evenodd" d="M17 14.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0m-5 2.25a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5zm2-4.25c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5.448-1.5 1-1.5 1 .672 1 1.5M9 14c.552 0 1-.672 1-1.5S9.552 11 9 11s-1 .672-1 1.5.448 1.5 1 1.5" clip-rule="evenodd"/><path d="m16.767 8.294-.75.75a8.6 8.6 0 0 0-1.06-1.061l.75-.75.76.3z"/></g></svg>`;

const GameScreen = ({ route, navigation }: GameScreenProps) => {
  const { roomCode, username, isHost, players: initialPlayers } = route.params;
  const { broadcastGameState, sendGameAction, lastMessage, disconnect, clearLastMessage } = useGameConnection();

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
  const [isFinished, setIsFinished] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<string[]>([]);
  const [challengesUntilExplosion, setChallengesUntilExplosion] = useState<number>(0);
  const [challengesCompleted, setChallengesCompleted] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);

  const throttledUpdates = useRef<{ [key: string]: ChallengeProgress }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishedPlayers = useRef<Set<string>>(new Set());
  const playerResults = useRef<{ [key: string]: { isCorrect: boolean; deltaTime: number } }>({});
  const readyPlayers = useRef<Set<string>>(new Set());
  const challengeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    // Send READY signal when GameScreen mounts
    sendGameAction('READY', { name: username });

    if (isHost) {
      // Host marks themselves as ready
      readyPlayers.current.add(username);

      // Generate initial random explosion number (3-7 challenges)
      const randomExplosion = Math.floor(Math.random() * 5) + 3;
      setChallengesUntilExplosion(randomExplosion);
      console.log(`[GameScreen] Bomb will explode after ${randomExplosion} challenges`);

      checkAllPlayersReady();
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    // Only process game-specific messages in GameScreen
    const gameMessages = ['ROUND_START', 'ROUND_OVER', 'COUNTDOWN', 'PLAYER_READY', 'PLAYER_FINISHED', 'PLAYER_DISCONNECT', 'PLAYER_ELIMINATED'];
    if (!gameMessages.includes(lastMessage.type)) {
      return;
    }

    if (lastMessage.type === 'ROUND_START') {
      startClientRound(lastMessage.id);
    }
    else if (lastMessage.type === 'ROUND_OVER') {
      endClientRound(lastMessage.loser);
    }
    else if (lastMessage.type === 'COUNTDOWN') {
      setCountdownNumber(lastMessage.count);
    }
    else if (lastMessage.type === 'PLAYER_DISCONNECT') {
      handlePlayerDisconnect(lastMessage.name);
    }
    else if (lastMessage.type === 'PLAYER_ELIMINATED') {
      setEliminatedPlayers(prev => [...prev, lastMessage.name]);
    }

    if (isHost && lastMessage.type === 'PLAYER_READY') {
      handlePlayerReady(lastMessage.name);
    }

    if (isHost && lastMessage.type === 'PLAYER_FINISHED') {
      handlePlayerFinished(lastMessage.name, lastMessage.isCorrect ?? true, lastMessage.deltaTime ?? 0);
    }
  }, [lastMessage]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (challengeTimeoutRef.current) {
        clearTimeout(challengeTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayerDisconnect = (playerName: string) => {
    console.log(`[GameScreen] Player disconnected: ${playerName}`);

    // Show disconnect notification
    const previousStatus = statusText;
    setStatusText(`${playerName} left the game`);
    setTimeout(() => {
      // Restore status if it hasn't changed
      setStatusText(prev => prev === `${playerName} left the game` ? previousStatus : prev);
    }, 2000);

    // Remove player from the game
    setPlayers(prev => {
      const remainingPlayers = prev.filter(p => p.name !== playerName);

      if (isHost) {
        // Clean up all host tracking for this player
        finishedPlayers.current.delete(playerName);
        delete playerResults.current[playerName];
        readyPlayers.current.delete(playerName);

        // If we're in a round, check if all remaining players have finished
        if (currentChallenge && finishedPlayers.current.size === remainingPlayers.length) {
          // All remaining players finished, determine loser
          const results = Object.entries(playerResults.current);
          if (results.length > 0) {
            const wrongAnswers = results.filter(([_, r]) => !r.isCorrect);
            let loserName: string;

            if (wrongAnswers.length > 0) {
              loserName = wrongAnswers.sort((a, b) => b[1].deltaTime - a[1].deltaTime)[0][0];
            } else {
              loserName = results.sort((a, b) => b[1].deltaTime - a[1].deltaTime)[0][0];
            }

            endRound(loserName);
          }
        }

        // If waiting for players to be ready, check if all remaining players are ready
        if (!currentChallenge && !countdownNumber && readyPlayers.current.size === remainingPlayers.length) {
          checkAllPlayersReady();
        }
      }

      return remainingPlayers;
    });
  };

  const handlePlayerReady = (playerName: string) => {
    readyPlayers.current.add(playerName);
    checkAllPlayersReady();
  };

  const isCountingDown = useRef(false);

  const checkAllPlayersReady = () => {
    // Only count non-eliminated players
    const activePlayers = players.filter(p => !eliminatedPlayers.includes(p.name));
    if (readyPlayers.current.size === activePlayers.length && !isCountingDown.current) {
      isCountingDown.current = true; // Prevent duplicate countdowns
      readyPlayers.current.clear(); // Clear for next round
      startCountdown();
    }
  };

  const startCountdown = async () => {
    // Countdown: 3, 2, 1
    for (let i = 3; i > 0; i--) {
      broadcastGameState('COUNTDOWN', { count: i });
      setCountdownNumber(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setCountdownNumber(null);
    isCountingDown.current = false; // Reset flag
    startNewRound();
  };

  const startNewRound = () => {
    const nextId = getRandomChallengeID();
    finishedPlayers.current.clear();
    playerResults.current = {};

    broadcastGameState('START_ROUND', { id:nextId });
    startClientRound(nextId);
  };

  const handlePlayerFinished = (playerName: string, isCorrect: boolean = true, deltaTime: number = 0) => {
    if (finishedPlayers.current.has(playerName)) {
      return;
    }

    finishedPlayers.current.add(playerName);
    playerResults.current[playerName] = {
      isCorrect,
      deltaTime,
    };

    // Only count non-eliminated players
    const activePlayers = players.filter(p => !eliminatedPlayers.includes(p.name));
    if (finishedPlayers.current.size === activePlayers.length) {
      // Determine loser based on: 1. Correctness (wrong answer = loser), 2. Speed (slowest = loser)
      const results = Object.entries(playerResults.current);

      // First, check if anyone got it wrong
      const wrongAnswers = results.filter(([_, r]) => !r.isCorrect);

      let loserName: string;
      if (wrongAnswers.length > 0) {
        // If there are wrong answers, the slowest among wrong loses (longest deltaTime among wrong)
        loserName = wrongAnswers.sort((a, b) => b[1].deltaTime - a[1].deltaTime)[0][0];
      } else {
        // If all correct, the slowest person loses (longest deltaTime)
        loserName = results.sort((a, b) => b[1].deltaTime - a[1].deltaTime)[0][0];
      }

      endRound(loserName);
    }
  };

  const endRound = (loserName: string) => {
    broadcastGameState('ROUND_OVER', { loser: loserName });
    endClientRound(loserName);

    // Increment challenges completed
    const newCount = challengesCompleted + 1;
    setChallengesCompleted(newCount);

    // Check if bomb should explode
    if (newCount >= challengesUntilExplosion) {
      // Bomb explodes! Eliminate the player with the bomb
      setTimeout(() => {
        eliminatePlayer(loserName);
      }, 3500); // After bomb animation
    } else {
      // Wait for players to send READY again for next round
      readyPlayers.current.clear();
      setTimeout(() => {
        // Prompt players to get ready for next round
        setStatusText('Get ready for next round...');
      }, 3000);
    }
  }

  const eliminatePlayer = (playerName: string) => {
    console.log(`[GameScreen] Eliminating player: ${playerName}`);

    // Broadcast elimination to all clients
    broadcastGameState('PLAYER_ELIMINATED', { name: playerName });

    // Add to eliminated list
    setEliminatedPlayers(prev => [...prev, playerName]);

    // Check for winner
    const activePlayers = players.filter(p => !eliminatedPlayers.includes(p.name) && p.name !== playerName);

    if (activePlayers.length === 1) {
      // We have a winner!
      setWinner(activePlayers[0].name);
      setStatusText(`${activePlayers[0].name} WINS!`);
      // TODO: Navigate to winner screen or show celebration
    } else {
      // Generate new explosion number
      const newExplosion = Math.floor(Math.random() * 5) + 3;
      setChallengesUntilExplosion(newExplosion);
      setChallengesCompleted(0);
      console.log(`[GameScreen] New bomb will explode after ${newExplosion} challenges`);

      // Continue game
      readyPlayers.current.clear();
      setTimeout(() => {
        setStatusText('Get ready for next round...');
      }, 3000);
    }
  }

  const startChallengeTimer = () => {
    // Set timeout to auto-finish after 15 seconds
    challengeTimeoutRef.current = setTimeout(() => {
      if (!isFinishedRef.current) {
        handleChallengeComplete(false);
      }
    }, 15000);
  };

  const stopChallengeTimer = () => {
    if (challengeTimeoutRef.current) {
      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;
    }
  };

  const startClientRound = (challengeId: number) => {
    const challenge = CHALLENGES[challengeId];

    if (challenge) {
      setCountdownNumber(null); // Clear countdown
      setCurrentChallenge(challenge);

      // Check if current player is eliminated
      const isEliminated = eliminatedPlayers.includes(username);

      if (isEliminated) {
        setIsFinished(true); // Spectator mode - can't interact
        isFinishedRef.current = true;
        setStatusText('You are eliminated - Spectating...');
      } else {
        setIsFinished(false);
        isFinishedRef.current = false; // Reset ref
        setStatusText(challenge.instruction);
        setChallengeStartTime(Date.now()); // Record start time
        startChallengeTimer(); // Start 15-second timer
      }

      setBombHolder(null);
    } else {
      console.error('[GameScreen] ERROR: No challenge found for ID:', challengeId);
    }
  };

  const endClientRound = (loser: string) => {
    stopChallengeTimer(); // Stop timer when round ends
    setCurrentChallenge(null);
    setBombHolder(loser);
    setStatusText(`${loser} got the BOMB!`);

    setPlayers(prev => prev.map(p => ({
      ...p,
      hasBomb: p.name === loser
    })));

    // After 3 seconds, send READY for next round
    setTimeout(() => {
      setBombHolder(null);
      setStatusText('Get ready for next round...');
      sendGameAction('READY', { name: username });

      if (isHost) {
        readyPlayers.current.add(username);
        checkAllPlayersReady();
      }
    }, 3000);
  };

  const [challengeStartTime, setChallengeStartTime] = useState<number>(0);

  const handleChallengeComplete = (isCorrect: boolean = true, customDeltaTime?: number) => {
    stopChallengeTimer(); // Stop timer when challenge completes
    setIsFinished(true);
    isFinishedRef.current = true; // Update ref
    setStatusText('Waiting for others...');

    // Use customDeltaTime if provided (e.g., reaction time), otherwise calculate from start
    const deltaTime = customDeltaTime ?? (Date.now() - challengeStartTime);

    sendGameAction('FINISHED', { name: username, isCorrect, deltaTime });

    if (isHost) {
      handlePlayerFinished(username, isCorrect, deltaTime);
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
          <Leaderboard players={players} eliminatedPlayers={eliminatedPlayers} />
        </View>

        {/* Game Interaction Section */}
        <View style={styles.challengeContainer}>
          {countdownNumber !== null ? (
              <View style={styles.centerBox}>
                <Text style={styles.countdownText}>{countdownNumber}</Text>
              </View>
          ) : bombHolder ? (
              <View style={styles.centerBox}>
                <SvgXml xml={BOMB_SVG} width={120} height={120} />
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
          ) : currentChallenge ? (
              <View style={styles.activeChallenge}>
                <ChallengeRenderer
                  challenge={currentChallenge}
                  onComplete={handleChallengeComplete}
                  disabled={isFinished}
                />
                <ChallengeTimer />
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
    justifyContent: 'space-between',
    flex: 1,
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
  bombImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#2DD881',
  },
  centerBox: {
    alignItems: 'center',
  },
});

export default GameScreen;
