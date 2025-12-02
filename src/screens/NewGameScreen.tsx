import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateRoomCode } from '../utils/generateRoomCode';

type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  Room: { roomCode: string; username: string; isHost: boolean };
};

type NewGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewGame'>;
};

export default function NewGameScreen({ navigation }: NewGameScreenProps) {
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    setRoomName(generateRoomCode());
  }, []);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      Alert.alert('Missing Name', 'Please enter your name to create a room.');
      return;
    }
    navigation.navigate('Room', {
      roomCode: roomName,
      username: username.trim(),
      isHost: true
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>New Game</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Room code</Text>
              </View>
              <TextInput
                style={styles.input}
                value={roomName}
                maxLength={4}
                editable={false}
                placeholder="Room code"
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
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
              onPress={handleCreateRoom}
            >
              <Text style={styles.buttonText}>Create Room</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
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
    backgroundColor: '#2DD881',
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
  createButton: {
    backgroundColor: '#2DD881',
  },
  createButtonPressed: {
    backgroundColor: '#25B86D',
    opacity: 0.8,
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
  },
  cancelButtonPressed: {
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
