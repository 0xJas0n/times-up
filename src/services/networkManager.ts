import Zeroconf from 'react-native-zeroconf';
import TcpSocket from 'react-native-tcp-socket';

const SERVICE_DOMAIN = 'local.';
const SERVICE_TYPE = 'timesup-game';

export const PROTOCOL = {
    PLAYER_JOIN: 'PLAYER_JOIN',                 // Client -> Host: player name
    PLAYER_LIST: 'PLAYER_LIST',                 // Host -> All: JSON array of players
    PLAYER_DISCONNECT: 'PLAYER_DISCONNECT',     // Internal: player disconnected
    GAME_START: 'GAME_START',                   // Host -> All: game starting
    PLAYER_READY: 'PLAYER_READY',               // Client -> Host: player ready after animations complete
    ROUND_START: 'ROUND_START',                 // Host -> All: round ID - clients countdown then start
    PLAYER_FINISHED: 'PLAYER_FINISHED',         // Client -> Host: player name who finished
    ROUND_OVER: 'ROUND_OVER',                   // Host -> All: loser name
    PLAYER_ELIMINATED: 'PLAYER_ELIMINATED',     // Host -> All: eliminated player name
    GAME_WINNER: 'GAME_WINNER',                 // Host -> All: winner name
    HOST_CANCEL: 'HOST_CANCEL',                 // Host -> All: host cancelled
};

class NetworkManagerService {
    private zeroconf: Zeroconf;
    private server: TcpSocket.Server | null = null;
    private clients: TcpSocket.Socket[] = [];
    private clientPlayerMap: Map<TcpSocket.Socket, string> = new Map();
    private client: TcpSocket.Socket | null = null;
    private roomCode: string | null = null;
    private listeners: ((payload: any, senderId: string) => void)[] = [];
    private gameStarted: boolean = false;

    // Singleton message state that persists across screen navigation
    private currentMessage: any = null;

    // Buffer for incomplete messages
    private clientBuffer: string = '';
    private serverBuffers: Map<TcpSocket.Socket, string> = new Map();

    constructor() {
        this.zeroconf = new Zeroconf();
    }

    // Note: Currently unused - clients handle their own service discovery via JoinGameScreen.
    // Kept for potential future centralized discovery implementation.
    startServiceDiscovery() {
        this.zeroconf.scan(SERVICE_TYPE, 'tcp', SERVICE_DOMAIN);
    }

    stopServiceDiscovery() {
        this.zeroconf.stop();
    }

    async createHost(port: number, roomCode: string) {
        // Prevent creating server if one already exists
        if (this.server) {
            await this.stop();
        }

        this.roomCode = roomCode;
        this.gameStarted = false;
        this.zeroconf.publishService(SERVICE_TYPE, 'tcp', SERVICE_DOMAIN, roomCode, port, {});
        this.server = TcpSocket.createServer((socket) => {
            this.clients.push(socket);
            socket.on('data', (data) => {
                this.handleData(data, socket.remoteAddress || '', socket);
            });
            socket.on('error', (error) => {
                console.error('[NetworkManager] Client socket error:', error);
                this.handleClientDisconnect(socket);
            });
            socket.on('close', () => {
                this.handleClientDisconnect(socket);
            });
        }).listen({ port, host: '0.0.0.0' });
    }

    private handleClientDisconnect(socket: TcpSocket.Socket) {
        const playerName = this.clientPlayerMap.get(socket);
        this.clients = this.clients.filter(s => s !== socket);
        this.clientPlayerMap.delete(socket);
        this.serverBuffers.delete(socket);

        if (playerName) {
            this.notifyListeners({ type: PROTOCOL.PLAYER_DISCONNECT, data: playerName }, 'server');
        }
    }

