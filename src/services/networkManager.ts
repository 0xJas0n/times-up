import Zeroconf from 'react-native-zeroconf';
import TcpSocket from 'react-native-tcp-socket';

const SERVICE_DOMAIN = 'local.';

export const PROTOCOL = {
    HOST_LOBBY: '0',
    HOST_GAME_START: '1',
    PLAYER_JOIN: '2',
    PLAYER_FINISHED: '3',
    HOST_START_ROUND: '4',
    HOST_ROUND_OVER: '5',
};

class NetworkManagerService {
    private zeroconf: Zeroconf;
    private server: TcpSocket.Server | null = null;
    private client: TcpSocket.Socket | null = null;
    private listeners: ((payload: any, senderId: string) => void)[] = [];

    constructor() {
        this.zeroconf = new Zeroconf();
        this.zeroconf.on('start', () => console.log('[Zeroconf] Scan started.'));
        this.zeroconf.on('stop', () => console.log('[Zeroconf] Scan stopped.'));
        this.zeroconf.on('resolved', (service) => {
            this.notifyListeners({ type: 'SERVICE_FOUND', service }, service.host);
        });
        this.zeroconf.on('error', (err) => console.error('[Zeroconf] Error:', err));
    }

    startServiceDiscovery() {
        this.zeroconf.scan('http', 'tcp', SERVICE_DOMAIN);
    }

    stopServiceDiscovery() {
        this.zeroconf.stop();
    }

    async createHost(port: number, roomCode: string) {
        this.zeroconf.publishService('http', 'tcp', SERVICE_DOMAIN, roomCode, port, {});
        this.server = TcpSocket.createServer((socket) => {
            socket.on('data', (data) => {
                this.handleData(data, socket.remoteAddress || '');
            });
            socket.on('error', (error) => {
                console.log('An error ocurred with client socket', error);
            });
            socket.on('close', () => {
                console.log('Closed connection with', socket.remoteAddress);
            });
        }).listen({ port, host: '0.0.0.0' });
    }

    connectToHost(host: string, port: number) {
        this.client = TcpSocket.createConnection({ port, host }, () => {
            console.log('Connected to server!');
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

    private handleData(data: Buffer | string, senderId: string) {
        try {
            const message = data.toString();
            const parts = message.split('|');
            if (parts.length < 2) return;

            const type = parts[0];
            const payload = parts.slice(1).join('|');

            this.notifyListeners({ type, data: payload }, senderId);
        } catch (e) {
            // Ignore parse errors
        }
    }

    broadcast(type: string, payload: any) {
        const message = `${type}|${payload}`;
        if (this.server) {
            // Host broadcasts to all clients
        } else if (this.client) {
            // Client sends to host
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

    stop() {
        this.stopServiceDiscovery();
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
        this.zeroconf.stop();
        // this.zeroconf.unpublishService(this.roomCode); // roomCode is not available here
    }
}

export const NetworkManager = new NetworkManagerService();
