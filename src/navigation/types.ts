import {ZeroconfService} from '../types/zeroconf';

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
}

export type RootStackParamList = {
    Home: undefined;
    NewGame: undefined;
    JoinGame: undefined;
    Room: {
        roomCode: string;
        username: string;
        isHost: boolean;
        service?: ZeroconfService;
    };
    Game: {
        roomCode: string;
        username: string;
        isHost: boolean;
        players: Player[];
    };
    Winner: {
        winnerName: string
    };
};
