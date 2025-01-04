import { BaseError } from './BaseError';

export class CancelVideoProcessingError extends BaseError {
    constructor() {
        super('Video processing cancelled', { cancelled: true });
    }
}
