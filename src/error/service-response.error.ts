export class ResponseError extends Error {
    constructor(
        public status: number, 
        public message: string,
        public retryAfter?: number | undefined
    ) {
        super(message)
    }
}