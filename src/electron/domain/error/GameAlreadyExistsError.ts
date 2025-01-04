import { BaseError } from './BaseError';

export class GameAlreadyExistsError extends BaseError {
    constructor() {
        super('Game already existing', { alreadyExisting: true });
    }
}
