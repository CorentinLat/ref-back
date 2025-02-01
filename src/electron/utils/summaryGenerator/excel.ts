import xl, { Style, Worksheet } from 'excel4node';

import {
    Action,
    Annotation,
    Game,
    getAnnotationsSortedByTime,
    getActionsBySectors,
    Role, isAction,
} from '../../../../type/refBack';

import { convertSecondsToMMSS, getLongDateString } from '../date';

import translate from '../../translation';

// type DecisionsBy = { [key: string]: Action[] };

/*const COLORS: [number, number, number][] = [
    [52, 136, 136],
    [34, 186, 187],
    [158, 248, 238],
    [255, 233, 154],
    [250, 127, 8],
    [242, 68, 5],
];*/

type ActionColumnStructure = { key: keyof Action | 'role'; colSpan?: number };
type AnnotationColumnStructure = { key: keyof Annotation | 'role'; colSpan?: number };
const GLOBAL_COLUMNS: ActionColumnStructure[] = [
    { key: 'role' },
    { key: 'second' },
    { key: 'type' },
    { key: 'against' },
    { key: 'sector' },
    { key: 'fault' },
    { key: 'precise' },
    { key: 'comment', colSpan: 5 },
];
const BY_SECTOR_COLUMNS: ActionColumnStructure[] = [
    { key: 'role' },
    { key: 'second' },
    { key: 'type' },
    { key: 'against' },
    { key: 'fault', colSpan: 2 },
    { key: 'precise' },
    { key: 'comment', colSpan: 5 },
];
const ANNOTATIONS_COLUMNS: AnnotationColumnStructure[] = [
    { key: 'role' },
    { key: 'second' },
    { key: 'comment', colSpan: 4 },
    { key: 'commentFromAdviser', colSpan: 6 },
];

const centerAlignementStyle: Style = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
const rightAlignementStyle: Style = { alignment: { horizontal: 'right', vertical: 'center', wrapText: true } };
const leftAlignementStyle: Style = { alignment: { horizontal: 'left', vertical: 'center', wrapText: true } };

const primaryTitleFontSizeStyle: Style = { font: { bold: true, size: 14 } };
const secondaryTitleFontSizeStyle: Style = { font: { size: 14 } };
const primarySubtitleFontSizeStyle: Style = { font: { bold: true, size: 12 } };
const secondarySubtitleFontSizeStyle: Style = { font: { size: 12 } };

const tableCellStyle: Style = { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };

const COLUMN_WIDTHS = [4, 8, 18, 8, 20, 30, 8, 16, 16, 16, 16, 16];
const columnsCount = COLUMN_WIDTHS.length;
let currentRow = 0;

export function generateExcelSummary(game: Game, savePath: string): void {
    const { information: { date, gameNumber, score, teams } } = game;

    const wb = new xl.Workbook({ defaultFont: { name: 'Helvetica', size: 10 } });
    const ws = wb.addWorksheet(translate('RECAP'), { sheetView: { showGridLines: false } });

    COLUMN_WIDTHS.forEach((width, index) => ws.column(index + 1).setWidth(width));

    addDoubleRow(ws,
        gameNumber, { ...leftAlignementStyle, ...secondaryTitleFontSizeStyle },
        getLongDateString(date), { ...rightAlignementStyle, ...secondaryTitleFontSizeStyle }
    );
    addFullRow(ws, `${teams.local} - ${teams.visitor}`, { ...centerAlignementStyle, ...primaryTitleFontSizeStyle });
    addFullRow(ws, `${score.local} - ${score.visitor}`, { ...centerAlignementStyle, ...secondaryTitleFontSizeStyle });
    addFullRow(ws);

    addGameComment(ws, 'GAME_DESCRIPTION', game.gameDescription, game.gameDescriptionFromAdviser);
    addGameComment(ws, 'GLOBAL_PERFORMANCE', game.globalPerformance, game.globalPerformanceFromAdviser);

    const annotations = getAnnotationsSortedByTime(game.actions);

    addAnnotations(ws, 'ALL_ACTIONS', GLOBAL_COLUMNS, annotations);

    Object.entries(getActionsBySectors(annotations))
        .forEach(([sector, actions]) => addAnnotations(ws, sector, BY_SECTOR_COLUMNS, actions));

    wb.write(savePath);
}

function addGameComment(ws: Worksheet, key: 'GAME_DESCRIPTION' | 'GLOBAL_PERFORMANCE', refereeComment?: string, adviserComment?: string) {
    if (!refereeComment && !adviserComment) return;

    addFullRow(ws, key, primarySubtitleFontSizeStyle);

    if (refereeComment && adviserComment) {
        addDoubleRow(ws,
            'REFEREE', { ...leftAlignementStyle, ...secondarySubtitleFontSizeStyle },
            'ADVISER', { ...leftAlignementStyle, ...secondarySubtitleFontSizeStyle }
        );
        addDoubleRow(ws, refereeComment, leftAlignementStyle, adviserComment, leftAlignementStyle);
    } else if (refereeComment || adviserComment) {
        const commentKey: Role = refereeComment ? 'referee' : 'adviser';
        // @ts-ignore refereeComment or adviserComment is defined
        const comment: string = refereeComment || adviserComment;

        addFullRow(ws, commentKey.toUpperCase(), { ...leftAlignementStyle, ...secondarySubtitleFontSizeStyle });
        addFullRow(ws, comment, leftAlignementStyle);
    }

    addFullRow(ws);
}

