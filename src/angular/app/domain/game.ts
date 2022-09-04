export type Action = {
    id: string;
    second: number;
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'PENALTY_TRY';
    card?: 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'RUCK' | 'SCRUM' | 'LINE_OUT';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    comment?: string;
};
export type NewAction = Omit<Action, 'id'>;

export const actionTypes = ['PLAY_ON', 'TOUCH', 'SCRUM', 'FREE_KICK', 'PENALTY', 'PENALTY_TRY'];
export const actionCardTypes = ['PENALTY', 'PENALTY_TRY'];
export const actionCards = ['WHITE', 'YELLOW', 'RED'];
export const actionAgainsts = ['LOCAL', 'VISITOR'];
export const actionSectors = ['RUCK', 'SCRUM', 'LINE_OUT'];
export const actionFaults = {
    RUCK: ['SIDE_ENTRY'],
    SCRUM: ['COLLAPSE'],
    LINE_OUT: ['NOT_STRAIGHT'],
};
export const actionPrecises = ['YES', 'NO', 'DOUBT'];

export type Game = {
    actions: Action[];
    information: {
        gameNumber: string;
        videoPath: string;
    };
};
