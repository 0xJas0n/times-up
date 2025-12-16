import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateRoomCode } from '../utils/generateRoomCode';
import { colors } from '../theme/colors';
import Header from '../components/Header';

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

  return (
    <View style={styles.container}>
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <Header title="New Game" />
        <View style={styles.content}>
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
                placeholderTextColor={colors.darkGray}
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
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 60,
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
    backgroundColor: colors.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
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
    backgroundColor: colors.primary,
  },
  createButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
