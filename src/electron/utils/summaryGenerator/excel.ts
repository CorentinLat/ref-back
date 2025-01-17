import xl, { Style, Worksheet } from 'excel4node';

import { Game, Role } from '../../../../type/refBack';

import { getLongDateString } from '../date';
// import { convertSecondsToMMSS, getLongDateString } from '../date';

import translate from '../../translation';

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

const centerStyle: Style = { alignment: { horizontal: 'center' } };
const rightStyle: Style = { alignment: { horizontal: 'right' } };

const primaryTitleFontSizeStyle: Style = { font: { bold: true, size: 14 } };
const secondaryTitleFontSizeStyle: Style = { font: { size: 14 } };
const primarySubtitleFontSizeStyle: Style = { font: { bold: true, size: 12 } };
const secondarySubtitleFontSizeStyle: Style = { font: { size: 12 } };

let currentRow = 5;

export function generateExcelSummary(game: Game, savePath: string): void {
    const { information: { date, gameNumber, score, teams } } = game;

    const wb = new xl.Workbook({ defaultFont: { name: 'Helvetica', size: 10 } });
    const ws = wb.addWorksheet(translate('RECAP'));

    ws.column(1).setWidth(20);
    ws.column(2).setWidth(20);
    ws.column(3).setWidth(20);
    ws.column(4).setWidth(20);
    ws.column(5).setWidth(20);
    ws.column(6).setWidth(20);

    ws.cell(1, 1, 1, 3, true)
        .string(gameNumber)
        .style({ ...secondarySubtitleFontSizeStyle });
    ws.cell(1, 4, 1, 6, true)
        .string(getLongDateString(date))
        .style({ ...rightStyle, ...secondarySubtitleFontSizeStyle });
    ws.cell(2, 1, 2, 6, true)
        .string(`${teams.local} - ${teams.visitor}`)
        .style({ ...centerStyle, ...primaryTitleFontSizeStyle });
    ws.cell(3, 1, 3, 6, true)
        .string(`${score.local} - ${score.visitor}`)
        .style({ ...centerStyle, ...secondaryTitleFontSizeStyle });

    currentRow = 5;

    addGameComment(ws, 'GAME_DESCRIPTION', game.gameDescription, game.gameDescriptionFromAdviser);
    addGameComment(ws, 'GLOBAL_PERFORMANCE', game.globalPerformance, game.globalPerformanceFromAdviser);

    wb.write(savePath);
}

function addGameComment(ws: Worksheet, key: 'GAME_DESCRIPTION' | 'GLOBAL_PERFORMANCE', refereeComment?: string, adviserComment?: string) {
    if (!refereeComment && !adviserComment) return;

    ws.cell(currentRow, 1, currentRow, 6, true).string(translate(key)).style({ ...primarySubtitleFontSizeStyle });
    currentRow++;

    if (refereeComment && adviserComment) {
        ws.cell(currentRow, 1, currentRow, 3, true)
            .string(translate('REFEREE'))
            .style({ ...secondarySubtitleFontSizeStyle });
        ws.cell(currentRow, 4, currentRow, 6, true)
            .string(translate('ADVISER'))
            .style({ ...secondarySubtitleFontSizeStyle });
        currentRow++;

        ws.cell(currentRow, 1, currentRow, 3, true)
            .string(translate(refereeComment))
            .style({ alignment: { shrinkToFit: true, vertical: 'center', wrapText: true } });
        ws.cell(currentRow, 4, currentRow, 6, true)
            .string(translate(adviserComment))
            .style({ alignment: { shrinkToFit: true, vertical: 'center', wrapText: true } });
    } else if (refereeComment || adviserComment) {
        const commentKey: Role = refereeComment ? 'referee' : 'adviser';
        // @ts-ignore refereeComment or adviserComment is defined
        const comment: string = refereeComment || adviserComment;

        ws.cell(currentRow, 1, currentRow, 6, true)
            .string(translate(commentKey.toUpperCase()))
            .style({ ...secondarySubtitleFontSizeStyle });
        currentRow++;

        ws.cell(currentRow, 1, currentRow, 6, true)
            .string(translate(comment))
            .style({ alignment: { shrinkToFit: true, vertical: 'center', wrapText: true } });
    }

    currentRow += 2;
}