function addAnnotations(ws: Worksheet, title: string, columns: ActionColumnStructure[], annotations: Annotation[]): void {
    if (!annotations.length) return;

    addFullRow(ws, title, { ...leftAlignementStyle, ...primaryTitleFontSizeStyle });
    addHeaderTableRow(ws, columns);

    annotations.forEach(annotation =>
        isAction(annotation)
            ? addActionTableRow(ws, annotation, columns)
            : addAnnotationTableRow(ws, annotation)
    );

    addFullRow(ws);
}

function addFullRow(ws: Worksheet, text?: string, style?: Style): void {
    ws.row(++currentRow).setHeight(20);

    const cell = ws.cell(currentRow, 1, currentRow, columnsCount, true);
    if (text) cell.string(translate(text)); else cell.string('');
    if (style) cell.style(style); else cell.style(leftAlignementStyle);
}

function addDoubleRow(ws: Worksheet, leftText: string, leftStyle: Style, rightText: string, rightStyle: Style): void {
    ws.row(++currentRow).setHeight(20);

    ws.cell(currentRow, 1, currentRow, columnsCount / 2, true).string(translate(leftText)).style(leftStyle);
    ws.cell(currentRow, columnsCount / 2 + 1, currentRow, columnsCount, true).string(translate(rightText)).style(rightStyle);
}

function addHeaderTableRow(ws: Worksheet, columns: ActionColumnStructure[]): void {
    let currentColumn = 1;

    ws.row(++currentRow).setHeight(24);
    columns.forEach(({ key, colSpan }, index) => {
        const span = colSpan || 1;
        const columnEnd = currentColumn + span - 1;

        const style: Style = index === 0
            ? { border: { bottom: { style: 'thin' }, right: { style: 'thin' } } }
            : { ...primarySubtitleFontSizeStyle, ...leftAlignementStyle, ...tableCellStyle };

        ws.cell(currentRow, currentColumn, currentRow, columnEnd, true)
            .string(translate(key))
            .style(style);

        currentColumn += span;
    });
}

function addActionTableRow(ws: Worksheet, action: Action, columns: ActionColumnStructure[]): void {
    let currentColumn = 1;

    ws.row(++currentRow).setHeight(20);
    columns.forEach(({ key, colSpan }) => {
        let content = '';
        let color = 'black';

        if (key === 'role') {
            content = getEmojiForRole(action);
        } else if (key === 'second') {
            content = convertSecondsToMMSS(action.second);
        } else if (key === 'comment') {
            if (action.comment) content = `${translate('REFEREE')} : ${action.comment}`;
            if (action.comment && action.commentFromAdviser) content += '\n';
            if (action.commentFromAdviser) content += `${translate('ADVISER')} : ${action.commentFromAdviser}`;
        } else if (key === 'type') {
            const type = translate(action.type);
            const card = getEmojiForCard(action.card);
            content = `${type}${card}`;
        } else {
            // @ts-ignore Key can not be commentFromAdviser for action
            content = translate(action[key]);
        }

        if (key === 'precise') {
            if (action.precise === 'YES') {
                color = '#20c997';
            } else if (action.precise === 'NO') {
                color = '#dc3545';
            } else {
                color = '#ffc107';
            }
        }

        const span = colSpan || 1;
        const columnEnd = currentColumn + span - 1;

        ws.cell(currentRow, currentColumn, currentRow, columnEnd, true)
            .string(content)
            .style({ ...leftAlignementStyle, ...tableCellStyle, font: { color } });

        currentColumn += span;
    });
}

function addAnnotationTableRow(ws: Worksheet, annotation: Annotation): void {
    let currentColumn = 1;

    ws.row(++currentRow).setHeight(20);
    ANNOTATIONS_COLUMNS.forEach(({ key, colSpan }) => {
        let content = '';
        if (key === 'role') {
            content = getEmojiForRole(annotation);
        } else if (key === 'second') {
            content = convertSecondsToMMSS(annotation.second);
        } else if (key === 'comment' && annotation.comment) {
            content = annotation.comment;
        } else if (key === 'commentFromAdviser' && annotation.commentFromAdviser) {
            content = annotation.commentFromAdviser;
        }

        const span = colSpan || 1;
        const columnEnd = currentColumn + span - 1;

        ws.cell(currentRow, currentColumn, currentRow, columnEnd, true)
            .string(content)
            .style({ ...leftAlignementStyle, ...tableCellStyle });

        currentColumn += span;
    });
}

function getEmojiForRole(annotation: Annotation): string {
    return annotation.fromAdviser ? '👁️' : '🙋';
}

function getEmojiForCard(card?: 'RED' | 'YELLOW' | 'WHITE' | 'WARNING'): string {
    if (card === 'RED') return ' 🟥';
    if (card === 'YELLOW') return ' 🟨';
    if (card === 'WHITE') return ' ⬜';
    if (card === 'WARNING') return ' ⚠️';

    return '';
}
