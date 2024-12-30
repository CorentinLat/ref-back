export type Action = {
    id: string;
    second: number;
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'RETURNED_PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY' | 'RESTART_KICK';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    comment?: string;
    commentFromAdviser?: string;
    fromAdviser?: boolean;
    clip?: { start: number; end: number };
};
export type NewAction = Omit<Action, 'id'>;
export type ActionForm = Omit<Action, 'id' | 'commentFromAdviser' | 'fromAdviser'>;

export type GameInformation = {
    gameNumber: string;
    date: string;
    teams: { local: string; visitor: string };
    score: { local: number; visitor: number };
    videoPath: string;
};
export type NewGameInformation = Omit<GameInformation, 'videoPath'> & {
    video: {
        option: 'file' | 'veo';
        videoPaths?: string[];
        veo?: string;
    };
};

export type Game = {
    actions: Action[];
    information: GameInformation;
    gameDescription?: string;
    gameDescriptionFromAdviser?: string;
    globalPerformance?: string;
    globalPerformanceFromAdviser?: string;
};

export type EditableGameComment = 'gameDescription' | 'globalPerformance';
export type AllEditableGameComment = EditableGameComment | 'gameDescriptionFromAdviser' | 'globalPerformanceFromAdviser';

export type Decision = {
    gameNumber: string;
    videoPath: string;
    second: number;
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'RETURNED_PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY' | 'RESTART_KICK';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    comment?: string;
    commentFromAdviser?: string;
};

export type Role = 'referee' | 'adviser';
export const adviserPrefix = 'FromAdviser';

export type SummaryExportType = 'excel' | 'pdf';
