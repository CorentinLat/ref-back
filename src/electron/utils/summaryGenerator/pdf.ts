import fs from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';

import {
    Action,
    Annotation,
    Game,
    getAnnotationsSortedByTime,
    getActionsBySectors,
    isAction,
} from '../../../../type/refBack';

import { convertSecondsToMMSS, getLongDateString } from '../date';
import { assetsPath } from '../path';

import translate from '../../translation';

type Key = 'role' | 'second' | 'type' | 'against' | 'sector' | 'fault' | 'precise' | 'comment' | 'commentFromAdviser';
type ColumnFormat = { content: string; colSpan: number; color: string } | { content: string; width: number; color: string };
type ColumnStructure = { key: Key; colSpan: number } | { key: Key; width: number };
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

const ANNOTATIONS_COLUMNS: ColumnStructure[] = [
    { key: 'role', width: 12 },
    { key: 'second', width: 30 },
    { key: 'comment', colSpan: 1 },
    { key: 'commentFromAdviser', colSpan: 1 },
];
const ACTIONS_COLUMNS: ColumnStructure[] = [
    { key: 'role', width: 12 },
    { key: 'second', width: 30 },
    { key: 'type', width: 55 },
    { key: 'against', width: 40 },
    { key: 'sector', width: 50 },
    { key: 'fault', width: 100 },
    { key: 'precise', width: 30 },
    { key: 'comment', colSpan: 1 },
];

type Icon = 'adviser' | 'referee' | 'warning' | 'whiteCard' | 'yellowCard' | 'redCard';
const ICON_PREFIX = '<icon-';
const ICON_SUFFIX = '>';
const ICONS: Record<Icon, string> = { adviser: '', referee: '', warning: '', whiteCard: '', yellowCard: '', redCard: '' };

let currentYPosition = MARGIN;

export function generatePdfSummary(game: Game, savePath: string): void {
    const { information: { date, gameNumber, score, teams } } = game;

    const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
    doc.registerFont('Icons', join(assetsPath, 'fonts', 'bootstrap-icons.woff'));

    doc.pipe(fs.createWriteStream(savePath));
    currentYPosition = MARGIN;

    addTwoColumnsLine(doc, getLongDateString(date), gameNumber);

    addThreeColumnsLine(doc, 'Helvetica-Bold', teams.local, '-', teams.visitor);
    addThreeColumnsLine(doc, 'Helvetica', score.local, '', score.visitor);

    addGameComments(doc, game);

    const annotations = getAnnotationsSortedByTime(game.actions);

    addStatistics(doc, annotations);

    addAnnotationsTable(doc, 'ALL_ACTIONS', ACTIONS_COLUMNS, annotations);

    const columnsBySector = ACTIONS_COLUMNS.filter(({ key }) => key !== 'sector');
    Object.entries(getActionsBySectors(annotations))
        .forEach(([sector, actions]) => addAnnotationsTable(doc, sector, columnsBySector, actions));

    doc.end();
}

export const generatePdfStatistics = (annotations: Annotation[], savePath: string): Promise<boolean> =>
    new Promise(resolve => {
        const doc = new PDFDocument({ margin: MARGIN, size: [A4_WIDTH, 220] });
        const stream = fs.createWriteStream(savePath);
        doc.pipe(stream);

        currentYPosition = MARGIN;
        const result = addStatistics(doc, annotations);

        doc.end();

        stream.on('finish', () => resolve(result));
    });

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

function addGameComments(doc: typeof PDFDocument, game: Game): void {
    if (game.gameDescription || game.gameDescriptionFromAdviser) {
        addSection(doc, 'GAME_DESCRIPTION');
        if (game.gameDescription) addParagraph(doc, `${translate('REFEREE')}: ${game.gameDescription}`);
        if (game.gameDescriptionFromAdviser) addParagraph(doc, `${translate('ADVISER')}: ${game.gameDescriptionFromAdviser}`);
    }

    if (game.globalPerformance || game.globalPerformanceFromAdviser) {
        addSection(doc, 'GLOBAL_PERFORMANCE');
        if (game.globalPerformance) addParagraph(doc, `${translate('REFEREE')}: ${game.globalPerformance}`);
        if (game.globalPerformanceFromAdviser) addParagraph(doc, `${translate('ADVISER')}: ${game.globalPerformanceFromAdviser}`);
    }
}

function addParagraph(doc: typeof PDFDocument, text: string): void {
    doc.font('Helvetica').fontSize(10);
    doc.text(text, MARGIN, currentYPosition, { align: 'justify' });
    currentYPosition += doc.heightOfString(text, { align: 'justify' }) + MARGIN;
}

