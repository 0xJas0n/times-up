import Zeroconf from 'react-native-zeroconf';
import TcpSocket from 'react-native-tcp-socket';

const SERVICE_DOMAIN = 'local.';
const SERVICE_TYPE = 'timesup-game';

export const PROTOCOL = {
    PLAYER_JOIN: 'PLAYER_JOIN',           // Client -> Host: player name
    PLAYER_LIST: 'PLAYER_LIST',           // Host -> All: JSON array of players
    PLAYER_DISCONNECT: 'PLAYER_DISCONNECT', // Internal: player disconnected
    GAME_START: 'GAME_START',             // Host -> All: game starting
    PLAYER_FINISHED: 'PLAYER_FINISHED',   // Client -> Host: player name who finished
    ROUND_START: 'ROUND_START',           // Host -> All: round ID
    ROUND_OVER: 'ROUND_OVER',             // Host -> All: loser name
    HOST_CANCEL: 'HOST_CANCEL',           // Host -> All: host cancelled
};

class NetworkManagerService {
    private zeroconf: Zeroconf;
    private server: TcpSocket.Server | null = null;
    private clients: TcpSocket.Socket[] = [];
    private clientPlayerMap: Map<TcpSocket.Socket, string> = new Map(); // Track which socket belongs to which player
    private client: TcpSocket.Socket | null = null;
    private roomCode: string | null = null;
    private listeners: ((payload: any, senderId: string) => void)[] = [];

    constructor() {
        this.zeroconf = new Zeroconf();
        this.zeroconf.on('start', () => console.log('[Zeroconf] Scan started.'));
        this.zeroconf.on('stop', () => console.log('[Zeroconf] Scan stopped.'));
        this.zeroconf.on('resolved', (service) => {
            this.notifyListeners({ type: 'SERVICE_FOUND', service }, service.host);
        });
        this.zeroconf.on('remove', (serviceName) => {
            this.notifyListeners({ type: 'SERVICE_LOST', serviceName }, 'zeroconf');
        });
        this.zeroconf.on('error', (err) => console.error('[Zeroconf] Error:', err));
    }

    startServiceDiscovery() {
        this.zeroconf.scan(SERVICE_TYPE, 'tcp', SERVICE_DOMAIN);
    }

    stopServiceDiscovery() {
        this.zeroconf.stop();
    }

    async createHost(port: number, roomCode: string) {
        // Prevent creating server if one already exists
        if (this.server) {
            console.warn('Server already exists, stopping old server first');
            this.stop();
        }

        this.roomCode = roomCode;
        this.zeroconf.publishService(SERVICE_TYPE, 'tcp', SERVICE_DOMAIN, roomCode, port, {});
        this.server = TcpSocket.createServer((socket) => {
            this.clients.push(socket);
            socket.on('data', (data) => {
                this.handleData(data, socket.remoteAddress || '', socket);
            });
            socket.on('error', (error) => {
                console.log('An error occurred with client socket', error);
                this.handleClientDisconnect(socket);
            });
            socket.on('close', () => {
                console.log('Closed connection with', socket.remoteAddress);
                this.handleClientDisconnect(socket);
            });
        }).listen({ port, host: '0.0.0.0' });
    }

    private handleClientDisconnect(socket: TcpSocket.Socket) {
        const playerName = this.clientPlayerMap.get(socket);
        this.clients = this.clients.filter(s => s !== socket);
        this.clientPlayerMap.delete(socket);

        // Notify listeners that a player disconnected
        if (playerName) {
            this.notifyListeners({ type: PROTOCOL.PLAYER_DISCONNECT, data: playerName }, 'server');
        }
    }

    connectToHost(host: string, port: number, onConnected?: () => void) {
        // Prevent creating client if one already exists
        if (this.client) {
            console.warn('Client already exists, closing old connection first');
            try {
                // Remove all event listeners before destroying
                this.client.removeAllListeners();
                this.client.destroy();
            } catch (e) {
                console.error('Error destroying old client:', e);
            }
            this.client = null;
        }

        this.client = TcpSocket.createConnection({ port, host }, () => {
            console.log('Connected to server!');
            if (onConnected) {
                onConnected();
            }
        });

        this.client.on('data', (data) => {
            this.handleData(data, host);
        });

        this.client.on('error', (error) => {
            console.log(error);
        });

        this.client.on('close', () => {
            console.log('Connection closed');
        });
    }

    private handleData(data: Buffer | string, senderId: string, socket?: TcpSocket.Socket) {
        try {
            const message = data.toString();
            const parts = message.split('|');
            if (parts.length < 2) return;

            const type = parts[0];
            const payload = parts.slice(1).join('|');

            // Track player name for this socket when they join
            if (type === PROTOCOL.PLAYER_JOIN && socket) {
                this.clientPlayerMap.set(socket, payload);
            }

            this.notifyListeners({ type, data: payload }, senderId);
        } catch (e) {
            // Ignore parse errors
        }
    }

    broadcast(type: string, payload: any) {
        const message = `${type}|${payload}`;
        if (this.server) {
            this.clients.forEach(client => {
                client.write(message);
            });
        } else if (this.client) {
            this.client.write(message);
        }
    }

    subscribe(callback: (payload: any, senderId: string) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(payload: any, senderId: string) {
        this.listeners.forEach(l => l(payload, senderId));
    }

    async stop() {
        this.stopServiceDiscovery();

        // Unpublish service FIRST to prevent new connections
        if (this.roomCode) {
            this.zeroconf.unpublishService(this.roomCode);
            this.roomCode = null;
        }

        if (this.server) {
            // Notify clients before disconnecting
            this.broadcast(PROTOCOL.HOST_CANCEL, '');

            // Wait for the message to be sent before destroying connections
            await new Promise(resolve => setTimeout(resolve, 200));

            // Close all client connections
            this.clients.forEach(client => {
                try {
                    client.destroy();
                } catch (e) {
                    console.error('Error closing client socket', e);
                }
            });
            this.clients = [];
            this.clientPlayerMap.clear();

            // Close the server
            if (this.server) {
                this.server.close();
                this.server = null;
            }
        } else if (this.client) {
            this.client.destroy();
            this.client = null;
        }
        this.zeroconf.stop();
    }
}

export const NetworkManager = new NetworkManagerService();
