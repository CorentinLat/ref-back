export type Action = {
    id: string;
    second: number;
    type: string;
    against: string;
    card?: 'RED' | 'YELLOW' | 'WHITE';
    sector: string;
    fault: string;
    precise: 'YES' | 'NOT' | 'DOUBT';
    comment?: string;
};
export type NewAction = Omit<Action, 'id'>;

export type Game = {
    actions: Action[];
    information: {
        gameNumber: string;
        videoPath: string;
    };
};
