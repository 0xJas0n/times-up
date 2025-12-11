import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternBackground } from '../components/PatternBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Zeroconf from 'react-native-zeroconf';
import { ZeroconfService } from '../types/zeroconf';
import { colors } from '../theme/colors';

type RootStackParamList = {
  Home: undefined;
  JoinGame: undefined;
  Room: { roomCode: string; username: string; isHost: boolean; service?: ZeroconfService };
};

type JoinGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGame'>;
};

const SERVICE_DOMAIN = 'local.';
const SERVICE_TYPE = 'timesup-game';

export default function JoinGameScreen({ navigation }: JoinGameScreenProps) {
  const [username, setUsername] = useState('');
  const [availableGames, setAvailableGames] = useState<ZeroconfService[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const zeroconfRef = useRef<Zeroconf | null>(null);

  // Only scan for games when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const zeroconf = new Zeroconf();
      zeroconfRef.current = zeroconf;

      zeroconf.on('start', () => {
        setIsScanning(true);
      });

      zeroconf.on('stop', () => {
        setIsScanning(false);
      });

      zeroconf.on('resolved', (service: ZeroconfService) => {
        setAvailableGames(prev => {
          if (prev.find(s => s.name === service.name)) {
            return prev;
          }
          return [...prev, service];
        });
      });

      zeroconf.on('remove', (serviceName: string) => {
        setAvailableGames(prev => prev.filter(s => s.name !== serviceName));
      });

      zeroconf.on('error', (err: any) => {
        console.error('[JoinGameScreen] Zeroconf error:', err);
      });

      zeroconf.scan(SERVICE_TYPE, 'tcp', SERVICE_DOMAIN);

      return () => {
        zeroconf.stop();
        zeroconfRef.current = null;
        setAvailableGames([]);
      };
    }, [])
  );

  const handleJoinRoom = (service: ZeroconfService) => {
    if (!username.trim()) {
      Alert.alert('Missing Name', 'Please enter your name to join.');
      return;
    }

    navigation.navigate('Room', {
      roomCode: service.name,
      username: username.trim(),
      isHost: false,
      service,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: ZeroconfService }) => (
    <Pressable style={styles.gameItem} onPress={() => handleJoinRoom(item)}>
      <Text style={styles.gameName}>#{item.name}</Text>
    </Pressable>
  );

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

          <View style={styles.gameListContainer}>
            {isScanning && <Text style={styles.loadingText}>Scanning for games...</Text>}
            <FlatList
              data={availableGames}
              renderItem={renderItem}
              keyExtractor={(item) => item.name}
              ListEmptyComponent={() => (
                !isScanning && <Text style={styles.noGamesText}>No games found on the network.</Text>
              )}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.backButton,
                pressed && styles.pressedButton,
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
        backgroundColor: colors.secondary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: colors.text,
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
    gameListContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 400,
        marginTop: 20,
    },
    loadingText: {
        color: colors.text,
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 10,
    },
    noGamesText: {
        color: colors.text,
        textAlign: 'center',
        fontSize: 16,
        marginTop: 20,
    },
    gameItem: {
        backgroundColor: colors.primary,
        padding: 20,
        borderRadius: 8,
        marginBottom: 10,
    },
    gameName: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        gap: 16,
        marginTop: 20,
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
    backButton: {
        backgroundColor: colors.error,
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
