export default class CancelVideoCommandException extends Error {
    constructor() {
        super('Video command cancelled.');
    }
}
