# Time's Up

A real-time multiplayer mobile game built with React Native and WiFi/TCP networking.

## Prerequisites

- Node.js (v16 or higher)
- Android Studio with Android SDK
- Two Android devices **on the same WiFi network**

## Setup

```bash
npm install
```

## Running the App

```bash
npx expo run:android
```

Run this command on **two separate devices** to test multiplayer.

## How to Play

### Creating a Game (Host)
1. Launch the app on Device 1
2. Tap **"New Game"**
3. Enter your name
4. Tap **"Create Room"**
5. Wait for players to join
6. Tap **"Start"** when ready to begin

### Joining a Game (Client)
1. Launch the app on Device 2
2. Tap **"Join Game"**
3. Enter your name
4. Select the host's room from the list
5. Wait for host to start

### Core Game Loop
1. **Host starts the game** when all players are in the room
2. **3-2-1 countdown** appears on both devices
3. **Challenge appears** - complete it as fast as you can
4. **Last player to finish gets the bomb** 💣
5. **Next round starts automatically** - game continues indefinitely
6. Players can leave anytime using the **"Leave"** button

## Requirements

- Both devices must be on the **same WiFi network**
- Minimum 2 players required to start a game
- **Note:** Currently tested on Android only - iOS support not yet verified
