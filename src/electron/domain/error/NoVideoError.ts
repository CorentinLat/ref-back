import { BaseError } from './BaseError';

export class NoVideoError extends BaseError {
    constructor() {
        super('No video to handle');
    }
}
