import { BaseError } from './BaseError';

export class NotEnoughSpaceError extends BaseError {
    constructor() {
        super('Not enough space', { notEnoughSpace: true });
    }
}
