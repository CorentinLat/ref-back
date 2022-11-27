import fs from 'fs';
import PDFDocument from 'pdfkit';

import { convertSecondsToMMSS, getLongDateString } from './date';
import { Action, Game } from './game';
import translate from '../translation';

const A4_HEIGHT = 841;
const A4_WIDTH = 595;
const MARGIN = 10;
const LINE_WIDTH = A4_WIDTH - 2 * MARGIN;

type Key = 'second' | 'type' | 'against' | 'sector' | 'fault' | 'precise' | 'comment';
type ColumnAction = { content: string; colSpan: number };
type ColumnStructure = { key: Key; colSpan: number };
const ALL_COLUMNS: ColumnStructure[] = [
    { key: 'second', colSpan: 1 },
    { key: 'type', colSpan: 2 },
    { key: 'against', colSpan: 1 },
    { key: 'sector', colSpan: 2 },
    { key: 'fault', colSpan: 3 },
    { key: 'precise', colSpan: 1 },
    { key: 'comment', colSpan: 3 },
];

let currentYPosition = MARGIN;

export function generatePdfSummary(game: Game, saveDirectory: string): void {
    const { information: { date, gameNumber, score, teams } } = game;
    const summaryFileName = `${gameNumber}.pdf`;

    const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
    doc.pipe(fs.createWriteStream(`${saveDirectory}/${summaryFileName}`));
    currentYPosition = MARGIN;

    addTwoColumnsLine(doc, getLongDateString(date), gameNumber);

    currentYPosition += MARGIN;
    currentYPosition = addThreeColumnsLine(
        doc,
        currentYPosition,
        'Helvetica-Bold',
        teams.local,
        '-',
        teams.visitor
    );
    currentYPosition = addThreeColumnsLine(
        doc,
        currentYPosition,
        'Helvetica',
        score.local,
        '',
        score.visitor
    );

    const decisions = getActionsSortedByTime(game.actions);

    currentYPosition = addDecisionsTable(
        doc,
        currentYPosition,
        'ALL_ACTIONS',
        ALL_COLUMNS,
        decisions
    );

    const columnsBySector = ALL_COLUMNS.filter(({ key }) => key !== 'sector');
    getSectorsWithAtLeastOneDecision(decisions).forEach(sector => {
        const sectorDecisions = decisions.filter(action => action.sector === sector);

        currentYPosition = addDecisionsTable(
            doc,
            currentYPosition,
            sector,
            columnsBySector,
            sectorDecisions
        );
    });

    doc.end();
}

function addTwoColumnsLine(doc: typeof PDFDocument, left: string, right: string): void {
    doc.font('Helvetica-Bold').fontSize(12);

    const leftString = left.toString();
    const rightString = right.toString();

    const sideWidth = LINE_WIDTH / 2;
    doc
        .text(leftString, undefined, currentYPosition, { width: sideWidth, align: 'left' })
        .text(rightString, sideWidth, currentYPosition, { width: sideWidth, align: 'right' });

    const leftHeight = doc.heightOfString(leftString, { width: sideWidth });
    const rightHeight = doc.heightOfString(rightString, { width: sideWidth });
    currentYPosition += Math.max(leftHeight, rightHeight);
}

function addThreeColumnsLine(
    doc: typeof PDFDocument,
    curY: number,
    font: string,
    left: string|number,
    center: string,
    right: string|number
): number {
    doc.font(font).fontSize(14);

    const leftString = left.toString();
    const rightString = right.toString();

    const centerWidth = doc.widthOfString(center) + MARGIN * 2;
    const sideWidth = (LINE_WIDTH - centerWidth) / 2;
    doc
        .text(leftString, 0, curY, { width: sideWidth, align: 'right' })
        .text(center, sideWidth, curY, { width: centerWidth, align: 'center' })
        .text(rightString, sideWidth + centerWidth, curY, { width: sideWidth, align: 'left' });

    const leftHeight = doc.heightOfString(leftString, { width: sideWidth });
    const rightHeight = doc.heightOfString(rightString, { width: sideWidth });
    return curY + Math.max(leftHeight, rightHeight);
}

function addDecisionsTable(
    doc: typeof PDFDocument,
    curY: number,
    title: string,
    columnsStructure: ColumnStructure[],
    actions: Action[],
): number {
    curY += addSection(doc, curY, title);

    const headerColumns = columnsStructure.map(({ colSpan, key }) => ({ colSpan, content: translate(key) }));
    curY += addTableRow(doc, curY, true, headerColumns);

    actions.forEach(action => {
        const columns = formatColumnActions(action, columnsStructure);
        curY += addTableRow(doc, curY, false, columns);
    });

    return curY + 2 * MARGIN;
}

function addSection(doc: typeof PDFDocument, curY: number, titleKey: string): number {
    const title = translate(titleKey);
    doc.font('Helvetica-Bold').fontSize(13);
    doc.text(title, MARGIN, curY);

    return doc.heightOfString(title) + MARGIN / 2;
}

function addTableRow(
    doc: typeof PDFDocument,
    curY: number,
    isHeader: boolean,
    columns: ColumnAction[],
): number {
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);

    const colSpansTotal = columns.reduce((total, { colSpan }) => total + colSpan, 0);
    const colSpanWidth = LINE_WIDTH / colSpansTotal;
    let curX = MARGIN;
    let maxHeight = 0;

    columns.forEach(({ content, colSpan }) => {
        const width = colSpanWidth * colSpan;

        doc.text(content, curX, curY, { width });

        curX += width;
        maxHeight = Math.max(maxHeight, doc.heightOfString(content, { width }));
    });

    doc
        .lineWidth(isHeader ? 1 : 0.5)
        .moveTo(MARGIN, curY + maxHeight + 4)
        .lineTo(LINE_WIDTH, curY + maxHeight + 4)
        .stroke();

    return maxHeight + 12;
}

function updateCurrentYPosition(doc: typeof PDFDocument, curY: number, height: number): number {
    return curY + height + MARGIN;
}

function formatColumnActions(action: Action, columnsStructure: ColumnStructure[]): ColumnAction[] {
    return columnsStructure.map(({ colSpan, key }) => {
        let content;
        if (key === 'second') {
            content = convertSecondsToMMSS(action.second);
        } else if (key === 'comment') {
            content = action.comment || '';
        } else if (key === 'type') {
            const type = translate(action.type);
            const card = action.card ? ` (${translate(action.card)})` : '';
            content = `${type}${card}`;
        } else {
            content = translate(action[key]);
        }

        return { content, colSpan };
    });
}

function getActionsSortedByTime(actions: Action[]): Action[] {
    return actions.sort((a, b) => a.second - b.second);
}

function getSectorsWithAtLeastOneDecision(actions: Action[]): string[] {
    const uniqueSectors = actions
        .reduce<Set<string>>((sectors, action) => {
            sectors.add(action.sector);
            return sectors;
        }, new Set());

    return Array
        .from(uniqueSectors)
        .sort((a, b) => a.localeCompare(b));
}
