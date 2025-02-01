export type Annotation = {
    id: string;
    second: number;
    comment?: string;
    commentFromAdviser?: string;
    fromAdviser?: boolean;
    clip?: { start: number; end: number };
};
export type Action = Annotation & {
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'ADVANTAGE' | 'RETURNED_PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY' | 'RESTART_KICK';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
};
export type NewAnnotation = Omit<Annotation, 'id'>;
export type NewAction = Omit<Action, 'id'>;
export type AnnotationForm = Omit<Annotation, 'id' | 'commentFromAdviser' | 'fromAdviser'>;
export type ActionForm = Omit<Action, 'id' | 'commentFromAdviser' | 'fromAdviser'>;

export const isAction = (annotation: Action|Annotation): annotation is Action => 'type' in annotation;
export const isAnnotation = (annotation: Action|Annotation): annotation is Annotation => !('type' in annotation);

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
    actions: (Action|Annotation)[];
    information: GameInformation;
    gameDescription?: string;
    gameDescriptionFromAdviser?: string;
    globalPerformance?: string;
    globalPerformanceFromAdviser?: string;
};
export type GameToExport = Omit<Game, 'information'> & { information: Omit<GameInformation, 'videoPath'> };

export type AdviserEditableGameComment = 'gameDescriptionFromAdviser' | 'globalPerformanceFromAdviser';
export type RefereeEditableGameComment = 'gameDescription' | 'globalPerformance';
export type AllEditableGameComment = AdviserEditableGameComment | RefereeEditableGameComment;

export type Decision = {
    gameNumber: string;
    videoPath: string;
    second: number;
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'ADVANTAGE' | 'RETURNED_PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY' | 'RESTART_KICK';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    comment?: string;
    commentFromAdviser?: string;
};

export type Role = 'referee' | 'adviser';
export const adviserPrefix = 'FromAdviser';

export type SummaryExportType = 'excel' | 'pdf';
export const extensionByExportType: Record<SummaryExportType, string> = {
    excel: 'xlsx',
    pdf: 'pdf',
};

export type ImportGameInitCommandOutput = {
    gameTitle: string;
    hasVideo: boolean;
    gameNumberAlreadyExists: boolean;
    hasOtherGames: boolean;
};

export type ImportGameCommandArgs = {
    isCreatingNewGame?: boolean;
    isOverriding?: boolean;
    gameNumberToUse?: string;
};

export const getAnnotationsSortedByTime = (annotations: Annotation[]): Annotation[] =>
    annotations.sort((a, b) => a.second - b.second);

export const getActionsBySectors = (annotations: Annotation[]): { [key: string]: Action[] } => {
    const uniqueSectors = annotations
        .reduce<Set<string>>((sectors, annotation) => {
            if (isAction(annotation)) sectors.add(annotation.sector);
            return sectors;
        }, new Set());

    return Array.from(uniqueSectors)
        .sort((a, b) => a.localeCompare(b))
        .reduce<{ [key: string]: Action[] }>((actionsBySectors, sector) => {
            const actionsForSector = annotations.filter(isAction).filter(action => action.sector === sector);
            if (actionsForSector.length) actionsBySectors[sector] = actionsForSector;

            return actionsBySectors;
        }, {});
};
