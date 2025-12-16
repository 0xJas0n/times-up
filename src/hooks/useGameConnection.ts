import { useEffect, useState, useRef } from 'react';
import { NetworkManager, PROTOCOL } from '../services/networkManager';
import { ZeroconfService } from '../types/zeroconf';

export const useGameConnection = () => {
    const [lastMessage, setLastMessage] = useState<any>(() => {
        const currentMessage = NetworkManager.getCurrentMessage();
        return currentMessage;
    });
    const roomCodeRef = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribe = NetworkManager.subscribe((payload) => {
            let formattedMessage = null;

            if (payload.type === 'SERVICE_FOUND' || payload.type === 'SERVICE_LOST') {
                return;
            }

            switch (payload.type) {
                case PROTOCOL.PLAYER_JOIN:
                    formattedMessage = { type: 'PLAYER_JOIN', name: payload.data };
                    break;
                case PROTOCOL.PLAYER_LIST:
                    try {
                        const players = JSON.parse(payload.data);
                        formattedMessage = { type: 'PLAYER_LIST', players };
                    } catch (e) {
                        console.error('Failed to parse player list', e);
                    }
                    break;
                case PROTOCOL.PLAYER_DISCONNECT:
                    formattedMessage = { type: 'PLAYER_DISCONNECT', name: payload.data };
                    break;
                case PROTOCOL.GAME_START:
                    formattedMessage = { type: 'GAME_START' };
                    break;
                case PROTOCOL.PLAYER_READY:
                    formattedMessage = { type: 'PLAYER_READY', name: payload.data };
                    break;
                case PROTOCOL.ROUND_START:
                    const challengeId = parseInt(payload.data, 10);
                    formattedMessage = { type: 'ROUND_START', id: challengeId };
                    break;
                case PROTOCOL.PLAYER_FINISHED:
                    try {
                        const finishedData = JSON.parse(payload.data);
                        formattedMessage = {
                            type: 'PLAYER_FINISHED',
                            name: finishedData.name,
                            isCorrect: finishedData.isCorrect,
                            deltaTime: finishedData.deltaTime
                        };
                    } catch (e) {
                        console.error('Failed to parse PLAYER_FINISHED data', e);
                        formattedMessage = { type: 'PLAYER_FINISHED', name: payload.data };
                    }
                    break;
                case PROTOCOL.ROUND_OVER:
                    formattedMessage = { type: 'ROUND_OVER', loser: payload.data };
                    break;
                case PROTOCOL.PLAYER_ELIMINATED:
                    formattedMessage = { type: 'PLAYER_ELIMINATED', name: payload.data };
                    break;
                case PROTOCOL.GAME_WINNER:
                    formattedMessage = { type: 'GAME_WINNER', name: payload.data };
                    break;
                case PROTOCOL.HOST_CANCEL:
                    formattedMessage = { type: 'HOST_CANCEL' };
                    break;
            }

            if (formattedMessage) {
                setLastMessage(formattedMessage);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const startHostingGame = async (roomCode: string, playerName: string) => {
        roomCodeRef.current = roomCode;
        await NetworkManager.createHost(12345, roomCode);
    };

    const joinGame = async (service: ZeroconfService, playerName: string) => {
        roomCodeRef.current = service.name;
        NetworkManager.connectToHost(service.host, service.port, () => {
            NetworkManager.broadcast(PROTOCOL.PLAYER_JOIN, playerName);
        });
    };

    const broadcastGameState = async (state: string, data?: any) => {
        if (state === 'GAME_START') {
            NetworkManager.broadcast(PROTOCOL.GAME_START, '');
        }

        // Support both legacy 'START_ROUND' and current 'ROUND_START' names
        if (state === 'START_ROUND' || state === 'ROUND_START') {
            NetworkManager.broadcast(PROTOCOL.ROUND_START, data.id.toString());
        }

        if (state === 'ROUND_OVER') {
            NetworkManager.broadcast(PROTOCOL.ROUND_OVER, data.loser);
        }

        if (state === 'PLAYER_ELIMINATED') {
            NetworkManager.broadcast(PROTOCOL.PLAYER_ELIMINATED, data.name);
        }

        if (state === 'GAME_WINNER') {
            NetworkManager.broadcast(PROTOCOL.GAME_WINNER, data.name);
        }
    };

    const sendGameAction = async (actionType: string, data: any) => {
        if (actionType === 'FINISHED') {
            NetworkManager.broadcast(PROTOCOL.PLAYER_FINISHED, JSON.stringify(data));
        }

        if (actionType === 'READY') {
            NetworkManager.broadcast(PROTOCOL.PLAYER_READY, data.name);
        }
    };

    const broadcastPlayerList = (players: any[]) => {
        NetworkManager.broadcast(PROTOCOL.PLAYER_LIST, JSON.stringify(players));
    };

    const sendPlayerDisconnect = (playerName: string) => {
        NetworkManager.broadcast(PROTOCOL.PLAYER_DISCONNECT, playerName);
    };

    const disconnect = async () => {
        await NetworkManager.stop();
        NetworkManager.clearCurrentMessage();
        setLastMessage(null);
    };

    const clearLastMessage = () => {
        NetworkManager.clearCurrentMessage();
        setLastMessage(null);
    };

    return {
        lastMessage,
        startHostingGame,
        joinGame,
        sendGameAction,
        broadcastGameState,
        broadcastPlayerList,
        sendPlayerDisconnect,
        disconnect,
        clearLastMessage
    };
};
