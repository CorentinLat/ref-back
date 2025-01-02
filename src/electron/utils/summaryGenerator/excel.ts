import { Game } from '../../../../type/refBack';

// import { convertSecondsToMMSS, getLongDateString } from '../date';

// import translate from '../../translation';

// type Key = 'second' | 'type' | 'against' | 'sector' | 'fault' | 'precise' | 'comment';
// type ColumnAction = { content: string; colSpan: number; color: string };
// type ColumnStructure = { key: Key; colSpan: number };
// type DecisionsBy = { [key: string]: Action[] };

/*const COLORS: [number, number, number][] = [
    [52, 136, 136],
    [34, 186, 187],
    [158, 248, 238],
    [255, 233, 154],
    [250, 127, 8],
    [242, 68, 5],
];*/

export function generateExcelSummary(game: Game, saveDirectory: string): void {
    // const { information: { date, gameNumber, score, teams } } = game;
    // const summaryFileName = `${gameNumber}.xlsx`;

    console.log(game);
    console.log(saveDirectory);
}
