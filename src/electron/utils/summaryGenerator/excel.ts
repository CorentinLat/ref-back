import xl, { Style, Worksheet } from 'excel4node';
import { join } from 'path';

import {
    Action,
    Annotation,
    Game,
    getAnnotationsSortedByTime,
    getActionsBySectors,
    isAction,
    Role,
} from '../../../../type/refBack';

import { removeFile } from '../file';
import { convertPdfToPng } from './image';
import { generatePdfStatistics } from './pdf';

import { convertSecondsToMMSS, getLongDateString } from '../date';
import { tempPath } from '../path';

import translate from '../../translation';

type CommonColumnStructure = { key: 'role' | 'second'; colSpan?: number; alignment?: 'center' | 'left' };
type ActionColumnStructure = { key: keyof Action | 'role'; colSpan?: number; alignment?: 'center' | 'left' };
type AnnotationColumnStructure = { key: keyof Annotation | 'role'; colSpan?: number; alignment?: 'center' | 'left' };
const COMMON_COLUMNS: CommonColumnStructure[] = [
    { key: 'role', alignment: 'center' },
    { key: 'second', alignment: 'center' },
];
const GLOBAL_COLUMNS: ActionColumnStructure[] = [
    ...COMMON_COLUMNS,
    { key: 'type' },
    { key: 'against', alignment: 'center' },
    { key: 'sector' },
    { key: 'fault' },
    { key: 'precise', alignment: 'center' },
    { key: 'comment', colSpan: 5 },
];
const ANNOTATIONS_COLUMNS: AnnotationColumnStructure[] = [
    ...COMMON_COLUMNS,
    { key: 'comment', colSpan: 4 },
    { key: 'commentFromAdviser', colSpan: 6 },
];

const centerAlignmentStyle: Style = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
const rightAlignmentStyle: Style = { alignment: { horizontal: 'right', vertical: 'center', wrapText: true } };
const leftAlignmentStyle: Style = { alignment: { horizontal: 'left', vertical: 'center', wrapText: true } };

const DEFAULT_FONT_SIZE = 14;
const primaryTitleFontSizeStyle: Style = { font: { bold: true, size: 20 } };
const secondaryTitleFontSizeStyle: Style = { font: { size: 20 } };
const primarySubtitleFontSizeStyle: Style = { font: { bold: true, size: 17 } };
const secondarySubtitleFontSizeStyle: Style = { font: { size: 17, underline: true } };

const tableCellStyle: Style = {
    border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
    },
};

const COLUMN_WIDTHS = [4, 8, 18, 8, 20, 30, 8, 16, 16, 16, 16, 16];
const columnsCount = COLUMN_WIDTHS.length;
let currentRow = 0;

export async function generateExcelSummary(game: Game, savePath: string): Promise<void> {
    const { information: { date, gameNumber, score, teams } } = game;

    const wb = new xl.Workbook({ defaultFont: { name: 'Helvetica', size: DEFAULT_FONT_SIZE } });
    const ws = wb.addWorksheet(translate('RECAP'), {
        pageSetup: { fitToWidth: 1, fitToHeight: 20, paperSize: 'A4_PAPER' },
        sheetView: { showGridLines: false },
    });

    currentRow = 0;
    COLUMN_WIDTHS.forEach((width, index) => ws.column(index + 1).setWidth(width));

    addDoubleRow(ws,
        gameNumber, { ...leftAlignmentStyle, ...secondaryTitleFontSizeStyle },
        getLongDateString(date), { ...rightAlignmentStyle, ...secondaryTitleFontSizeStyle },
    );
    addFullRow(ws, `${teams.local} - ${teams.visitor}`, { ...centerAlignmentStyle, ...primaryTitleFontSizeStyle });
    addFullRow(ws, `${score.local} - ${score.visitor}`, { ...centerAlignmentStyle, ...secondaryTitleFontSizeStyle });
    addBlankRow(ws);

    addGameComment(ws, 'GAME_DESCRIPTION', game.gameDescription, game.gameDescriptionFromAdviser);
    addGameComment(ws, 'GLOBAL_PERFORMANCE', game.globalPerformance, game.globalPerformanceFromAdviser);

    if (game.actions.length) {
        const annotations = getAnnotationsSortedByTime(game.actions);

        await addStatistics(ws, annotations);

        addAnnotations(ws, 'ALL_ACTIONS', GLOBAL_COLUMNS, annotations);

        const bySectorColumns = GLOBAL_COLUMNS
            .filter(({ key }) => key !== 'sector')
            .map(column => column.key === 'fault' ? { ...column, colSpan: 2 } : column);
        Object.entries(getActionsBySectors(annotations))
            .forEach(([sector, actions]) => addAnnotations(ws, sector, bySectorColumns, actions));
    }

    ws.setPrintArea(1, 1, currentRow, columnsCount);
    wb.write(savePath);
}

