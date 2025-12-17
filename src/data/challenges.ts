export interface BaseChallenge {
    id: number;
    type: 'TAP' | 'MATH' | 'TAP_SEQUENCE' | 'TILT' | 'REACTION';
    title: string;
    instruction: string;
}

export interface TapChallenge extends BaseChallenge {
    type: 'TAP';
    target: number;
}

export interface MathChallenge extends BaseChallenge {
    type: 'MATH';
    question: string;
    correctAnswer: string;
    wrongAnswers: [string, string, string];
}

export interface TapSequenceChallenge extends BaseChallenge {
    type: 'TAP_SEQUENCE';
    sequence: number[]; // Array of button indices to tap (0-3)
    sequenceLength: number;
}

export interface TiltChallenge extends BaseChallenge {
    type: 'TILT';
    targetAngle: 'left' | 'right' | 'forward' | 'backward';
    holdDuration: number; // milliseconds to hold the angle
}

export interface ReactionChallenge extends BaseChallenge {
    type: 'REACTION';
    waitTimeMin: number;
    waitTimeMax: number;
}

export type Challenge = TapChallenge | MathChallenge | TapSequenceChallenge | TiltChallenge | ReactionChallenge;

export const CHALLENGES: Record<number, Challenge> = {
    1: {
        id: 1,
        type: 'TAP',
        title: 'Tap Challenge',
        instruction: 'Tap 10 times as fast as possible!',
        target: 10,
    },
    2: {
        id: 2,
        type: 'TAP',
        title: 'Tap Challenge',
        instruction: 'Tap 30 times as fast as possible!',
        target: 30,
    },
    3: {
        id: 3,
        type: 'TAP',
        title: 'Tap Challenge',
        instruction: 'Tap 15 times as fast as possible!',
        target: 15,
    },
    4: {
        id: 4,
        type: 'TAP',
        title: 'Tap Challenge',
        instruction: 'Tap 5 times as fast as possible!',
        target: 5,
    },
    5: {
        id: 5,
        type: 'TAP',
        title: 'Tap Challenge',
        instruction: 'Tap 50 times as fast as possible!',
        target: 50,
    },
    6: {
        id: 6,
        type: 'MATH',
        title: 'Math Challenge',
        instruction: 'Solve: 12 × 8 = ?',
        question: '12 × 8 = ?',
        correctAnswer: '96',
        wrongAnswers: ['84', '104', '88'],
    },
    7: {
        id: 7,
        type: 'MATH',
        title: 'Math Challenge',
        instruction: 'Solve: 47 + 38 = ?',
        question: '47 + 38 = ?',
        correctAnswer: '85',
        wrongAnswers: ['75', '95', '83'],
    },
    8: {
        id: 8,
        type: 'MATH',
        title: 'Math Challenge',
        instruction: 'Solve: 144 ÷ 12 = ?',
        question: '144 ÷ 12 = ?',
        correctAnswer: '12',
        wrongAnswers: ['10', '14', '16'],
    },
    9: {
        id: 9,
        type: 'MATH',
        title: 'Math Challenge',
        instruction: 'Solve: 100 - 37 = ?',
        question: '100 - 37 = ?',
        correctAnswer: '63',
        wrongAnswers: ['67', '73', '53'],
    },
    10: {
        id: 10,
        type: 'MATH',
        title: 'Math Challenge',
        instruction: 'Solve: 15 × 7 = ?',
        question: '15 × 7 = ?',
        correctAnswer: '105',
        wrongAnswers: ['95', '115', '100'],
    },
    11: {
        id: 11,
        type: 'TAP_SEQUENCE',
        title: 'Sequence Challenge',
        instruction: 'Watch and repeat the pattern!',
        sequence: [],
        sequenceLength: 4,
    },
    12: {
        id: 12,
        type: 'TAP_SEQUENCE',
        title: 'Sequence Challenge',
        instruction: 'Memorize and tap the sequence!',
        sequence: [],
        sequenceLength: 5,
    },
    13: {
        id: 13,
        type: 'TAP_SEQUENCE',
        title: 'Sequence Challenge',
        instruction: 'Repeat the pattern!',
        sequence: [],
        sequenceLength: 3,
    },
    14: {
        id: 14,
        type: 'TILT',
        title: 'Tilt Challenge',
        instruction: 'Tilt your phone to the left!',
        targetAngle: 'left',
        holdDuration: 2000,
    },
    15: {
        id: 15,
        type: 'TILT',
        title: 'Tilt Challenge',
        instruction: 'Tilt your phone to the right!',
        targetAngle: 'right',
        holdDuration: 2000,
    },
    16: {
        id: 16,
        type: 'TILT',
        title: 'Tilt Challenge',
        instruction: 'Tilt your phone forward!',
        targetAngle: 'forward',
        holdDuration: 2000,
    },
    17: {
        id: 17,
        type: 'REACTION',
        title: 'Reaction Challenge',
        instruction: 'Tap when the color changes!',
        waitTimeMin: 2000,
        waitTimeMax: 5000,
    },
    18: {
        id: 18,
        type: 'REACTION',
        title: 'Reaction Challenge',
        instruction: 'React as fast as you can!',
        waitTimeMin: 1500,
        waitTimeMax: 4000,
    },
    19: {
        id: 19,
        type: 'REACTION',
        title: 'Reaction Challenge',
        instruction: 'Wait for it... then tap!',
        waitTimeMin: 3000,
        waitTimeMax: 6000,
    },
};

export const getRandomChallengeID = () => {
    const keys = Object.keys(CHALLENGES);
    return parseInt(keys[Math.floor(Math.random() * keys.length)], 10);
};
