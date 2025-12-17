import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGameConnection } from '../hooks/useGameConnection';
import { RootStackParamList } from '../navigation/types';
import {colors} from '../theme/colors';
import Header from '../components/Header';
import { useFocusEffect } from '@react-navigation/native';

type RoomScreenProps = NativeStackScreenProps<RootStackParamList, 'Room'>;

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
}

export default function RoomScreen({ navigation, route }: RoomScreenProps) {
    const { roomCode, username, isHost, service } = route.params;
    const [players, setPlayers] = useState<Player[]>([]);
    const isExitingRef = useRef<boolean>(false);

    const { startHostingGame, joinGame, broadcastGameState, broadcastPlayerList, sendPlayerDisconnect, lastMessage, disconnect, clearLastMessage } =
        useGameConnection();

    useEffect(() => {
        clearLastMessage();

        if (isHost) {
            const initialPlayers = [{
                id: username,
                name: username,
                isHost: true,
            }];
            setPlayers(initialPlayers);
            startHostingGame(roomCode, username);
        } else if (service) {
            joinGame(service, username);
        }

        return () => {
            // We don't cleanup connection on unmount because it
            // should persist when navigating to GameScreen
        };
    }, []);

    // Intercept system/back navigation to ensure proper disconnect & broadcast
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (isExitingRef.current) {
                // Allow default behavior if we've already initiated exit
                return;
            }
            // Prevent leaving and run our cancellation logic
            e.preventDefault();
            // Trigger the same flow as pressing the UI leave/back button
            handleCancel();
            // Mark as exiting so the next navigation attempt proceeds
            isExitingRef.current = true;
        });
        return unsubscribe;
    }, [navigation]);

    // Android hardware back button fallback (extra safety)
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (isExitingRef.current) {
                    // Let the default back behavior proceed
                    return false;
                }
                handleCancel();
                isExitingRef.current = true;
                return true; // We handled it
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    useEffect(() => {
        if (!lastMessage) return;

        const roomMessages = ['PLAYER_JOIN', 'PLAYER_LIST', 'PLAYER_DISCONNECT', 'GAME_START', 'HOST_CANCEL'];
        if (!roomMessages.includes(lastMessage.type)) {
            return;
        }

        if (isHost && lastMessage.type === 'PLAYER_JOIN') {
            const playerName = lastMessage.name;

            setPlayers(prev => {
                if (prev.some(p => p.name === playerName)) {
                    setTimeout(() => {
                        broadcastPlayerList(prev);
                    }, 0);
                    return prev;
                }

                const newPlayers = [
                    ...prev,
                    {
                        id: playerName,
                        name: playerName,
                        isHost: false,
                    },
                ];

                setTimeout(() => {
                    broadcastPlayerList(newPlayers);
                }, 0);

                return newPlayers;
            });
        }

        if (isHost && lastMessage.type === 'PLAYER_DISCONNECT') {
            const playerName = lastMessage.name;

            setPlayers(prev => {
                const newPlayers = prev.filter(p => p.name !== playerName);

                setTimeout(() => {
                    broadcastPlayerList(newPlayers);
                }, 0);

                return newPlayers;
            });
        }

        if (!isHost && lastMessage.type === 'PLAYER_LIST') {
            setPlayers(lastMessage.players);
        }

        if (lastMessage.type === 'GAME_START') {
            navigateToGame();
        }

        if (!isHost && lastMessage.type === 'HOST_CANCEL') {
            (async () => {
                await disconnect();
                navigation.navigate('Home');
            })();
        }
    }, [lastMessage]);

    const navigateToGame = () => {
        navigation.navigate('Game', {
            roomCode,
            username,
            isHost,
            players,
        });
    };

    const handleStart = async () => {
        if (!isHost) return;

        if (players.length < 2) {
            Alert.alert('Not Enough Players', 'You need at least 2 players to start the game.');
            return;
        }

        broadcastGameState('GAME_START');

        await new Promise(resolve => setTimeout(resolve, 100));

        navigateToGame();
    };

    const handleCancel = async () => {
        if (isHost) {
            broadcastGameState('HOST_CANCEL');
            await new Promise(resolve => setTimeout(resolve, 100));
        } else {
            sendPlayerDisconnect(username);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await disconnect();
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <PatternBackground speed={10} tileSize={42} gap={42} />
            <SafeAreaView style={styles.safeArea}>
                <Header onLeave={handleCancel} title={`Room #${roomCode}`} />
                <View style={styles.content}>
                    <View style={styles.playersContainer}>
                        <View style={styles.playersHeader}>
                            <Text style={styles.playersHeaderText}>
                                {players.length} {players.length === 1 ? 'Player' : 'Players'}
                            </Text>
                        </View>

                        <ScrollView
                            style={styles.playersList}
                            contentContainerStyle={styles.playersListContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {players.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>
                                        Waiting for players...
                                    </Text>
                                </View>
                            ) : (
                                players.map(player => (
                                    <View key={player.id} style={styles.playerCard}>
                                        <View style={styles.playerInfo}>
                                            <Text style={styles.playerName}>
                                                {player.name}
                                            </Text>
                                            {player.isHost && (
                                                <Text style={styles.hostBadgeText}>
                                                    Host
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>

                    <View style={styles.buttonContainer}>
                        {isHost ? (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.button,
                                    styles.startButton,
                                    pressed && styles.startButtonPressed,
                                ]}
                                onPress={handleStart}
                            >
                                <Text style={styles.buttonText}>Start</Text>
                            </Pressable>
                        ) : (
                            <View style={[styles.button, styles.waitingButton]}>
                                <Text style={styles.waitingText}>
                                    Waiting for Host...
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 60,
  },
  playersContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    marginVertical: 20,
  },
  playersHeader: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  playersHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  playersList: {
    flex: 1,
    width: '100%',
  },
  playersListContent: {
    gap: 12,
    paddingBottom: 20,
  },
  playerCard: {
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  hostBadgeText: {
    paddingVertical: 4,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.darkGray,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  startButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  waitingButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.disabled,
  },
  waitingText: {
    color: colors.mediumGray,
    fontSize: 18,
    fontStyle: 'italic',
  },
  buttonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
