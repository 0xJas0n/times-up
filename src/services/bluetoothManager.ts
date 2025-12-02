import { BleManager, Device } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { Platform, PermissionsAndroid } from 'react-native';
import { encode, decode } from 'base-64';

// --- CONFIGURATION ---
const BASE_UUID_PREFIX = '0000';
const BASE_UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';

// Short keys to save bytes (Max 31 bytes payload!)
// t: type, p: payload, i: id
export type PacketType = 'HOST_STATE' | 'PLAYER_ACTION';

interface TransportPacket {
    t: PacketType;
    p: any;
    i?: string; // sender ID
}

class BluetoothManagerService {
    private manager: BleManager;
    private roomCode: string | null = null;
    private role: 'HOST' | 'CLIENT' | null = null;
    private isScanning = false;

    // We keep track of the last packet we saw from each device to avoid spamming UI
    private lastSeenPackets: Record<string, string> = {};

    private listeners: ((payload: any, senderId: string) => void)[] = [];

    constructor() {
        this.manager = new BleManager();
        BLEAdvertiser.setCompanyId(0x00E0);
    }

    // --- 1. SETUP & PERMISSIONS ---
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

    // --- 2. BROADCASTING (SENDING DATA) ---
    // In the real app, we update our "Broadcast" whenever our state changes.
    async broadcastStatus(type: PacketType, payload: any) {
        if (!this.roomCode) return;

        // 1. Pack data. Keep it TINY.
        // Example: { t: 'H', p: { r: 1 } } -> JSON
        const packet: TransportPacket = { t: type, p: payload };

        // We serialize to a string. Note: Bluetooth packets are small (31 bytes).
        // In a full production app, you might use a byte array or specialized encoder.
        // For now, we assume simple small JSON.
        const dataString = JSON.stringify(packet);
        const manufacturerData = this.stringToBytes(dataString);

        const serviceUUID = this.getRoomUUID(this.roomCode);

        try {
            // We stop previous broadcast to update data
            await BLEAdvertiser.stopBroadcast();
            await BLEAdvertiser.broadcast(serviceUUID, manufacturerData, {
                includeTxPowerLevel: false, // Save space
                includeDeviceName: false,   // Save space
            });
            console.log(`[BLE] Broadcasting: ${dataString}`);
        } catch (e) {
            console.warn('[BLE] Broadcast update failed', e);
        }
    }

    // --- 3. SCANNING (RECEIVING DATA) ---
    startScanning(roomCode: string) {
        this.roomCode = roomCode;
        if (this.isScanning) return;

        const serviceUUID = this.getRoomUUID(roomCode);
        console.log(`[BLE] Started scanning for Room ${roomCode}`);
        this.isScanning = true;

        this.manager.startDeviceScan([serviceUUID], { allowDuplicates: true }, (error, device) => {
            if (error) {
                console.warn('[BLE] Scan error', error);
                // In production, we might want to restart the scan after a delay
                return;
            }

            if (device && device.manufacturerData) {
                this.handleDeviceDiscovery(device);
            }
        });
    }

    private handleDeviceDiscovery(device: Device) {
        try {
            // Decode the Manufacturer Data (The "Payload")
            const rawBytes = decode(device.manufacturerData!);
            // Need to strip the first 2 bytes (Company ID) usually, but ble-plx might give raw.
            // Let's attempt to parse the string.
            // Note: In real production, we do robust byte parsing here.

            // Heuristic: Extract the JSON part.
            // React Native BLE PLX returns Base64. decode() gives binary string.
            // We look for the start of JSON '{'
            const jsonStartIndex = rawBytes.indexOf('{');
            if (jsonStartIndex === -1) return;

            const jsonString = rawBytes.substring(jsonStartIndex);

            // Deduplicate: Don't process the exact same packet 60 times a second
            const uniqueKey = device.id + jsonString;
            if (this.lastSeenPackets[device.id] === uniqueKey) return;
            this.lastSeenPackets[device.id] = uniqueKey;

            const packet: TransportPacket = JSON.parse(jsonString);

            // Notify Listeners (The UI)
            this.notifyListeners(packet.p, device.id);

        } catch (e) {
            // Ignore malformed packets (background noise)
        }
    }

    stop() {
        this.manager.stopDeviceScan();
        BLEAdvertiser.stopBroadcast();
        this.isScanning = false;
        this.roomCode = null;
    }

    // --- HELPERS ---
    private getRoomUUID(code: string): string {
        return `${BASE_UUID_PREFIX}${code}${BASE_UUID_SUFFIX}`;
    }

    private stringToBytes(str: string): number[] {
        // Simple ASCII conversion for JSON
        const bytes = [];
        // Add dummy company ID (2 bytes) at start if needed, or BLEAdvertiser handles it.
        // We just pass payload.
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
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