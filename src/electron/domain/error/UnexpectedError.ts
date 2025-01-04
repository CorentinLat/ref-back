import { BaseError } from './BaseError';

export class UnexpectedError extends BaseError {
    constructor() {
        super('Unexpected error');
    }
}
