import { useEffect, useState, useCallback } from 'react';
import { BluetoothManager } from '../services/BluetoothManager';
import { GameMessage } from '../types/BluetoothTypes';

export const useGameConnection = () => {
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Subscribe to incoming packets from the Manager
        const unsubscribe = BluetoothManager.subscribe((payload, senderId) => {
            console.log('[GameHook] Update from', senderId, payload);
            setLastMessage(payload);
        });

        return () => {
            unsubscribe();
            // Optional: Stop everything when unmounting the main game container
            // BluetoothManager.stop();
        };
    }, []);

    // --- HOST FUNCTIONS ---
    const startHostingGame = async (roomCode: string) => {
        const granted = await BluetoothManager.requestPermissions();
        if (!granted) return;

        // 1. Start scanning for players immediately
        BluetoothManager.startScanning(roomCode);
        setIsScanning(true);

        // 2. Broadcast that the lobby is open
        // 'LOBBY' status tells players they can join
        await BluetoothManager.broadcastStatus('HOST_STATE', { status: 'LOBBY' });
    };

    // --- CLIENT FUNCTIONS ---
    const joinGame = async (roomCode: string, playerName: string) => {
        const granted = await BluetoothManager.requestPermissions();
        if (!granted) return;

        // 1. Start scanning (to see when Host starts the game)
        BluetoothManager.startScanning(roomCode);
        setIsScanning(true);

        // 2. Broadcast our presence so Host sees us
        await BluetoothManager.broadcastStatus('PLAYER_ACTION', {
            type: 'JOIN_REQUEST',
            name: playerName
        });
    };

    // --- GAMEPLAY FUNCTIONS ---
    // Call this when a player finishes a challenge or gets the bomb
    const sendGameAction = async (actionType: string, data: any = {}) => {
        await BluetoothManager.broadcastStatus('PLAYER_ACTION', {
            type: actionType,
            ...data
        });
    };

    // Host calls this to update everyone (e.g. "Next Challenge")
    const broadcastGameState = async (state: string, data: any = {}) => {
        await BluetoothManager.broadcastStatus('HOST_STATE', {
            status: state,
            ...data
        });
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