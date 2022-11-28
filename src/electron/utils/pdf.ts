import fs from 'fs';
import PDFDocument from 'pdfkit';

import { convertSecondsToMMSS, getLongDateString } from './date';
import { Action, Game } from './game';
import translate from '../translation';

type Key = 'second' | 'type' | 'against' | 'sector' | 'fault' | 'precise' | 'comment';
type ColumnAction = { content: string; colSpan: number };
type ColumnStructure = { key: Key; colSpan: number };
type DecisionsBy = { [key: string]: Action[] };

const A4_HEIGHT = 841;
const A4_WIDTH = 595;
const MARGIN = 10;
const PAGE_WIDTH = A4_WIDTH - 2 * MARGIN;
const PAGE_HEIGHT = A4_HEIGHT - 2 * MARGIN;

const COLORS: [number, number, number][] = [
    [52, 136, 136],
    [34, 186, 187],
    [158, 248, 238],
    [255, 233, 154],
    [250, 127, 8],
    [242, 68, 5],
];

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

    addThreeColumnsLine(doc, 'Helvetica-Bold', teams.local, '-', teams.visitor);
    addThreeColumnsLine(doc, 'Helvetica', score.local, '', score.visitor);

    const decisions = getActionsSortedByTime(game.actions);

    addStatistics(doc, decisions);

    addDecisionsTable(doc, 'ALL_ACTIONS', ALL_COLUMNS, decisions);

    const columnsBySector = ALL_COLUMNS.filter(({ key }) => key !== 'sector');
    getSectorsWithAtLeastOneDecision(decisions).forEach(sector => {
        const sectorDecisions = decisions.filter(action => action.sector === sector);

        addDecisionsTable(doc, sector, columnsBySector, sectorDecisions);
    });

    doc.end();
}

function addTwoColumnsLine(doc: typeof PDFDocument, left: string, right: string): void {
    doc.font('Helvetica-Bold').fontSize(12);

    const leftString = left.toString();
    const rightString = right.toString();

    const sideWidth = PAGE_WIDTH / 2;
    doc
        .text(leftString, undefined, currentYPosition, { width: sideWidth, align: 'left' })
        .text(rightString, sideWidth, currentYPosition, { width: sideWidth, align: 'right' });

    const leftHeight = doc.heightOfString(leftString, { width: sideWidth });
    const rightHeight = doc.heightOfString(rightString, { width: sideWidth });
    currentYPosition += Math.max(leftHeight, rightHeight) + MARGIN;
}

function addThreeColumnsLine(doc: typeof PDFDocument, font: string, left: string|number, center: string, right: string|number): void {
    doc.font(font).fontSize(14);

    const leftString = left.toString();
    const rightString = right.toString();

    const centerWidth = doc.widthOfString(center) + MARGIN * 2;
    const sideWidth = (PAGE_WIDTH - centerWidth) / 2;
    doc
        .text(leftString, 0, currentYPosition, { width: sideWidth, align: 'right' })
        .text(center, sideWidth, currentYPosition, { width: centerWidth, align: 'center' })
        .text(rightString, sideWidth + centerWidth, currentYPosition, { width: sideWidth, align: 'left' });

    const leftHeight = doc.heightOfString(leftString, { width: sideWidth });
    const rightHeight = doc.heightOfString(rightString, { width: sideWidth });
    currentYPosition += Math.max(leftHeight, rightHeight);
}

function addStatistics(doc: typeof PDFDocument, actions: Action[]): void {
    addSection(doc, 'STATISTICS');

    const penalties = actions.filter(action => action.type === 'PENALTY');
    const freeKicks = actions.filter(action => action.type === 'FREE_KICK');
    const penaltiesByTeam = getDecisionsBy('against', penalties);
    const freeKicksByTeam = getDecisionsBy('against', freeKicks);
    const penaltiesBySector = getDecisionsBy('sector', penalties);
    const freeKicksBySector = getDecisionsBy('sector', freeKicks);

    const sideWidth = PAGE_WIDTH / 2;
    const plotWidth = sideWidth * 0.4;
    const textWidth = sideWidth - plotWidth;

    let startingY = currentYPosition;
    const penaltiesByTeamHeight = displayCircularDiagramForDecisions(
        doc,
        penaltiesByTeam,
        'PENALTIES_NUMBER',
        0,
        startingY,
        plotWidth,
        textWidth
    );
    const freeKicksByTeamHeight = displayCircularDiagramForDecisions(
        doc,
        freeKicksByTeam,
        'FREE_KICKS_NUMBER',
        sideWidth,
        startingY,
        plotWidth,
        textWidth
    );

    let heightAdded = Math.max(penaltiesByTeamHeight, freeKicksByTeamHeight) + MARGIN;
    currentYPosition += heightAdded;
    startingY += heightAdded;
    const penaltiesBySectorHeight = displayCircularDiagramForDecisions(doc,
        penaltiesBySector,
        'PENALTIES_BY_SECTORS',
        0,
        startingY,
        plotWidth,
        textWidth
    );
    const freeKicksBySectorHeight = displayCircularDiagramForDecisions(doc,
        freeKicksBySector,
        'FREE_KICKS_BY_SECTORS',
        sideWidth,
        startingY,
        plotWidth,
        textWidth
    );

    heightAdded = Math.max(penaltiesBySectorHeight, freeKicksBySectorHeight) + MARGIN;
    currentYPosition += heightAdded;
}