    connectToHost(host: string, port: number, onConnected?: () => void) {
        if (this.client) {
            try {
                this.client.removeAllListeners();
                this.client.destroy();
            } catch (e) {
                console.error('[NetworkManager] Error destroying old client:', e);
            }
            this.client = null;
        }

        const socket = TcpSocket.createConnection({ port, host }, () => {
            if (onConnected) {
                onConnected();
            }
        });

        // Set up event listeners BEFORE assigning to this.client
        socket.on('data', (data) => {
            this.handleData(data, host);
        });

        socket.on('error', (error) => {
            console.error('[NetworkManager] Client socket error:', error);
        });

        socket.on('close', (hadError) => {
            if (hadError) {
                console.error('[NetworkManager] Client socket closed with error');
            }
        });

        // Assign to this.client AFTER setting up listeners
        this.client = socket;
    }

    private handleData(data: Buffer | string, senderId: string, socket?: TcpSocket.Socket) {
        try {
            const chunk = data.toString();

            // Get the appropriate buffer
            let buffer = socket ? (this.serverBuffers.get(socket) || '') : this.clientBuffer;
            buffer += chunk;

            // Split by newline delimiter to get complete messages
            const messages = buffer.split('\n');

            // Last element might be incomplete, save it for next data event
            const incompleteMessage = messages.pop() || '';

            // Store buffer back
            if (socket) {
                this.serverBuffers.set(socket, incompleteMessage);
            } else {
                this.clientBuffer = incompleteMessage;
            }

            // Process each complete message
            for (const message of messages) {
                if (!message.trim()) continue; // Skip empty messages

                const parts = message.split('|');
                if (parts.length < 2) continue;

                const type = parts[0];
                const payload = parts.slice(1).join('|');

                // Track player name for this socket when they join
                if (type === PROTOCOL.PLAYER_JOIN && socket) {
                    // If the game already started, refuse late joins by closing the socket
                    if (this.gameStarted) {
                        try {
                            socket.destroy();
                        } catch (e) {
                            console.error('[NetworkManager] Error destroying late join socket:', e);
                        }
                        continue;
                    }
                    this.clientPlayerMap.set(socket, payload);
                }

                this.notifyListeners({ type, data: payload }, senderId);
            }
        } catch (e) {
            console.error('[NetworkManager] Error handling data:', e);
        }
    }

    broadcast(type: string, payload: any) {
        // Add newline delimiter to separate messages in the TCP stream
        const message = `${type}|${payload}\n`;
        // If host starts the game, immediately hide the service so it can't be discovered anymore
        if (type === PROTOCOL.GAME_START && this.server) {
            this.gameStarted = true;
            if (this.roomCode) {
                try {
                    this.zeroconf.unpublishService(this.roomCode);
                } catch (e) {
                    console.error('[NetworkManager] Error unpublishing service on game start:', e);
                }
            }
        }
        if (this.server) {
            this.clients.forEach((client) => {
                try {
                    client.write(message);
                } catch (e) {
                    console.error('[NetworkManager] Error writing to client:', e);
                }
            });
        } else if (this.client) {
            try {
                this.client.write(message);
            } catch (e) {
                console.error('[NetworkManager] Error writing to server:', e);
            }
        }
    }

    subscribe(callback: (payload: any, senderId: string) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(payload: any, senderId: string) {
        // Store the message in singleton state
        this.currentMessage = payload;
        this.listeners.forEach(l => l(payload, senderId));
    }

    getCurrentMessage() {
        return this.currentMessage;
    }

    clearCurrentMessage() {
        this.currentMessage = null;
    }

    async stop() {
        this.stopServiceDiscovery();

        if (this.roomCode) {
            this.zeroconf.unpublishService(this.roomCode);
            this.roomCode = null;
        }

        if (this.server) {
            this.broadcast(PROTOCOL.HOST_CANCEL, '');

            // Wait for the message to be sent before destroying connections
            await new Promise(resolve => setTimeout(resolve, 200));

            // Close all client connections
            this.clients.forEach(client => {
                try {
                    client.destroy();
                } catch (e) {
                    console.error('[NetworkManager] Error closing client socket:', e);
                }
            });
            this.clients = [];
            this.clientPlayerMap.clear();
            this.serverBuffers.clear();

            if (this.server) {
                this.server.close();
                this.server = null;
            }
        } else if (this.client) {
            this.client.destroy();
            this.client = null;
            this.clientBuffer = '';
        }
        this.zeroconf.stop();
    }
}

export const NetworkManager = new NetworkManagerService();
