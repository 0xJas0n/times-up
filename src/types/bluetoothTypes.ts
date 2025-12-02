export type PlayerRole = 'HOST' |'CLIENT';

export type MessageType =
    | 'JOIN_REQUEST'
    | 'PLAYER_LIST'
    | 'START_GAME'
    | 'CHALLENGE_DATA'
    | 'CHALLENGE_DONE'
    | 'BOMB_UPDATE'
    | 'GAME_OVER';

export interface GameMessage {
    type: MessageType;
    payload?: any;
    timestamp?: number;
}

export interface Player {
    id: string;
    name: string;
    avatarId?: string;
    isHost: boolean;
    status: 'active' | 'eliminated' | 'winner';
}

export const BLE_CONFIG = {
    // We use one Service UUID for the Game Room
    SERVICE_UUID_PREFIX: '0000',
    SERVICE_UUID_SUFFIX: '-0000-1000-8000-00805f9b34fb',

    // Characteristic for Host broadcasting to Clients (Notify)
    CHAR_BROADCAST: '00001111-0000-1000-8000-00805f9b34fb',

    // Characteristic for Clients reporting to Host (Write)
    CHAR_ACTION: '00002222-0000-1000-8000-00805f9b34fb',
}