function displayCircularDiagramForDecisions(
    doc: typeof PDFDocument,
    decisionsBy: DecisionsBy,
    titleKey: string,
    startingX: number,
    startingY: number,
    plotWidth: number,
    textWidth: number,
): number {
    const globalCount = Object.values(decisionsBy).reduce((acc, decisions) => acc + decisions.length, 0);
    if (globalCount === 0) {
        return 0;
    }

    doc.font('Helvetica-Bold').fontSize(13);
    const startingTextX = startingX + plotWidth;
    doc.text(globalCount.toString(10), startingTextX, startingY, { width: textWidth });
    const globalCountHeight = doc.heightOfString(globalCount.toString(10), { width: textWidth });
    startingY += globalCountHeight;

    doc.font('Helvetica').fontSize(11);
    const globalLabel = translate(titleKey);
    doc.text(globalLabel, { width: textWidth });
    const globalLabelHeight = doc.heightOfString(globalLabel, { width: textWidth });
    startingY += globalLabelHeight;

    doc.moveDown(0.5);
    const globalMarginHeight = doc.heightOfString('') * 0.5;
    startingY += globalMarginHeight;

    let elementHeight = globalCountHeight + globalLabelHeight + globalMarginHeight;
    Object.entries(decisionsBy).forEach(([team, decisions], index) => {
        const startingLegendX = startingX + plotWidth + (index % 2) * textWidth / 2;
        const width = textWidth / 2 - MARGIN;

        const count = decisions.length.toString(10);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('black');
        doc.text(count, startingLegendX + 10, startingY, { width });
        const countHeight = doc.heightOfString(count, { width });
        startingY += countHeight;

        const label = translate(`AGAINST_${team}`);
        doc.font('Helvetica').fontSize(8).fillColor('gray');
        doc.text(label, startingLegendX + 10, startingY, { width });
        const labelHeight = doc.heightOfString(label, { width });
        startingY += labelHeight;

        const legendHeight = countHeight + labelHeight;
        const legendYPosition = startingY - legendHeight;
        doc
            .strokeColor(COLORS[index])
            .lineWidth(4)
            .moveTo(startingLegendX + 4, legendYPosition)
            .lineTo(startingLegendX + 4, legendYPosition + legendHeight - 2)
            .stroke();

        if (index % 2 === 0) {
            startingY -= legendHeight;
        } else {
            doc.moveDown(0.5);
            const marginHeight = doc.heightOfString('') * 0.5;
            elementHeight += legendHeight + marginHeight;
        }
    });
    doc.fillColor('black').strokeColor('black');

    return elementHeight;
}

function getDecisionsBy(key: 'against'|'sector', actions: Action[]): DecisionsBy {
    return actions.reduce((decisionsBy, action) => {
        const keyValue = action[key];
        decisionsBy[keyValue] = [...(decisionsBy[keyValue] || []), action];
        return decisionsBy;
    }, {} as { [key: string]: Action[] });
}

function addDecisionsTable(doc: typeof PDFDocument, title: string, columnsStructure: ColumnStructure[], actions: Action[]): void {
    addSection(doc, title);

    const headerColumns = columnsStructure.map(({ colSpan, key }) => ({ colSpan, content: translate(key) }));
    addTableRow(doc, true, headerColumns);

    actions.forEach(action => {
        const columns = formatColumnActions(action, columnsStructure);
        if (!addTableRow(doc, false, columns)) {
            doc.addPage();
            currentYPosition = MARGIN;
            addSection(doc, title, true);
            addTableRow(doc, true, headerColumns);
            addTableRow(doc, false, columns);
        }
    });

    currentYPosition += 2 * MARGIN;
}

function addSection(doc: typeof PDFDocument, titleKey: string, isContinued = false): void {
    doc.font('Helvetica-Bold').fontSize(13);

    const title = isContinued ? `${translate(titleKey)} (${translate('CONTINUED')})` : translate(titleKey);
    if (currentYPosition + doc.heightOfString(title) > PAGE_HEIGHT) {
        doc.addPage();
        currentYPosition = MARGIN;
    }

    doc.text(title, MARGIN, currentYPosition);
    currentYPosition += doc.heightOfString(title) + MARGIN / 2;
}

function addTableRow(doc: typeof PDFDocument, isHeader: boolean, columns: ColumnAction[]): boolean {
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);

    const colSpansTotal = columns.reduce((total, { colSpan }) => total + colSpan, 0);
    const colSpanWidth = PAGE_WIDTH / colSpansTotal;
    const maxHeight = columns.reduce(
        (max, { content, colSpan }) =>
            Math.max(max, doc.heightOfString(content, { width: colSpanWidth * colSpan })),
        0
    );

    if (currentYPosition + maxHeight > PAGE_HEIGHT) { return false; }

    let curX = MARGIN;
    columns.forEach(({ content, colSpan }) => {
        const width = colSpanWidth * colSpan;

        doc.text(content, curX, currentYPosition, { width });
        curX += width;
    });

    doc
        .lineWidth(isHeader ? 1 : 0.5)
        .moveTo(MARGIN, currentYPosition + maxHeight + 4)
        .lineTo(PAGE_WIDTH, currentYPosition + maxHeight + 4)
        .stroke();

    currentYPosition += maxHeight + MARGIN * 1.2;

    return true;
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