function addStatistics(doc: typeof PDFDocument, annotations: Annotation[]): boolean {
    const penalties = annotations.reduce<Action[]>((acc, annotation) =>
        isAction(annotation) && (annotation.type === 'PENALTY' || annotation.type === 'RETURNED_PENALTY')
            ? [...acc, annotation]
            : acc
    , []);
    const freeKicks = annotations.reduce<Action[]>((acc, annotation) =>
        isAction(annotation) && annotation.type === 'FREE_KICK'
            ? [...acc, annotation]
            : acc
    , []);
    if (!penalties.length && !freeKicks.length) { return false; }

    addSection(doc, 'STATISTICS');

    const penaltiesByTeam = getDecisionsBy('against', penalties);
    const freeKicksByTeam = getDecisionsBy('against', freeKicks);
    const penaltiesBySector = getDecisionsBy('sector', penalties);
    const freeKicksBySector = getDecisionsBy('sector', freeKicks);

    const diagramWidth = PAGE_WIDTH / 2;

    let startingY = currentYPosition;
    const penaltiesByTeamHeight = displayCircularDiagramForDecisions(
        doc,
        penaltiesByTeam,
        'PENALTIES_NUMBER',
        0,
        startingY,
        diagramWidth
    );
    const freeKicksByTeamHeight = displayCircularDiagramForDecisions(
        doc,
        freeKicksByTeam,
        'FREE_KICKS_NUMBER',
        diagramWidth,
        startingY,
        diagramWidth
    );

    let heightAdded = Math.max(penaltiesByTeamHeight, freeKicksByTeamHeight) + MARGIN;
    currentYPosition += heightAdded;
    startingY += heightAdded;
    const penaltiesBySectorHeight = displayCircularDiagramForDecisions(doc,
        penaltiesBySector,
        'PENALTIES_BY_SECTORS',
        0,
        startingY,
        diagramWidth
    );
    const freeKicksBySectorHeight = displayCircularDiagramForDecisions(doc,
        freeKicksBySector,
        'FREE_KICKS_BY_SECTORS',
        diagramWidth,
        startingY,
        diagramWidth
    );

    heightAdded = Math.max(penaltiesBySectorHeight, freeKicksBySectorHeight) + MARGIN;
    currentYPosition += heightAdded;

    return true;
}

function displayCircularDiagramForDecisions(
    doc: typeof PDFDocument,
    decisionsBy: DecisionsBy,
    titleKey: string,
    startingX: number,
    startingY: number,
    width: number
): number {
    const decisionsCount = Object.values(decisionsBy).reduce((acc, decisions) => acc + decisions.length, 0);
    if (decisionsCount === 0) {
        return 0;
    }

    const plotWidth = width * 0.4;
    const legendWidth = width - plotWidth;

    const plotHeight = addCircularDiagramPlot(doc, decisionsCount, decisionsBy, startingX, startingY, plotWidth);
    const legendHeight = addCircularDiagramLegend(
        doc,
        decisionsCount.toString(10),
        titleKey,
        decisionsBy,
        startingX + plotWidth,
        startingY,
        legendWidth
    );

    return Math.max(plotHeight, legendHeight);
}

