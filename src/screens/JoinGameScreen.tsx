import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  JoinGame: undefined;
};

type JoinGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGame'>;
};

export default function JoinGameScreen({ navigation }: JoinGameScreenProps) {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleRoomCodeChange = (text: string) => {
    // Only allow alphanumeric characters and convert to uppercase
    const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, '');
    setRoomCode(alphanumeric.toUpperCase());
  };

  const handleJoinRoom = () => {
    console.log('Room Code:', roomCode);
    console.log('Username:', username);
    // TODO: Implement room joining logic
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Join Game</Text>

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
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2DD881',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#1A4D2E',
    textShadowOffset: { width: -2, height: -2 },
    textShadowRadius: 0,
    marginBottom: 20,
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
    backgroundColor: '#2DD881',
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
    backgroundColor: '#2DD881',
  },
  joinButtonPressed: {
    backgroundColor: '#25B86D',
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
