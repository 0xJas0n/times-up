import { useEffect, useState, useRef } from 'react';
import { NetworkManager, PROTOCOL } from '../services/networkManager';
import { ZeroconfService } from '../types/zeroconf';

export const useGameConnection = () => {
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [availableGames, setAvailableGames] = useState<ZeroconfService[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const roomCodeRef = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribe = NetworkManager.subscribe((payload) => {
            let formattedMsg = null;

            if (payload.type === 'SERVICE_FOUND') {
                setAvailableGames(prev => {
                    if (prev.find(s => s.name === payload.service.name)) {
                        return prev;
                    }
                    return [...prev, payload.service];
                });
                return;
            }

            if (payload.type === 'SERVICE_LOST') {
                setAvailableGames(prev => prev.filter(s => s.name !== payload.serviceName));
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
                case PROTOCOL.PLAYER_FINISHED:
                    formattedMsg = { type: 'PLAYER_FINISHED', name: payload.data };
                    break;
                case PROTOCOL.ROUND_START:
                    formattedMsg = { type: 'ROUND_START', id: parseInt(payload.data, 10) };
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
            // Don't call NetworkManager.stop() here - connection should persist across screens
        };
    }, []);

    const startHostingGame = async (roomCode: string, playerName: string) => {
        roomCodeRef.current = roomCode;
        await NetworkManager.createHost(12345, roomCode);
        // Don't broadcast yet - no clients connected
    };

    const joinGame = async (service: ZeroconfService, playerName: string) => {
        roomCodeRef.current = service.name;
        NetworkManager.connectToHost(service.host, service.port, () => {
            // Send join request to host once connected
            NetworkManager.broadcast(PROTOCOL.PLAYER_JOIN, playerName);
        });
    };

    const scanForGames = () => {
        setAvailableGames([]);
        setIsScanning(true);
        NetworkManager.startServiceDiscovery();
    };

    const stopScanning = () => {
        setIsScanning(false);
        NetworkManager.stopServiceDiscovery();
    }

    const broadcastGameState = async (state: string, data?: any) => {
        if (state === 'GAME_START') {
            NetworkManager.broadcast(PROTOCOL.GAME_START, '');
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
            NetworkManager.broadcast(PROTOCOL.PLAYER_FINISHED, data.name);
        }
    };

    const broadcastPlayerList = (players: any[]) => {
        NetworkManager.broadcast(PROTOCOL.PLAYER_LIST, JSON.stringify(players));
    };

    const disconnect = async () => {
        await NetworkManager.stop();
        // Clear lastMessage to prevent stale messages from triggering navigation
        setLastMessage(null);
    };

    const clearLastMessage = () => {
        setLastMessage(null);
    };

    return {
        lastMessage,
        isScanning,
        availableGames,
        startHostingGame,
        joinGame,
        scanForGames,
        stopScanning,
        sendGameAction,
        broadcastGameState,
        broadcastPlayerList,
        disconnect,
        clearLastMessage
    };
};
