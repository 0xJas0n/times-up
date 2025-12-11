import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import NewGameScreen from './src/screens/NewGameScreen';
import JoinGameScreen from './src/screens/JoinGameScreen';
import RoomScreen from './src/screens/RoomScreen';
import GameScreen from './src/screens/GameScreen';
import WinnerScreen from './src/screens/WinnerScreen';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewGame" component={NewGameScreen} />
        <Stack.Screen name="JoinGame" component={JoinGameScreen} />
        <Stack.Screen name="Room" component={RoomScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Winner" component={WinnerScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
