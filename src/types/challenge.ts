import { Player } from '../screens/RoomScreen';

export interface ChallengeProgress {
  playerId: string;
  progress: number;
  isComplete: boolean;
  isCorrect: boolean;
  timestamp: number;
  customRank?: number;
}

export interface ChallengeComponent {
  onProgressUpdate: (progress: ChallengeProgress) => void;
}

export interface GamePlayer extends Player {
  currentRank: number;
  score: number;
  hasBomb: boolean;
  isNextRecipient: boolean;
}
