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
};

export type SummaryExportType = 'excel' | 'pdf';
