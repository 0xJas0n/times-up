import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const handleNewGame = () => {
    navigation.navigate('NewGame');
  };

  const handleJoinGame = () => {
    console.log('Join Game pressed');
    // TODO: Navigate to join game screen
  };

  return (
    <View style={styles.container}>
      <PatternBackground speed={30} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Time's Up</Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleNewGame}
            >
              <Text style={styles.buttonText}>New Game</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleJoinGame}
            >
              <Text style={styles.buttonText}>Join Game</Text>
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
    paddingVertical: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#D35400',
    marginBottom: 60,
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'TheBringa',
    textShadowColor: '#2B2B2B',
    textShadowOffset: { width: -2, height: -2 },
    textShadowRadius: 0,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  button: {
    backgroundColor: '#D35400',
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
  buttonPressed: {
    backgroundColor: '#B84600',
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
