import { Decision } from '../../../../type/refBack';

export type TranslatedDecision = Decision & {
    sectorLabel: string;
    faultLabel: string;
    preciseLabel: string;
    typeLabel: string;
};
