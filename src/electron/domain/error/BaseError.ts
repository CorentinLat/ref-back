export abstract class BaseError extends Error {
    public readonly type = 'BaseError';

    protected constructor(message: string, public body?: any) {
        super(message);
    }
}
