export type Action = {
    id: string;
    second: number;
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    comment?: string;
    clip?: { start: number; end: number };
};
export type NewAction = Omit<Action, 'id'>;

export const actionTypes = ['PLAY_ON', 'TOUCH', 'SCRUM', 'FREE_KICK', 'PENALTY', 'PENALTY_TRY', 'TRY', 'NO_TRY'];
export const actionCardTypes = ['PENALTY', 'PENALTY_TRY', 'TRY', 'NO_TRY'];
export const actionCards = ['WARNING', 'WHITE', 'YELLOW', 'RED'];
export const actionAgainsts = ['LOCAL', 'VISITOR'];
export const actionSectors = ['SCRUM', 'FOUL_PLAY', 'SPACE', 'TACKLE-RUCK', 'LINE_OUT-MAUL', 'ADVANTAGE'];
export const actionFaults = {
    SCRUM: [
        'INTRODUCTION',
        'COLLAPSED',
        'BROKE_UP',
        'WHEELED',
        'SOON_PUSHED',
        'CALLS_NOT_RESPECTED',
        'PRE_ENGAGED',
        'LOOSE_HEAD_PROP_THRUST_AXIS',
        'LOOSE_HEAD_PROP_ARMBAR',
        'TIGHT_HEAD_PROP_INSIDE_THRUST',
        'TIGHT_HEAD_PROP_PULL_DOWN',
        '3RD_LINE_NOT_BINDING',
        'OTHER',
    ],
    FOUL_PLAY: [
        'BRUTALITY',
        'AIR_CONTEST',
        'SHOULDER_CHARGE',
        'CONTESTATIONS',
        'INTENTIONAL_KNOCK_ON',
        'NOT_10',
        'LATE_TACKLE',
        'HIGH_TACKLE',
        'LIFT_TACKLE',
        'NO_BALL_TACKLE',
        'NO_ARM_TACKLE',
        'NECK_ROLL',
        'FOREARM_PROJECTION',
        'SIMULTANEOUS_TACKLE',
    ],
    SPACE: [
        'IN_FRONT_OF_KICKER',
        'KNOCK_ON',
        'FORWARD_PASS',
        'OFFSIDE_KNOCK_ON',
        'OFFSIDE_IN_OPEN_PLAY',
        'LINE_OFFSIDE',
        'OBSTRUCTION',
        'TRY_SITUATION',
        'OTHER',
    ],
    'TACKLE-RUCK': [
        'FOUR_STEPS',
        'TACKLE_ASSISTANT',
        'KICK_IN_RUCK',
        'SIDE_ENTRY',
        'TACKLED',
        'TACKLER',
        'SEALING',
        'HAND_IN_RUCK',
        'NOT_ROLLING_AWAY',
        'NOT_RELEASING',
    ],
    'LINE_OUT-MAUL': [
        'COLLAPSED_MAUL',
        'UNPRODUCTIVE_MAUL',
        'MAUL_SIDE_ENTRY',
        'FAULT_ON_JUMPER',
        'THROW_TWO_TIMES',
        'LONG_PASS',
        'MAUL_OBSTRUCTION',
        'PISTON',
        'GAP_LINE_OUT',
        'LEAVE_LINE_OUT',
        'SACKING',
        'TOUCH',
        'NOT_STRAIGHT',
        'TOO_MUCH_PLAYERS',
    ],
    ADVANTAGE: [
        'NO_RETURN',
        'BAD_RETURN',
    ],
};
export const actionPrecises = ['YES', 'NO', 'DOUBT'];

export type GameInformation = {
    gameNumber: string;
    date: string;
    teams: { local: string; visitor: string };
    score: { local: number; visitor: number };
    videoPath: string;
};
export type NewGameInformation = Omit<GameInformation, 'videoPath'>;

export type Game = {
    actions: Action[];
    information: GameInformation;
    gameDescription?: string;
    globalPerformance?: string;
};
