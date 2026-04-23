export class ResponseError extends Error {
    constructor(
        public status: number, 
        public message: string,
        public retryAfter?: number | undefined,
        public remainingAttempts?: number | undefined
    ) {
        super(message)
    }
}