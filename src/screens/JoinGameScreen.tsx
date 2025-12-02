import {use, useState} from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  JoinGame: undefined;
  Room: { roomCode: string; username: string; isHost: boolean };
};

type JoinGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGame'>;
};

export default function JoinGameScreen({ navigation }: JoinGameScreenProps) {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleRoomCodeChange = (text: string) => {
    // Only allow alphanumeric characters and convert to uppercase
    const hex = text.replace(/[^a-fA-F0-9]/g, '');
    setRoomCode(hex.toUpperCase());
  };

  const handleJoinRoom = () => {
    if (roomCode.length !== 4) {
      Alert.alert('Invalid Room Code', 'Please enter a 4-character room code.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Missing Name', 'Please enter your name to join.');
      return;
    }

    // Truncate username to 8 chars to fit in Bluetooth Packet
    const safeName = username.trim().substring(0, 8);

    navigation.navigate('Room', {
      roomCode,
      username: safeName,
      isHost: false
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Join Game</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Room code</Text>
              </View>
              <TextInput
                style={styles.input}
                value={roomCode}
                onChangeText={handleRoomCodeChange}
                maxLength={4}
                autoCapitalize="characters"
                placeholder="Enter room code"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Your name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                maxLength={20}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.joinButton,
                pressed && styles.joinButtonPressed,
              ]}
              onPress={handleJoinRoom}
            >
              <Text style={styles.buttonText}>Join</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={handleBack}
            >
              <Text style={styles.buttonText}>Back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  titleContainer: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 24,
  },
  inputGroup: {
    width: '100%',
  },
  labelContainer: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  input: {
    backgroundColor: '#E8E8E8',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  joinButton: {
    backgroundColor: '#3B82F6',
  },
  joinButtonPressed: {
    backgroundColor: '#2563EB',
    opacity: 0.8,
  },
  backButton: {
    backgroundColor: '#E74C3C',
  },
  backButtonPressed: {
    backgroundColor: '#C0392B',
    opacity: 0.8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
