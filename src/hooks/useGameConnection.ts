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
                case PROTOCOL.HOST_CANCEL_GAME:
                    formattedMsg = { status: 'HOST_CANCELLED' };
                    break;
                case PROTOCOL.HOST_LOBBY:
                    formattedMsg = { type: 'JOIN_REQUEST', name: payload.data, isHost: true };
                    break;
                case PROTOCOL.HOST_GAME_START:
                    formattedMsg = { status: 'GAME_START' };
                    break;
                case PROTOCOL.PLAYER_JOIN:
                    formattedMsg = { type: 'JOIN_REQUEST', name: payload.data, isHost: false };
                    break;
                case PROTOCOL.PLAYER_FINISHED:
                    formattedMsg = { type: 'FINISHED', name: payload.data };
                    break;
                case PROTOCOL.HOST_START_ROUND:
                    formattedMsg = { status: 'START_ROUND', id: parseInt(payload.data, 10) };
                    break;
                case PROTOCOL.HOST_ROUND_OVER:
                    formattedMsg = { status: 'ROUND_OVER', loser: payload.data };
                    break;
            }

            if (formattedMsg) {
                setLastMessage(formattedMsg);
            }
        });

        return () => {
            unsubscribe();
            NetworkManager.stop();
        };
    }, []);

    const startHostingGame = async (roomCode: string, playerName: string) => {
        roomCodeRef.current = roomCode;
        await NetworkManager.createHost(12345, roomCode);
        NetworkManager.broadcast(PROTOCOL.HOST_LOBBY, playerName);
    };

    const joinGame = async (service: ZeroconfService, playerName: string) => {
        roomCodeRef.current = service.name;
        NetworkManager.connectToHost(service.host, service.port);
        NetworkManager.broadcast(PROTOCOL.PLAYER_JOIN, playerName);
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
            NetworkManager.broadcast(PROTOCOL.HOST_GAME_START, '');
        }

        if (state === 'START_ROUND') {
            NetworkManager.broadcast(PROTOCOL.HOST_START_ROUND, data.id.toString());
        }

        if (state === 'ROUND_OVER') {
            NetworkManager.broadcast(PROTOCOL.HOST_ROUND_OVER, data.loser);
        }
    };

    const sendGameAction = async (actionType: string, data: any) => {
        if (actionType === 'FINISHED') {
            NetworkManager.broadcast(PROTOCOL.PLAYER_FINISHED, data.name);
        }
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
        broadcastGameState
    };
};