function addGameComment(ws: Worksheet, key: 'GAME_DESCRIPTION' | 'GLOBAL_PERFORMANCE', refereeComment?: string, adviserComment?: string) {
    if (!refereeComment && !adviserComment) return;

    addFullRow(ws, key, primarySubtitleFontSizeStyle);

    if (refereeComment && adviserComment) {
        addDoubleRow(ws,
            'REFEREE', { ...leftAlignmentStyle, ...secondarySubtitleFontSizeStyle },
            'ADVISER', { ...leftAlignmentStyle, ...secondarySubtitleFontSizeStyle },
        );
        addDoubleRow(ws, refereeComment, leftAlignmentStyle, adviserComment, leftAlignmentStyle);
    } else if (refereeComment || adviserComment) {
        const commentKey: Role = refereeComment ? 'referee' : 'adviser';
        // @ts-ignore refereeComment or adviserComment is defined
        const comment: string = refereeComment || adviserComment;

        addFullRow(ws, commentKey.toUpperCase(), { ...leftAlignmentStyle, ...secondarySubtitleFontSizeStyle });
        addFullRow(ws, comment, leftAlignmentStyle);
    }

    addBlankRow(ws);
}

async function addStatistics(ws: Worksheet, annotations: Annotation[]): Promise<void> {
    const tmpPdfPath = join(tempPath, `${Date.now()}.pdf`);

    const pdfGenerated = await generatePdfStatistics(annotations, tmpPdfPath);
    if (!pdfGenerated) {
        removeFile(tmpPdfPath);
        return;
    }

    const tmpPngPath = await convertPdfToPng(tmpPdfPath);
    if (!tmpPngPath) {
        removeFile(tmpPdfPath);
        return;
    }

    addBlankRow(ws);
    ws.row(currentRow).setHeight(330);

    ws.addImage({
        path: tmpPngPath,
        type: 'picture',
        position: {
            type: 'twoCellAnchor',
            from: { col: 4, row: currentRow },
            to: { col: columnsCount - 1, row: currentRow + 1 },
        },
    });

    setTimeout(() => {
        removeFile(tmpPdfPath);
        removeFile(tmpPngPath);
    }, 5000);
}

function addAnnotations(ws: Worksheet, title: string, columns: ActionColumnStructure[], annotations: Annotation[]): void {
    if (!annotations.length) return;

    addFullRow(ws, title, { ...leftAlignmentStyle, ...primaryTitleFontSizeStyle });
    addBlankRow(ws, 10);

    addHeaderTableRow(ws, columns);

    annotations.forEach(annotation =>
        isAction(annotation)
            ? addActionTableRow(ws, annotation, columns)
            : addAnnotationTableRow(ws, annotation),
    );

    addBlankRow(ws);
}

function addBlankRow(ws: Worksheet, height?: number): void {
    ws.row(++currentRow).setHeight(height || 18);
}

function addFullRow(ws: Worksheet, text: string, style?: Style): void {
    const translatedText = translate(text);

    ws.row(++currentRow).setHeight(computeHeightForContent(1, columnsCount, translatedText, style));

    ws.cell(currentRow, 1, currentRow, columnsCount, true)
        .string(translatedText)
        .style(style || leftAlignmentStyle);
}

function addDoubleRow(ws: Worksheet, leftText: string, leftStyle: Style, rightText: string, rightStyle: Style): void {
    const leftTranslated = translate(leftText);
    const rightTranslated = translate(rightText);

    const leftHeight = computeHeightForContent(1, columnsCount / 2, leftTranslated, leftStyle);
    const rightHeight = computeHeightForContent(columnsCount / 2 + 1, columnsCount, rightTranslated, rightStyle);
    ws.row(++currentRow).setHeight(Math.max(leftHeight, rightHeight));

    ws.cell(currentRow, 1, currentRow, columnsCount / 2, true).string(leftTranslated).style(leftStyle);
    ws.cell(currentRow, columnsCount / 2 + 1, currentRow, columnsCount, true).string(rightTranslated).style(rightStyle);
}

