export interface BaseChallenge {
    id: number;
    type: 'TAP' | 'MATH' | 'TAP_SEQUENCE' | 'TILT' | 'COMPASS' | 'REACTION';
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
    wrongAnswers: [string, string, string]; // Exactly 3 wrong answers
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

export interface CompassChallenge extends BaseChallenge {
    type: 'COMPASS';
    targetDirection: 'north' | 'south' | 'east' | 'west';
    tolerance: number; // degrees of tolerance
}

export interface ReactionChallenge extends BaseChallenge {
    type: 'REACTION';
    waitTimeMin: number; // minimum wait time in ms
    waitTimeMax: number; // maximum wait time in ms
}

export type Challenge = TapChallenge | MathChallenge | TapSequenceChallenge | TiltChallenge | CompassChallenge | ReactionChallenge;

export const CHALLENGES: Record<number, Challenge> = {
    1: {
        id: 1,
        type: 'TAP',
        title: 'Speed Tapping',
        instruction: 'Tap the button 10 times fast!',
        target: 10,
    },
    2: {
        id: 2,
        type: 'TAP',
        title: 'Endurance Test',
        instruction: 'Tap 30 times!',
        target: 30,
    },
    3: {
        id: 3,
        type: 'TAP',
        title: 'Hyper Speed',
        instruction: 'Tap 15 times as fast as you can!',
        target: 15,
    },
    4: {
        id: 4,
        type: 'TAP',
        title: 'Short & Sweet',
        instruction: 'Tap 5 times!',
        target: 5,
    },
    5: {
        id: 5,
        type: 'TAP',
        title: 'Marathon',
        instruction: 'Tap 50 times! Don\'t give up!',
        target: 50,
    },
    6: {
        id: 6,
        type: 'MATH',
        title: 'Quick Math',
        instruction: 'Choose the correct answer!',
        question: '12 × 8 = ?',
        correctAnswer: '96',
        wrongAnswers: ['84', '104', '88'],
    },
    7: {
        id: 7,
        type: 'MATH',
        title: 'Addition Challenge',
        instruction: 'Solve it fast!',
        question: '47 + 38 = ?',
        correctAnswer: '85',
        wrongAnswers: ['75', '95', '83'],
    },
    8: {
        id: 8,
        type: 'MATH',
        title: 'Division Time',
        instruction: 'What\'s the answer?',
        question: '144 ÷ 12 = ?',
        correctAnswer: '12',
        wrongAnswers: ['10', '14', '16'],
    },
    9: {
        id: 9,
        type: 'MATH',
        title: 'Subtraction Speed',
        instruction: 'Choose wisely!',
        question: '100 - 37 = ?',
        correctAnswer: '63',
        wrongAnswers: ['67', '73', '53'],
    },
    10: {
        id: 10,
        type: 'MATH',
        title: 'Brain Teaser',
        instruction: 'Can you solve this?',
        question: '15 × 7 = ?',
        correctAnswer: '105',
        wrongAnswers: ['95', '115', '100'],
    },
    11: {
        id: 11,
        type: 'TAP_SEQUENCE',
        title: 'Memory Test',
        instruction: 'Watch and repeat the pattern!',
        sequence: [],
        sequenceLength: 4,
    },
    12: {
        id: 12,
        type: 'TAP_SEQUENCE',
        title: 'Pattern Master',
        instruction: 'Memorize and tap the sequence!',
        sequence: [],
        sequenceLength: 5,
    },
    13: {
        id: 13,
        type: 'TAP_SEQUENCE',
        title: 'Quick Memory',
        instruction: 'Repeat the pattern!',
        sequence: [],
        sequenceLength: 3,
    },
    14: {
        id: 14,
        type: 'TILT',
        title: 'Tilt Left',
        instruction: 'Tilt your phone to the left!',
        targetAngle: 'left',
        holdDuration: 2000,
    },
    15: {
        id: 15,
        type: 'TILT',
        title: 'Tilt Right',
        instruction: 'Tilt your phone to the right!',
        targetAngle: 'right',
        holdDuration: 2000,
    },
    16: {
        id: 16,
        type: 'TILT',
        title: 'Tilt Forward',
        instruction: 'Tilt your phone forward!',
        targetAngle: 'forward',
        holdDuration: 2000,
    },
    17: {
        id: 17,
        type: 'COMPASS',
        title: 'Point North',
        instruction: 'Point your phone to the north!',
        targetDirection: 'north',
        tolerance: 20,
    },
    18: {
        id: 18,
        type: 'COMPASS',
        title: 'Point South',
        instruction: 'Point your phone to the south!',
        targetDirection: 'south',
        tolerance: 20,
    },
    19: {
        id: 19,
        type: 'COMPASS',
        title: 'Point East',
        instruction: 'Point your phone to the east!',
        targetDirection: 'east',
        tolerance: 20,
    },
    20: {
        id: 20,
        type: 'COMPASS',
        title: 'Point West',
        instruction: 'Point your phone to the west!',
        targetDirection: 'west',
        tolerance: 20,
    },
    21: {
        id: 21,
        type: 'REACTION',
        title: 'Lightning Reflexes',
        instruction: 'Tap when the color changes!',
        waitTimeMin: 2000,
        waitTimeMax: 5000,
    },
    22: {
        id: 22,
        type: 'REACTION',
        title: 'Quick Draw',
        instruction: 'React as fast as you can!',
        waitTimeMin: 1500,
        waitTimeMax: 4000,
    },
    23: {
        id: 23,
        type: 'REACTION',
        title: 'Reflex Test',
        instruction: 'Wait for it... then tap!',
        waitTimeMin: 3000,
        waitTimeMax: 6000,
    },
};

export const getRandomChallengeID = () => {
    const keys = Object.keys(CHALLENGES);
    return parseInt(keys[Math.floor(Math.random() * keys.length)], 10);
};