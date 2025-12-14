import { useEffect, useState, useRef } from 'react';
import { NetworkManager, PROTOCOL } from '../services/networkManager';
import { ZeroconfService } from '../types/zeroconf';

export const useGameConnection = () => {
    const [lastMessage, setLastMessage] = useState<any>(() => {
        // Initialize with current message from NetworkManager
        const currentMsg = NetworkManager.getCurrentMessage();
        return currentMsg;
    });
    const roomCodeRef = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribe = NetworkManager.subscribe((payload) => {
            let formattedMsg = null;

            // Ignore service discovery messages - handled separately in JoinGameScreen
            if (payload.type === 'SERVICE_FOUND' || payload.type === 'SERVICE_LOST') {
                return;
            }

            switch (payload.type) {
                case PROTOCOL.PLAYER_JOIN:
                    formattedMsg = { type: 'PLAYER_JOIN', name: payload.data };
                    break;
                case PROTOCOL.PLAYER_LIST:
                    try {
                        const players = JSON.parse(payload.data);
                        formattedMsg = { type: 'PLAYER_LIST', players };
                    } catch (e) {
                        console.error('Failed to parse player list', e);
                    }
                    break;
                case PROTOCOL.PLAYER_DISCONNECT:
                    formattedMsg = { type: 'PLAYER_DISCONNECT', name: payload.data };
                    break;
                case PROTOCOL.GAME_START:
                    formattedMsg = { type: 'GAME_START' };
                    break;
                case PROTOCOL.PLAYER_READY:
                    formattedMsg = { type: 'PLAYER_READY', name: payload.data };
                    break;
                case PROTOCOL.COUNTDOWN:
                    formattedMsg = { type: 'COUNTDOWN', count: parseInt(payload.data, 10) };
                    break;
                case PROTOCOL.PLAYER_FINISHED:
                    try {
                        const finishedData = JSON.parse(payload.data);
                        formattedMsg = {
                            type: 'PLAYER_FINISHED',
                            name: finishedData.name,
                            isCorrect: finishedData.isCorrect,
                            deltaTime: finishedData.deltaTime
                        };
                    } catch (e) {
                        console.error('Failed to parse PLAYER_FINISHED data', e);
                        formattedMsg = { type: 'PLAYER_FINISHED', name: payload.data };
                    }
                    break;
                case PROTOCOL.ROUND_START:
                    const challengeId = parseInt(payload.data, 10);
                    formattedMsg = { type: 'ROUND_START', id: challengeId };
                    break;
                case PROTOCOL.ROUND_OVER:
                    formattedMsg = { type: 'ROUND_OVER', loser: payload.data };
                    break;
                case PROTOCOL.HOST_CANCEL:
                    formattedMsg = { type: 'HOST_CANCEL' };
                    break;
            }

            if (formattedMsg) {
                setLastMessage(formattedMsg);
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

        if (state === 'COUNTDOWN') {
            NetworkManager.broadcast(PROTOCOL.COUNTDOWN, data.count.toString());
        }

        if (state === 'START_ROUND') {
            NetworkManager.broadcast(PROTOCOL.ROUND_START, data.id.toString());
        }

        if (state === 'ROUND_OVER') {
            NetworkManager.broadcast(PROTOCOL.ROUND_OVER, data.loser);
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
        disconnect,
        clearLastMessage
    };
};