function addHeaderTableRow(ws: Worksheet, columns: ActionColumnStructure[]): void {
    let currentColumn = 1;

    ws.row(++currentRow).setHeight(24);
    columns.forEach(({ key, colSpan, alignment }, index) => {
        const span = colSpan || 1;
        const columnEnd = currentColumn + span - 1;

        const alignmentStyle: Style = alignment === 'center' ? { ...centerAlignmentStyle } : { ...leftAlignmentStyle };
        const style: Style = index === 0
            ? { border: { bottom: { style: 'thin' }, right: { style: 'thin' } } }
            : { ...primarySubtitleFontSizeStyle, ...alignmentStyle, ...tableCellStyle };

        ws.cell(currentRow, currentColumn, currentRow, columnEnd, true)
            .string(translate(key))
            .style(style);

        currentColumn += span;
    });
}

function addActionTableRow(ws: Worksheet, action: Action, columns: ActionColumnStructure[]): void {
    let maxHeight = 20;
    let commentsContent = '';
    let currentColumn = 1;
    ANNOTATIONS_COLUMNS.forEach(({ key, colSpan }) => {
        if (key !== 'comment') {
            currentColumn += colSpan || 1;
            return;
        }

        if (action.comment) commentsContent = `${translate('REFEREE')} : ${action.comment}`;
        if (action.comment && action.commentFromAdviser) commentsContent += '\n';
        if (action.commentFromAdviser) commentsContent += `${translate('ADVISER')} : ${action.commentFromAdviser}`;

        const columnHeight = computeHeightForContent(currentColumn, currentColumn + (colSpan || 1) - 1, commentsContent);
        currentColumn += colSpan || 1;
        maxHeight = Math.max(maxHeight, columnHeight);
    });

    ws.row(++currentRow).setHeight(maxHeight);

    currentColumn = 1;
    columns.forEach(({ key, colSpan, alignment }) => {
        let content;
        if (key === 'role') {
            content = getEmojiForRole(action);
        } else if (key === 'second') {
            content = convertSecondsToMMSS(action.second);
        } else if (key === 'comment') {
            content = commentsContent;
        } else if (key === 'type') {
            const type = translate(action.type);
            const card = getEmojiForCard(action.card);
            content = `${type}${card}`;
        } else {
            // @ts-ignore Key can not be commentFromAdviser for action
            content = translate(action[key]);
        }

        let color = 'black';
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
        const alignmentStyle: Style = alignment === 'center' ? { ...centerAlignmentStyle } : { ...leftAlignmentStyle };

        ws.cell(currentRow, currentColumn, currentRow, columnEnd, true)
            .string(content)
            .style({ ...alignmentStyle, ...tableCellStyle, font: { color } });

        currentColumn += span;
    });
}

function addAnnotationTableRow(ws: Worksheet, annotation: Annotation): void {
    let maxHeight = 20;
    let currentColumn = 1;
    ANNOTATIONS_COLUMNS.forEach(({ key, colSpan }) => {
        if (key !== 'comment' && key !== 'commentFromAdviser') {
            currentColumn += colSpan || 1;
            return;
        }

        const columnHeight = computeHeightForContent(currentColumn, currentColumn + (colSpan || 1) - 1, annotation[key]);
        currentColumn += colSpan || 1;
        maxHeight = Math.max(maxHeight, columnHeight);
    });

    ws.row(++currentRow).setHeight(maxHeight);

    currentColumn = 1;
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
            .style({ ...leftAlignmentStyle, ...tableCellStyle });

        currentColumn += span;
    });
}

function computeHeightForContent(startColumn: number, endColumn: number, content?: string, style?: Style): number {
    if (!content) return 0;

    const fontSize = style?.font?.size || DEFAULT_FONT_SIZE;
    const heightByLine = fontSize + 6;
    const columns = COLUMN_WIDTHS
        .slice(startColumn - 1, endColumn)
        .reduce((acc, width) => acc + width, 0);
    const widthAvailableForContent = columns * 8;

    const linesNeeded = content.split('\n').reduce(
        (count, line) => line.length
            ? count + Math.ceil(line.length * 6 / widthAvailableForContent)
            : count + 1,
        0,
    );

    return linesNeeded * heightByLine;
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
