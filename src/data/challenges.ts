export interface BaseChallenge {
    id: number;
    type: 'TAP' | 'MATH';
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

export type Challenge = TapChallenge | MathChallenge;

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
};

export const getRandomChallengeID = () => {
    const keys = Object.keys(CHALLENGES);
    return parseInt(keys[Math.floor(Math.random() * keys.length)], 10);
};