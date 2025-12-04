import { useEffect, useState } from 'react';
import { BluetoothManager, PROTOCOL } from '../services/bluetoothManager';

export const useGameConnection = () => {
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const unsubscribe = BluetoothManager.subscribe((payload, senderId) => {
            let formattedMsg = null;

            switch (payload.type) {
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
        };
    }, []);

    const startHostingGame = async (roomCode: string, playerName: string) => {
        const granted = await BluetoothManager.requestPermissions();

        if (!granted) {
            return;
        }

        BluetoothManager.startScanning(roomCode);
        setIsScanning(true);
        await BluetoothManager.broadcastStatus(PROTOCOL.HOST_LOBBY, playerName);
    };

    const joinGame = async (roomCode: string, playerName: string) => {
        const granted = await BluetoothManager.requestPermissions();

        if (!granted) {
            return;
        }

        BluetoothManager.startScanning(roomCode);
        setIsScanning(true);
        await BluetoothManager.broadcastStatus(PROTOCOL.PLAYER_JOIN, playerName);
    };

    const broadcastGameState = async (state: string, data?: any) => {
        if (state === 'GAME_START') {
            await BluetoothManager.broadcastStatus(PROTOCOL.HOST_GAME_START, '');
        }

        if (state === 'START_ROUND') {
            await BluetoothManager.broadcastStatus(PROTOCOL.HOST_START_ROUND, data.id.toString());
        }

        if (state === 'ROUND_OVER') {
            await BluetoothManager.broadcastStatus(PROTOCOL.HOST_ROUND_OVER, data.loser);
        }
    };

    const sendGameAction = async (actionType: string, data: any) => {
        if (actionType === 'FINISHED') {
            await BluetoothManager.broadcastStatus(PROTOCOL.PLAYER_FINISHED, data.name);
        }
    };

    return {
        lastMessage,
        isScanning,
        startHostingGame,
        joinGame,
        sendGameAction,
        broadcastGameState
    };
};