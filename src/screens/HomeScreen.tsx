import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  JoinGame: undefined;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const handleNewGame = () => {
    navigation.navigate('NewGame');
  };

  const handleJoinGame = () => {
    navigation.navigate('JoinGame');
  };

  return (
    <View style={styles.container}>
      <PatternBackground speed={10} tileSize={42} gap={42} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Time's Up</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.newGameButton,
                pressed && styles.pressedButton,
              ]}
              onPress={handleNewGame}
            >
              <Text style={styles.buttonText}>New Game</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.joinGameButton,
                pressed && styles.pressedButton,
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
    paddingVertical: 60,
  },
  titleContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 1,
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
  newGameButton: {
    backgroundColor: colors.primary,
  },
  joinGameButton: {
    backgroundColor: colors.secondary,
  },
  pressedButton: {
    backgroundColor: colors.accent,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
