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
import { ExplosionAnimation } from '../components/ExplosionAnimation';

type RootStackParamList = {
  Room: { roomCode: string; username: string; players: Player[] };
  Game: { roomCode: string; username: string; isHost: boolean; players: Player[] };
  Home: undefined;
  Winner: { winnerName: string };
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
  const [showExplosion, setShowExplosion] = useState<string | null>(null);
  const gameEnded = useRef<boolean>(false);

  const throttledUpdates = useRef<{ [key: string]: ChallengeProgress }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishedPlayers = useRef<Set<string>>(new Set());
  const playerResults = useRef<{ [key: string]: { isCorrect: boolean; deltaTime: number } }>({});
  const readyPlayers = useRef<Set<string>>(new Set());
  const eliminatedPlayersRef = useRef<Set<string>>(new Set());
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

    // Stop processing messages after game has ended (winner determined)
    if (gameEnded.current && lastMessage.type !== 'GAME_WINNER') {
      console.log(`[GameScreen] Ignoring ${lastMessage.type} - game already ended`);
      return;
    }

    // Only process game-specific messages in GameScreen
    const gameMessages = ['ROUND_START', 'ROUND_OVER', 'PLAYER_READY', 'PLAYER_FINISHED', 'PLAYER_DISCONNECT', 'PLAYER_ELIMINATED', 'GAME_WINNER'];
    if (!gameMessages.includes(lastMessage.type)) {
      return;
    }

    if (lastMessage.type === 'ROUND_START') {
      // Start countdown, then challenge (already synced at READY point)
      startCountdownThenChallenge(lastMessage.id);
    }
    else if (lastMessage.type === 'ROUND_OVER') {
      endClientRound(lastMessage.loser);
    }
    else if (lastMessage.type === 'PLAYER_DISCONNECT') {
      handlePlayerDisconnect(lastMessage.name);
    }
    else if (lastMessage.type === 'PLAYER_ELIMINATED') {
      setEliminatedPlayers(prev => [...prev, lastMessage.name]);
      // Also update ref immediately for sync-critical logic
      eliminatedPlayersRef.current.add(lastMessage.name);
      // Show explosion for non-host clients
      if (!isHost) {
        setShowExplosion(lastMessage.name);
      }
    }
    else if (lastMessage.type === 'GAME_WINNER') {
      // Navigate all clients to winner screen
      gameEnded.current = true; // Mark game as ended
      setWinner(lastMessage.name);
      setTimeout(() => {
        navigation.navigate('Winner', { winnerName: lastMessage.name });
      }, 2000);
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

        // Check how many active (non-eliminated) players remain - use REF for immediate sync
        const activePlayers = remainingPlayers.filter(p => !eliminatedPlayersRef.current.has(p.name));

        if (activePlayers.length === 1) {
          // Only one active player left - they win!
          gameEnded.current = true; // Mark game as ended
          const winnerName = activePlayers[0].name;
          setWinner(winnerName);
          setStatusText(`${winnerName} WINS!`);
          // Stop any active challenge timer
          stopChallengeTimer();
          setCurrentChallenge(null);

          // Broadcast winner to all clients
          broadcastGameState('GAME_WINNER', { name: winnerName });

          // Host navigates after longer delay to ensure broadcast reaches all clients
          setTimeout(() => {
            navigation.navigate('Winner', { winnerName });
          }, 3000);
        } else {
          // If we're in a round, check if all remaining active players have finished
          if (currentChallenge && finishedPlayers.current.size === activePlayers.length) {
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

          // If waiting for players to be ready, check if all remaining active players are ready
          if (!currentChallenge && !countdownNumber && readyPlayers.current.size === activePlayers.length) {
            checkAllPlayersReady();
          }
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
    // Don't start new round if game has ended
    if (gameEnded.current) {
      console.log(`[GameScreen] Game ended, not starting new round`);
      return;
    }

    // Only count non-eliminated players - use REF for immediate sync
    const activePlayers = players.filter(p => !eliminatedPlayersRef.current.has(p.name));
    console.log(`[GameScreen] Check ready: ${readyPlayers.current.size}/${activePlayers.length} ready, eliminated: [${Array.from(eliminatedPlayersRef.current).join(', ')}]`);

    if (readyPlayers.current.size === activePlayers.length && !isCountingDown.current) {
      isCountingDown.current = true; // Prevent duplicate countdowns
      readyPlayers.current.clear(); // Clear for next round
      startNewRound();
    }
  };

  const startCountdownThenChallenge = async (challengeId: number) => {
    // Each client counts down locally from 3 to 1
    for (let i = 3; i > 0; i--) {
      setCountdownNumber(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setCountdownNumber(null);

    // After countdown, start the challenge
    startClientRound(challengeId);

    // Reset countdown flag on host
    if (isHost) {
      isCountingDown.current = false;
    }
  };

  const startNewRound = () => {
    const nextId = getRandomChallengeID();
    finishedPlayers.current.clear();
    playerResults.current = {};

    // Broadcast ROUND_START with challenge ID - clients countdown then start
    broadcastGameState('START_ROUND', { id: nextId });

    // Host also counts down then starts (doesn't receive own broadcast)
    startCountdownThenChallenge(nextId);
  };

  const handlePlayerFinished = (playerName: string, isCorrect: boolean = true, deltaTime: number = 0) => {
    if (finishedPlayers.current.has(playerName)) {
      console.log(`[GameScreen] Ignoring duplicate finish from ${playerName}`);
      return;
    }

    finishedPlayers.current.add(playerName);
    playerResults.current[playerName] = {
      isCorrect,
      deltaTime,
    };

    // Only count non-eliminated players - use REF for immediate sync
    const activePlayers = players.filter(p => !eliminatedPlayersRef.current.has(p.name));
    console.log(`[GameScreen] Player finished: ${playerName}, total finished: ${finishedPlayers.current.size}/${activePlayers.length}, active players: [${activePlayers.map(p => p.name).join(', ')}]`);

    if (finishedPlayers.current.size === activePlayers.length) {
      console.log('[GameScreen] All players finished, determining loser...');
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
      // Call at 2500ms so explosion shows BEFORE sendReadyForNextRound checks at 3000ms
      setTimeout(() => {
        eliminatePlayer(loserName);
      }, 2500); // Before sendReadyForNextRound
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

    // Show explosion animation
    setShowExplosion(playerName);

    // Broadcast elimination to all clients
    broadcastGameState('PLAYER_ELIMINATED', { name: playerName });

    // Add to eliminated list (state for UI)
    setEliminatedPlayers(prev => [...prev, playerName]);

    // Also update ref immediately for sync-critical logic
    eliminatedPlayersRef.current.add(playerName);
  }

  const handleExplosionComplete = () => {
    // Capture who was eliminated BEFORE clearing showExplosion
    const eliminatedPlayerName = showExplosion;
    setShowExplosion(null);

    if (isHost) {
      // Host handles winner determination and game continuation
      // Check for winner - use REF for immediate sync (already includes just-eliminated player)
      const activePlayers = players.filter(p => !eliminatedPlayersRef.current.has(p.name));

      console.log(`[GameScreen] After explosion, active players: ${activePlayers.length}`, activePlayers.map(p => p.name));

      if (activePlayers.length === 1) {
        // We have a winner!
        gameEnded.current = true; // Mark game as ended
        const winnerName = activePlayers[0].name;
        setWinner(winnerName);
        setStatusText(`${winnerName} WINS!`);

        // Broadcast winner to all clients
        broadcastGameState('GAME_WINNER', { name: winnerName });

        // Host navigates after longer delay to ensure broadcast reaches all clients
        setTimeout(() => {
          navigation.navigate('Winner', { winnerName });
        }, 3000);

        return; // Don't send READY when game ends
      } else {
        // Generate new explosion number
        const newExplosion = Math.floor(Math.random() * 5) + 3;
        setChallengesUntilExplosion(newExplosion);
        setChallengesCompleted(0);
        console.log(`[GameScreen] New bomb will explode after ${newExplosion} challenges`);

        // Continue game - clear ready players for new round
        readyPlayers.current.clear();
      }
    }

    // Don't send READY if game has ended
    if (gameEnded.current) {
      console.log(`[GameScreen] Explosion complete, but game has ended`);
      return;
    }

    // Check if THIS player is the one who was eliminated
    const isEliminated = username === eliminatedPlayerName;

    if (isEliminated) {
      // Eliminated players don't send READY - they just spectate
      console.log(`[GameScreen] Explosion complete, but player is eliminated (spectating)`);
      setStatusText('You are eliminated - Spectating...');
      return;
    }

    // Only non-eliminated players send READY after explosion animation completes
    console.log(`[GameScreen] Explosion complete, sending READY`);
    setStatusText('Get ready for next round...');
    sendGameAction('READY', { name: username });

    if (isHost) {
      readyPlayers.current.add(username);
      checkAllPlayersReady();
    }
  }

  const startChallengeTimer = () => {
    console.log(`[GameScreen] Starting 15-second challenge timer for ${username}`);
    // Set timeout to auto-finish after 15 seconds
    challengeTimeoutRef.current = setTimeout(() => {
      console.log(`[GameScreen] Challenge timeout fired for ${username}, isFinished: ${isFinishedRef.current}`);
      if (!isFinishedRef.current) {
        console.log(`[GameScreen] Auto-completing challenge for ${username}`);
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

  const sendReadyForNextRound = () => {
    // Don't send READY if game has ended
    if (gameEnded.current) {
      console.log(`[GameScreen] Game ended, not sending READY`);
      return;
    }

    // Only send READY if not showing explosion (explosion will send READY when complete)
    if (showExplosion === null) {
      console.log(`[GameScreen] Sending READY for next round`);
      setBombHolder(null);
      setStatusText('Get ready for next round...');
      sendGameAction('READY', { name: username });

      if (isHost) {
        readyPlayers.current.add(username);
        checkAllPlayersReady();
      }
    } else {
      console.log(`[GameScreen] Explosion showing, will send READY after explosion completes`);
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

    // After 3 seconds (bomb animation time), check if ready to send READY
    setTimeout(() => {
      sendReadyForNextRound();
    }, 3000);
  };

  const [challengeStartTime, setChallengeStartTime] = useState<number>(0);

  const handleChallengeComplete = (isCorrect: boolean = true, customDeltaTime?: number) => {
    console.log(`[GameScreen] Challenge complete for ${username}, isCorrect: ${isCorrect}`);
    stopChallengeTimer(); // Stop timer when challenge completes
    setIsFinished(true);
    isFinishedRef.current = true; // Update ref
    setStatusText('Waiting for others...');

    // Use customDeltaTime if provided (e.g., reaction time), otherwise calculate from start
    const deltaTime = customDeltaTime ?? (Date.now() - challengeStartTime);

    console.log(`[GameScreen] Sending PLAYER_FINISHED for ${username}, deltaTime: ${deltaTime}ms`);
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
                {eliminatedPlayers.includes(username) ? (
                  // Eliminated player spectator view
                  <View style={styles.spectatorView}>
                    <Text style={styles.spectatorEmoji}>👻</Text>
                    <Text style={styles.spectatorTitle}>You are eliminated!</Text>
                    <Text style={styles.spectatorText}>Spectating the game...</Text>
                  </View>
                ) : (
                  <>
                    <ChallengeRenderer
                      challenge={currentChallenge}
                      onComplete={handleChallengeComplete}
                      disabled={isFinished}
                    />
                    <ChallengeTimer />
                  </>
                )}
              </View>
          ) : (
              <Text style={styles.statusText}>{statusText}</Text>
          )}
        </View>

      </SafeAreaView>

      {/* Explosion Animation */}
      {showExplosion && (
        <ExplosionAnimation
          playerName={showExplosion}
          onComplete={handleExplosionComplete}
        />
      )}
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
  spectatorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  spectatorEmoji: {
    fontSize: 100,
  },
  spectatorTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'center',
  },
  spectatorText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
  },
});

export default GameScreen;
