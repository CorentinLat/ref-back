type Action = { id: string; time: number; type: string };

export type Game = {
    actions: Action[];
    information: {
        gameNumber: string;
        videoPath: string;
    };
};
