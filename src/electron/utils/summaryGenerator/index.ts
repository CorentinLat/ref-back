import { SummaryExportType } from '../../../../type/refBack';

import { Game } from '../game';

import { generateExcelSummary } from './excel';
import { generatePdfSummary } from './pdf';

export function generateSummary(game: Game, saveDirectory: string, exportType: SummaryExportType) {
    switch (exportType) {
        case 'excel':
            return generateExcelSummary(game, saveDirectory);
        case 'pdf':
            return generatePdfSummary(game, saveDirectory);
    }
}
