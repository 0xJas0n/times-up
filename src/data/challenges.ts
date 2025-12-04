export interface Challenge {
    id: number;
    type: 'TAP'; // Strictly TAP for now
    title: string;
    instruction: string;
    target: number;
}

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
};

export const getRandomChallengeID = () => {
    const keys = Object.keys(CHALLENGES);
    return parseInt(keys[Math.floor(Math.random() * keys.length)], 10);
};