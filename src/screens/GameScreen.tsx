import React, {useEffect, useRef, useState} from 'react';
import {Alert, BackHandler, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {GamePlayer} from '../types/challenge';
import {PatternBackground} from '../components/PatternBackground';
import {useGameConnection} from '../hooks/useGameConnection';
import {Challenge, CHALLENGES, getRandomChallengeID} from '../data/challenges';
import {ExplosionAnimation} from '../components/ExplosionAnimation';
import {CountdownView} from '../components/game/CountdownView';
import {BombView} from '../components/game/BombView';
import {ChallengeView} from '../components/game/ChallengeView';
import {colors} from '../theme/colors';
import {RootStackParamList} from '../navigation/types';
import Header from '../components/Header';
import {useFocusEffect} from '@react-navigation/native';

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

const GameScreen = ({
                        route,
                        navigation
                    }: GameScreenProps) => {
    const {
        roomCode,
        username,
        isHost,
        players: initialPlayers
    } = route.params;
    const {
        broadcastGameState,
        sendGameAction,
        lastMessage,
        disconnect,
        clearLastMessage
    } = useGameConnection();

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
    const isExitingRef = useRef<boolean>(false);
    const gameEnded = useRef<boolean>(false);
    const finishedPlayers = useRef<Set<string>>(new Set());
    const playerResults = useRef<{
        [key: string]: {
            isCorrect: boolean;
            deltaTime: number
        }
    }>({});
    const readyPlayers = useRef<Set<string>>(new Set());
    const eliminatedPlayersRef = useRef<Set<string>>(new Set());
    const challengeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Host-side safety timer to authoritatively end a round if clients don't report
    const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
    const roundResolvedRef = useRef<boolean>(false);
    // Host-side pre-round safety timer to avoid getting stuck on "Get Ready"
    const preRoundSafetyRef = useRef<NodeJS.Timeout | null>(null);
    const isFinishedRef = useRef<boolean>(false);
    const preRoundCountdownCancelledRef = useRef<boolean>(false);
    const handleLeave = () => {
        if (isExitingRef.current) {
            return;
        }
        Alert.alert('Leave Game', 'Are you sure you want to leave the game?', [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    isExitingRef.current = false;
                }
            },
            {
                text: 'Leave',
                onPress: async () => {
                    isExitingRef.current = true;
                    await disconnect();
                    navigation.navigate('Home');
                },
                style: 'destructive',
            },
        ]);
    };

    useEffect(() => {
        sendGameAction('READY', {name: username});

        if (isHost) {
            readyPlayers.current.add(username);

            // Generate initial random explosion number (3-7 challenges)
            const randomExplosion = Math.floor(Math.random() * 5) + 3;
            setChallengesUntilExplosion(randomExplosion);
            console.log(`[GameScreen] Bomb will explode after ${randomExplosion} challenges`);

            checkAllPlayersReady();
            schedulePreRoundSafety();
        }
    }, []);

    useEffect(() => {
        return () => {
            if (challengeTimeoutRef.current) {
                clearTimeout(challengeTimeoutRef.current);
                challengeTimeoutRef.current = null;
            }
            if (safetyTimerRef.current) {
                clearTimeout(safetyTimerRef.current);
                safetyTimerRef.current = null;
            }
            if (preRoundSafetyRef.current) {
                clearTimeout(preRoundSafetyRef.current);
                preRoundSafetyRef.current = null;
            }
        };
    }, []);

    // Intercept system/back navigation to show the leave confirmation and disconnect properly
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (isExitingRef.current) {
                return;
            }
            e.preventDefault();
            handleLeave();
        });
        return unsubscribe;
    }, [navigation]);

    // Android hardware back button fallback
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (isExitingRef.current) {
                    return false;
                }
                handleLeave();
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    useEffect(() => {
        if (!lastMessage) {
            return;
        }

        if (gameEnded.current && lastMessage.type !== 'GAME_WINNER') {
            return;
        }

        const gameMessages = ['ROUND_START', 'ROUND_OVER', 'PLAYER_READY', 'PLAYER_FINISHED', 'PLAYER_DISCONNECT', 'PLAYER_ELIMINATED', 'GAME_WINNER'];
        if (!gameMessages.includes(lastMessage.type)) {
            return;
        }

        if (lastMessage.type === 'ROUND_START') {
            startCountdownThenChallenge(lastMessage.id);
        } else if (lastMessage.type === 'ROUND_OVER') {
            endClientRound(lastMessage.loser);
        } else if (lastMessage.type === 'PLAYER_DISCONNECT') {
            handlePlayerDisconnect(lastMessage.name);
        } else if (lastMessage.type === 'PLAYER_ELIMINATED') {
            setEliminatedPlayers(prev => [...prev, lastMessage.name]);
            eliminatedPlayersRef.current.add(lastMessage.name);
            if (!isHost) {
                setShowExplosion(lastMessage.name);
            }
        } else if (lastMessage.type === 'GAME_WINNER') {
            handleGameEndedCleanup();
            setWinner(lastMessage.name);
            setTimeout(() => {
                navigation.navigate('Winner', {winnerName: lastMessage.name});
            }, 2000);
        }

        if (isHost && lastMessage.type === 'PLAYER_READY') {
            handlePlayerReady(lastMessage.name);
        }

        if (isHost && lastMessage.type === 'PLAYER_FINISHED') {
            handlePlayerFinished(lastMessage.name, lastMessage.isCorrect ?? true, lastMessage.deltaTime ?? 0);
        }
    }, [lastMessage]);

    useEffect(() => {
        return () => {
            if (challengeTimeoutRef.current) {
                clearTimeout(challengeTimeoutRef.current);
            }
        };
    }, []);

    // Handle player disconnection with complex state cleanup
    // Host must: clean up tracking refs, check for winner, handle mid-round disconnects,
    // and trigger ready check if waiting for players
    const handlePlayerDisconnect = (playerName: string) => {
        console.log(`[GameScreen] Player disconnected: ${playerName}`);

        const previousStatus = statusText;
        setStatusText(`${playerName} left the game`);
        setTimeout(() => {
            setStatusText(prev => prev === `${playerName} left the game` ? previousStatus : prev);
        }, 2000);

        setPlayers(prev => {
            const remainingPlayers = prev.filter(p => p.name !== playerName);

            if (isHost) {
                finishedPlayers.current.delete(playerName);
                delete playerResults.current[playerName];
                readyPlayers.current.delete(playerName);

                const activePlayers = remainingPlayers.filter(p => !eliminatedPlayersRef.current.has(p.name));

                if (activePlayers.length === 1) {
                    gameEnded.current = true;
                    const winnerName = activePlayers[0].name;
                    setWinner(winnerName);
                    setStatusText(`${winnerName} WINS!`);
                    stopChallengeTimer();
                    setCurrentChallenge(null);

                    broadcastGameState('GAME_WINNER', {name: winnerName});

                    setTimeout(() => {
                        navigation.navigate('Winner', {winnerName});
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
        // Any READY should attempt to progress; also cancel pre-round safety if countdown already started soon
        if (preRoundSafetyRef.current && isCountingDown.current) {
            clearTimeout(preRoundSafetyRef.current);
            preRoundSafetyRef.current = null;
        }
        checkAllPlayersReady();
    };

    const isCountingDown = useRef(false);

    const handleGameEndedCleanup = () => {
        gameEnded.current = true;
        if (challengeTimeoutRef.current) {
            clearTimeout(challengeTimeoutRef.current);
            challengeTimeoutRef.current = null;
        }
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
        if (preRoundSafetyRef.current) {
            clearTimeout(preRoundSafetyRef.current);
            preRoundSafetyRef.current = null;
        }
        preRoundCountdownCancelledRef.current = true;
        isCountingDown.current = false;
        setCountdownNumber(null);
        setCurrentChallenge(null);
    };

    const checkAllPlayersReady = () => {
        // Don't start new round if game has ended
        if (gameEnded.current) {
            return;
        }

        // Determine expected active players for this round using a robust mix of:
        // - Route-provided players who are not eliminated (may be slightly stale on host)
        // - Any players who already sent READY (ensures we don't block if the route list missed someone)
        const routeActiveNames = new Set(
            players.filter(p => !eliminatedPlayersRef.current.has(p.name)).map(p => p.name)
        );
        const expectedActiveNames = new Set(routeActiveNames);
        readyPlayers.current.forEach(name => expectedActiveNames.add(name));

        // Start when all expected active names have reported READY
        if (readyPlayers.current.size === expectedActiveNames.size && !isCountingDown.current) {
            isCountingDown.current = true; // Prevent duplicate countdowns
            readyPlayers.current.clear(); // Clear for next round
            // Clear any pre-round safety timer since we're starting normally
            if (preRoundSafetyRef.current) {
                clearTimeout(preRoundSafetyRef.current);
                preRoundSafetyRef.current = null;
            }
            startNewRound();
        }
    };

    const schedulePreRoundSafety = () => {
        if (!isHost) return;
        if (preRoundSafetyRef.current) {
            clearTimeout(preRoundSafetyRef.current);
        }
        // After 7s, if we still haven't started the countdown, force-start a new round
        preRoundSafetyRef.current = setTimeout(() => {
            if (gameEnded.current) return;
            if (isCountingDown.current) return;
            // Start even if not all READY
            console.log('[GameScreen] Pre-round safety triggered: forcing round start');
            isCountingDown.current = true;
            readyPlayers.current.clear();
            startNewRound();
        }, 7000);
    };

    const startCountdownThenChallenge = async (challengeId: number) => {
        // If the game already ended, do not countdown
        if (gameEnded.current) return;
        preRoundCountdownCancelledRef.current = false;

        // Each client counts down locally from 3 to 1
        for (let i = 3; i > 0; i--) {
            if (gameEnded.current || preRoundCountdownCancelledRef.current) {
                setCountdownNumber(null);
                return;
            }
            setCountdownNumber(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Clear number before starting
        setCountdownNumber(null);

        // After countdown, start the challenge unless game ended mid-countdown
        if (gameEnded.current || preRoundCountdownCancelledRef.current) {
            return;
        }
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
        roundResolvedRef.current = false;

        broadcastGameState('ROUND_START', {id: nextId});
        startCountdownThenChallenge(nextId);
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

        const activePlayers = players.filter(p => !eliminatedPlayersRef.current.has(p.name));
        console.log(`[GameScreen] Player finished: ${playerName}, total: ${finishedPlayers.current.size}/${activePlayers.length}`);

        if (finishedPlayers.current.size === activePlayers.length) {
            console.log('[GameScreen] All players finished, determining loser...');
            // Determine loser based on: 1. Correctness (wrong answer = loser), 2. Speed (slowest = loser)
            const results = Object.entries(playerResults.current);
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
        // Guard: avoid duplicate endRound calls
        if (roundResolvedRef.current) {
            return;
        }
        roundResolvedRef.current = true;

        // Clear all timers related to this round
        if (challengeTimeoutRef.current) {
            clearTimeout(challengeTimeoutRef.current);
            challengeTimeoutRef.current = null;
        }
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }

        broadcastGameState('ROUND_OVER', {loser: loserName});
        endClientRound(loserName);

        const newCount = challengesCompleted + 1;
        setChallengesCompleted(newCount);

        // Check if bomb should explode
        if (newCount >= challengesUntilExplosion) {
            // Bomb explodes
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
                schedulePreRoundSafety();
            }, 3000);
        }
    }

    const eliminatePlayer = (playerName: string) => {
        console.log(`[GameScreen] Eliminating player: ${playerName}`);

        setShowExplosion(playerName);
        broadcastGameState('PLAYER_ELIMINATED', {name: playerName});
        setEliminatedPlayers(prev => [...prev, playerName]);

        eliminatedPlayersRef.current.add(playerName);
    }

    const handleExplosionComplete = () => {
        const eliminatedPlayerName = showExplosion;
        setShowExplosion(null);

        if (isHost) {
            const activePlayers = players.filter(p => !eliminatedPlayersRef.current.has(p.name));

            if (activePlayers.length === 1) {
                handleGameEndedCleanup();
                const winnerName = activePlayers[0].name;
                setWinner(winnerName);
                setStatusText(`${winnerName} WINS!`);
                broadcastGameState('GAME_WINNER', {name: winnerName});

                // Host navigates after longer delay to ensure broadcast reaches all clients
                setTimeout(() => {
                    navigation.navigate('Winner', {winnerName});
                }, 3000);

                return;
            } else {
                // Generate new explosion number
                const newExplosion = Math.floor(Math.random() * 5) + 3;
                setChallengesUntilExplosion(newExplosion);
                setChallengesCompleted(0);
                console.log(`[GameScreen] New bomb will explode after ${newExplosion} challenges`);

                readyPlayers.current.clear();
            }
        }

        if (gameEnded.current) {
            return;
        }

        const isEliminated = username === eliminatedPlayerName;

        if (isEliminated) {
            setStatusText('You are eliminated - Spectating...');
            return;
        }

        setStatusText('Get ready for next round...');
        sendGameAction('READY', {name: username});

        if (isHost) {
            readyPlayers.current.add(username);
            checkAllPlayersReady();
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
            setCountdownNumber(null);
            setCurrentChallenge(challenge);

            const isEliminated = eliminatedPlayers.includes(username);

            if (isEliminated) {
                setIsFinished(true);
                isFinishedRef.current = true;
                setStatusText('You are eliminated - Spectating...');
            } else {
                setIsFinished(false);
                isFinishedRef.current = false;
                setStatusText(challenge.instruction);
                setChallengeStartTime(Date.now());
                startChallengeTimer();

                if (isHost) {
                    if (safetyTimerRef.current) {
                        clearTimeout(safetyTimerRef.current);
                    }
                    safetyTimerRef.current = setTimeout(() => {
                        if (roundResolvedRef.current) return;

                        const activePlayers = players.filter(p => !eliminatedPlayersRef.current.has(p.name));
                        const missing = activePlayers
                            .map(p => p.name)
                            .filter(name => !finishedPlayers.current.has(name));

                        missing.forEach(name => {
                            if (!playerResults.current[name]) {
                                playerResults.current[name] = {
                                    isCorrect: false,
                                    deltaTime: Number.MAX_SAFE_INTEGER,
                                };
                            }
                            finishedPlayers.current.add(name);
                        });

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
                    }, 17000); // 17s safety window
                }
            }

            setBombHolder(null);
        } else {
            console.error('[GameScreen] ERROR: No challenge found for ID:', challengeId);
        }
    };

    const sendReadyForNextRound = () => {
        if (gameEnded.current) {
            return;
        }

        if (showExplosion === null) {
            setBombHolder(null);
            setStatusText('Get ready for next round...');
            sendGameAction('READY', {name: username});

            if (isHost) {
                readyPlayers.current.add(username);
                checkAllPlayersReady();
            }
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

        setTimeout(() => {
            sendReadyForNextRound();
        }, 3000);
    };

    const [challengeStartTime, setChallengeStartTime] = useState<number>(0);

    const handleChallengeComplete = (isCorrect: boolean = true, customDeltaTime?: number) => {
        console.log(`[GameScreen] Challenge complete for ${username}, isCorrect: ${isCorrect}`);
        stopChallengeTimer();
        setIsFinished(true);
        isFinishedRef.current = true;
        setStatusText('Waiting for others...');

        const deltaTime = customDeltaTime ?? (Date.now() - challengeStartTime);

        console.log(`[GameScreen] Sending PLAYER_FINISHED for ${username}, deltaTime: ${deltaTime}ms`);
        sendGameAction('FINISHED', {
            name: username,
            isCorrect,
            deltaTime
        });

        if (isHost) {
            handlePlayerFinished(username, isCorrect, deltaTime);
        }
    };

    return (
        <View style={styles.container}>
            <PatternBackground speed={10} tileSize={42} gap={42}/>
            <SafeAreaView style={styles.safeArea}>
                <Header onLeave={handleLeave} title="Game"/>

                <View style={styles.challengeContainer}>
                    {countdownNumber !== null ? (
                        <CountdownView countdownNumber={countdownNumber}/>
                    ) : bombHolder ? (
                        <BombView statusText={statusText}/>
                    ) : currentChallenge ? (
                        <ChallengeView
                            challenge={currentChallenge}
                            isEliminated={eliminatedPlayers.includes(username)}
                            isFinished={isFinished}
                            onComplete={handleChallengeComplete}
                        />
                    ) : (
                        <Text style={styles.statusText}>{statusText}</Text>
                    )}
                </View>

            </SafeAreaView>

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
    backgroundColor: colors.background,
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
    color: colors.text,
    fontSize: 16,
    opacity: 0.8,
  },
  challengeContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChallenge: {
    width: '100%',
    alignItems: 'center',
  },
  challengeTitle: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    color: colors.text,
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  tapBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  disabledBtn: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0,
  },
  tapText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  progress: {
    color: colors.mediumGray,
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    color: colors.text,
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
    color: colors.accent,
  },
  centerBox: {
    alignItems: 'center',
  },
});

export default GameScreen;
