import { useEffect, useState } from 'react';
import { BluetoothManager, PROTOCOL } from '../services/bluetoothManager';

export const useGameConnection = () => {
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Subscribe to incoming packets
        const unsubscribe = BluetoothManager.subscribe((payload, senderId) => {
            let formattedMsg = null;

            switch (payload.type) {
                case PROTOCOL.HOST_LOBBY: // '0'
                    // CRITICAL FIX: The Host is broadcasting "0|HostName".
                    // We treat this as a JOIN_REQUEST so Clients see the Host in the list.
                    formattedMsg = {
                        type: 'JOIN_REQUEST',
                        name: payload.data,
                        isHost: true
                    };
                    break;

                case PROTOCOL.HOST_GAME_START: // '1'
                    formattedMsg = { status: 'GAME_START' };
                    break;

                case PROTOCOL.PLAYER_JOIN: // '2'
                    formattedMsg = {
                        type: 'JOIN_REQUEST',
                        name: payload.data,
                        isHost: false
                    };
                    break;

                case PROTOCOL.PLAYER_FINISHED: // '3'
                    formattedMsg = { type: 'FINISHED', name: payload.data };
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

    // --- HOST FUNCTIONS ---
    // UPDATE: Host now broadcasts their name too!
    const startHostingGame = async (roomCode: string, playerName: string) => {
        const granted = await BluetoothManager.requestPermissions();
        if (!granted) return;

        BluetoothManager.startScanning(roomCode);
        setIsScanning(true);

        // Broadcast "0|HostName" so clients know who the host is
        await BluetoothManager.broadcastStatus(PROTOCOL.HOST_LOBBY, playerName);
    };

    const broadcastGameState = async (state: string) => {
        if (state === 'GAME_START') {
            await BluetoothManager.broadcastStatus(PROTOCOL.HOST_GAME_START, '');
        }
    };

    // --- CLIENT FUNCTIONS ---
    const joinGame = async (roomCode: string, playerName: string) => {
        const granted = await BluetoothManager.requestPermissions();
        if (!granted) return;

        BluetoothManager.startScanning(roomCode);
        setIsScanning(true);

        // Broadcast "2|ClientName"
        await BluetoothManager.broadcastStatus(PROTOCOL.PLAYER_JOIN, playerName);
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