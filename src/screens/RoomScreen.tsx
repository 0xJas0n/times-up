import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  JoinGame: undefined;
  Room: { roomCode: string; username: string };
};

type RoomScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Room'>;
  route: RouteProp<RootStackParamList, 'Room'>;
};

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export default function RoomScreen({ navigation, route }: RoomScreenProps) {
  const { roomCode, username } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Automatically add the creator as the first player (host)
    addPlayer(username, true);
  }, []);

  /**
   * Adds a new player to the room
   * @param name - The player's name
   * @param isHost - Whether the player is the host (default: false)
   */
  const addPlayer = (name: string, isHost: boolean = false) => {
    const newPlayer: Player = {
      id: Date.now().toString() + Math.random().toString(36),
      name,
      isHost,
    };
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
  };


  const handleStart = () => {
    navigation.navigate('Game', { roomCode, username, players });
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
            <Text style={styles.title}>Room #{roomCode}</Text>
          </View>

          <View style={styles.playersContainer}>
            <View style={styles.playersHeader}>
              <Text style={styles.playersHeaderText}>Players</Text>
            </View>

            <ScrollView
              style={styles.playersList}
              contentContainerStyle={styles.playersListContent}
              showsVerticalScrollIndicator={false}
            >
              {players.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Waiting for players...</Text>
                </View>
              ) : (
                players.map((player) => (
                  <View key={player.id} style={styles.playerCard}>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      {player.isHost && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>Host</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
              onPress={handleStart}
            >
              <Text style={styles.buttonText}>Start</Text>
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
  playersContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    marginVertical: 20,
  },
  playersHeader: {
    backgroundColor: '#2DD881',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  playersHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  playersList: {
    flex: 1,
    width: '100%',
  },
  playersListContent: {
    gap: 12,
    paddingBottom: 20,
  },
  playerCard: {
    backgroundColor: '#E8E8E8',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  hostBadge: {
    backgroundColor: '#2DD881',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  hostBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
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
  startButton: {
    backgroundColor: '#2DD881',
  },
  startButtonPressed: {
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
