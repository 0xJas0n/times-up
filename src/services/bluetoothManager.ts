// ... existing imports
import { BleManager, Device } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { Platform, PermissionsAndroid } from 'react-native';
import { encode, decode } from 'base-64';

// --- CONFIGURATION ---
const APP_SERVICE_UUID = '0000FF00-0000-1000-8000-00805f9b34fb';

// --- TINY PROTOCOL ---
export const PROTOCOL = {
    HOST_LOBBY: '0',
    HOST_GAME_START: '1',
    PLAYER_JOIN: '2',
    PLAYER_FINISHED: '3',
};

class BluetoothManagerService {
    private manager: BleManager;
    private roomCode: string | null = null;
    private isScanning = false;
    private lastSeenPackets: Record<string, string> = {};
    private listeners: ((payload: any, senderId: string) => void)[] = [];

    constructor() {
        this.manager = new BleManager();
        BLEAdvertiser.setCompanyId(0x00E0);
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);
                return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted';
            } else {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true;
    }

    // --- BROADCASTING ---
    async broadcastStatus(actionKey: string, data: any = '') {
        if (!this.roomCode) return;

        let dataString = data;
        if (typeof data === 'object') {
            try {
                dataString = JSON.stringify(data);
            } catch (e) {
                dataString = '';
            }
        }

        const payload = `${this.roomCode}|${actionKey}|${dataString}`;
        const manufacturerData = this.stringToBytes(payload);

        try {
            await BLEAdvertiser.stopBroadcast();
            await BLEAdvertiser.broadcast(APP_SERVICE_UUID, manufacturerData, {
                includeTxPowerLevel: false,
                includeDeviceName: false,
            });
            // console.log(`[BLE] Broadcasting: ${payload}`);
        } catch (e) {
            console.warn('[BLE] Broadcast failed', e);
        }
    }

    // --- SCANNING ---
    startScanning(roomCode: string) {
        this.roomCode = roomCode;
        if (this.isScanning) return;

        console.log(`[BLE] Scanning for Room ${roomCode}...`);
        this.isScanning = true;

        // Scan for ALL devices (null) to ensure we hit the manufacturer data on all Android versions
        this.manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
            if (error) {
                return;
            }

            if (device && device.manufacturerData) {
                this.handleDeviceDiscovery(device);
            }
        });
    }

    private handleDeviceDiscovery(device: Device) {
        try {
            const rawString = decode(device.manufacturerData!);
            const cleanString = rawString.replace(/[^\x20-\x7E]/g, '');

            // Optimization: Packet must contain at least RoomCode (4) + Separator (1) + Type (1)
            if (cleanString.length < 6) return;

            const uniqueKey = device.id + cleanString;
            if (this.lastSeenPackets[device.id] === uniqueKey) return;
            this.lastSeenPackets[device.id] = uniqueKey;

            // PARSE: "ROOM|TYPE|DATA"
            const parts = cleanString.split('|');
            if (parts.length < 2) return;

            const incomingRoom = parts[0];
            const type = parts[1];
            const data = parts.slice(2).join('|');

            // Filter: Only accept packets for our room
            if (incomingRoom !== this.roomCode) return;

            this.notifyListeners({ type, data }, device.id);

        } catch (e) {
            // Ignore parse errors
        }
    }

    stop() {
        this.manager.stopDeviceScan();
        BLEAdvertiser.stopBroadcast();
        this.isScanning = false;
        this.roomCode = null;
    }

    private stringToBytes(str: string): number[] {
        const bytes = [];
        for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
        return bytes;
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
}

export const BluetoothManager = new BluetoothManagerService();