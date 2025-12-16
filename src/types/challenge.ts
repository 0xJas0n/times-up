import { Player } from '../screens/RoomScreen';

export interface GamePlayer extends Player {
  currentRank: number;
  score: number;
  hasBomb: boolean;
  isNextRecipient: boolean;
}