function addCircularDiagramPlot(
    doc: typeof PDFDocument,
    totalDecisionsCount: number,
    decisionsBy: DecisionsBy,
    startingX: number,
    startingY: number,
    width: number
): number {
    const plotRadius = (width - 4 * MARGIN) / 2;
    const plotCenterX = startingX + 2 * MARGIN + plotRadius;
    const plotCenterY = startingY + MARGIN / 2 + plotRadius;
    const decisionAngle = 360 / totalDecisionsCount;

    let startingAngle = 0;
    doc.lineWidth(6);
    Object.values(decisionsBy).forEach((decisions, index) => {
        const decisionsCount = decisions.length;
        const currentAngle = decisionAngle * decisionsCount;
        let endingAngle = startingAngle + currentAngle;
        if (endingAngle % 360 === startingAngle) {
            endingAngle--;
            doc
                .path(describeArc(plotCenterX, plotCenterY, plotRadius, endingAngle, startingAngle))
                .strokeColor(COLORS[index])
                .stroke();
        }

        doc
            .path(describeArc(plotCenterX, plotCenterY, plotRadius, startingAngle, endingAngle))
            .strokeColor(COLORS[index])
            .stroke();

        startingAngle = endingAngle;
    });

    return plotRadius * 2 + MARGIN;
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function addCircularDiagramLegend(
    doc: typeof PDFDocument,
    count: string,
    titleKey: string,
    decisionsBy: DecisionsBy,
    startingX: number,
    startingY: number,
    width: number
): number {
    const legendTopHeight = addCircularDiagramLegendTop(
        doc,
        count,
        titleKey,
        startingX,
        startingY,
        width
    );
    const legendTopBottom = addCircularDiagramLegendBottom(
        doc,
        decisionsBy,
        startingX + 4,
        startingY + legendTopHeight,
        width
    );

    return legendTopHeight + legendTopBottom;
}

function addCircularDiagramLegendTop(
    doc: typeof PDFDocument,
    count: string,
    titleKey: string,
    startingX: number,
    startingY: number,
    width: number
): number {
    doc.font('Helvetica-Bold').fontSize(13);
    doc.text(count, startingX, startingY, { width });
    const countHeight = doc.heightOfString(count, { width });

    doc.font('Helvetica').fontSize(11);
    const globalLabel = translate(titleKey);
    doc.text(globalLabel, { width });
    const labelHeight = doc.heightOfString(globalLabel, { width });

    doc.moveDown(0.5);
    const marginHeight = doc.heightOfString('') * 0.5;

    return countHeight + labelHeight + marginHeight;
}

function addCircularDiagramLegendBottom(
    doc: typeof PDFDocument,
    decisionsBy: DecisionsBy,
    startingX: number,
    startingY: number,
    width: number
): number {
    let diagramLegendBottomHeight = 0;
    let positionY = startingY;
    Object.entries(decisionsBy).forEach(([key, decisions], index) => {
        const itemPositionX = startingX + (index % 2) * width / 2;
        const itemWidth = width / 2 - MARGIN;

        const count = decisions.length.toString(10);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('black');
        doc.text(count, itemPositionX + 6, positionY, { width: itemWidth });
        const countHeight = doc.heightOfString(count, { width: itemWidth });
        positionY += countHeight;

        const label = translate(`AGAINST_${key}`);
        doc.font('Helvetica').fontSize(8).fillColor('gray');
        doc.text(label, itemPositionX + 6, positionY, { width: itemWidth });
        const labelHeight = doc.heightOfString(label, { width: itemWidth });
        positionY += labelHeight;

        const itemHeight = countHeight + labelHeight;
        const strokeYPosition = positionY - itemHeight;
        doc
            .strokeColor(COLORS[index])
            .lineWidth(4)
            .moveTo(itemPositionX, strokeYPosition)
            .lineTo(itemPositionX, strokeYPosition + itemHeight - 2)
            .stroke();

        if (index % 2 === 0) {
            positionY -= itemHeight;
        } else {
            doc.moveDown(0.5);
            const marginHeight = doc.heightOfString('') * 0.5;
            diagramLegendBottomHeight += itemHeight + marginHeight;
        }
    });
    doc.fillColor('black').lineWidth(1).strokeColor('black');

    return diagramLegendBottomHeight;
}

function getDecisionsBy(key: 'against'|'sector', actions: Action[]): DecisionsBy {
    return actions.reduce((decisionsBy, action) => {
        const keyValue = action[key];
        decisionsBy[keyValue] = [...(decisionsBy[keyValue] || []), action];
        return decisionsBy;
    }, {} as { [key: string]: Action[] });
}

function addAnnotationsTable(doc: typeof PDFDocument, title: string, columnsStructure: ColumnStructure[], annotations: Annotation[]): void {
    if (!annotations.length) return;

    addSection(doc, title);

    const headerColumns = columnsStructure.map(structure =>
        'colSpan' in structure
            ? { colSpan: structure.colSpan, content: translate(structure.key), color: 'black' }
            : { width: structure.width, content: translate(structure.key), color: 'black' }
    );
    addTableRow(doc, true, headerColumns);

    annotations.forEach(annotation => {
        const columns = isAction(annotation)
            ? formatColumnAction(annotation, columnsStructure)
            : formatColumnAnnotation(annotation, ANNOTATIONS_COLUMNS);
        const isAdded = addTableRow(doc, false, columns);

        if (!isAdded) {
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

function addTableRow(doc: typeof PDFDocument, isHeader: boolean, columns: ColumnFormat[]): boolean {
    const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
    doc.font(font).fontSize(9);

    const { colSpanWidth, height } = getColSpanWidthAndHeight(doc, columns);
    if (currentYPosition + height > PAGE_HEIGHT) { return false; }

    const lineWidth = isHeader ? 1 : 0.5;
    fillTableLine(doc, columns, { font, colSpanWidth, height, lineWidth });

    return true;
}

function formatColumnAction(action: Action, columnsStructure: ColumnStructure[]): ColumnFormat[] {
    return columnsStructure.map(structure => {
        const { key } = structure;
        let content;
        let color = 'black';

        if (key === 'role') {
            content = action.fromAdviser ? '<icon-adviser>' : '<icon-referee>';
        } else if (key === 'second') {
            content = convertSecondsToMMSS(action.second);
        } else if (key === 'comment') {
            content = '';
            if (action.comment) content = `${translate('REFEREE')} : ${action.comment}`;
            if (action.comment && action.commentFromAdviser) content += '\n';
            if (action.commentFromAdviser) content += `${translate('ADVISER')} : ${action.commentFromAdviser}`;
        } else if (key === 'type') {
            const type = translate(action.type);
            const card = action.card ? ` ${getIconForCard(action)}` : '';
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

        return 'colSpan' in structure
            ? { content, color, colSpan: structure.colSpan }
            : { content, color, width: structure.width };
    });
}

function formatColumnAnnotation(annotation: Annotation, columnsStructure: ColumnStructure[]): ColumnFormat[] {
    return columnsStructure.map(structure => {
        const { key } = structure;
        let content = '';

        if (key === 'role') {
            content = annotation.fromAdviser ? '<icon-adviser>' : '<icon-referee>';
        } else if (key === 'second') {
            content = convertSecondsToMMSS(annotation.second);
        } else if (key === 'comment' && annotation.comment) {
            content = `${translate('REFEREE')} : ${annotation.comment}`;
        } else if (key === 'commentFromAdviser' && annotation.commentFromAdviser) {
            content = `${translate('ADVISER')} : ${annotation.commentFromAdviser}`;
        }

        return 'colSpan' in structure
            ? { content, color: 'black', colSpan: structure.colSpan }
            : { content, color: 'black', width: structure.width };
    });
}

function getColSpanWidthAndHeight(doc: typeof PDFDocument, columns: ColumnFormat[]): { colSpanWidth: number; height: number } {
    const colSpansTotal = columns.reduce((total, column) => total + ('colSpan' in column ? column.colSpan : 0), 0);
    const colWidthsTotal = columns.reduce((total, column) => total + ('width' in column ? column.width : 0), 0);
    const colSpanWidth = (PAGE_WIDTH - colWidthsTotal) / colSpansTotal;

    const height = columns.reduce(
        (max, column) =>
            Math.max(max, doc.heightOfString(column.content.replace(/<icon-[a-z]+>/, ' '), {
                width: 'colSpan' in column ? colSpanWidth * column.colSpan : column.width
            })),
        0
    );

    return { colSpanWidth, height };
}

type FillTableLineOptions = { font: string; colSpanWidth: number; height: number; lineWidth: number };
function fillTableLine(doc: typeof PDFDocument, columns: ColumnFormat[], options: FillTableLineOptions): void {
    let curX = MARGIN;
    columns.forEach(column => {
        curX += formatColumnFormat(doc, column, { ...options, curX });
    });

    doc
        .lineWidth(options.lineWidth)
        .moveTo(MARGIN, currentYPosition + options.height + 4)
        .lineTo(PAGE_WIDTH, currentYPosition + options.height + 4)
        .stroke();

    currentYPosition += options.height + MARGIN * 1.2;
}

type FormatColumnFormatOptions = FillTableLineOptions & { curX: number };
function formatColumnFormat(doc: typeof PDFDocument, column: ColumnFormat, options: FormatColumnFormatOptions): number {
    const { content, color } = column;
    const width = 'colSpan' in column ? options.colSpanWidth * column.colSpan : column.width;

    doc.fillColor(color);
    if (content.startsWith('<icon-') && content.endsWith('>')) {
        const icon = content.slice(6, -1) as Icon;
        writeIcon(doc, icon, { ...options, color, width });
    } else if (content.includes('<icon-')) {
        const [text, icon] = content.split('<icon-');
        writeIcon(doc, icon.slice(0, -1) as Icon, { ...options, color, width });
        doc.text(`     ${text}`, options.curX, currentYPosition, { width });
    } else {
        doc.text(content, options.curX, currentYPosition, { width });
    }

    return width;
}

type WriteIconOptions = FormatColumnFormatOptions & { color: string; width: number };
function writeIcon(doc: typeof PDFDocument, icon: Icon, options: WriteIconOptions): void {
    if (icon in ICONS) {
        const currentFont = doc.options.font || 'Helvetica';
        let color = options.color;

        if (icon === 'yellowCard') color = '#ffc107';
        else if (icon === 'redCard') color = '#dc3545';

        doc.font('Icons').fillColor(color);
        doc.text(ICONS[icon], options.curX, currentYPosition, { width: options.width });
        doc.font(currentFont).fillColor(options.color);
    }
}

function getIconForCard(action: Action): `${typeof ICON_PREFIX}${Icon}${typeof ICON_SUFFIX}` {
    let icon: Icon;
    if (action.card === 'YELLOW') icon = 'yellowCard';
    else if (action.card === 'RED') icon = 'redCard';
    else if (action.card === 'WHITE')  icon = 'whiteCard';
    else icon = 'warning';

    return `${ICON_PREFIX}${icon}${ICON_SUFFIX}`;
}
