import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ResponseError } from "../../error/service-response.error";
import { logger } from "../../application/logging";

const getStatusMessage = (status: number): string => {
    const statusMessages: Record<number, string> = {
        400: "Bad request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not found",
        409: "Conflict",
        410: "Gone",
        422: "Unprocessable entity",
        429: "Too many requests",
        500: "Internal server error",
        502: "Bad gateway",
        503: "Service unavailable"
    }

    return statusMessages[status] || "An error occurred"
}

export const ErrorHandlerMiddleware = async (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 
    const requestId = (req as any).requestId
    const userId = (req as any).user?.id ?? 'anonymous'

    const baseLog = {
        requestId,
        userId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    }
    //

    if (err instanceof ZodError) {
        // Validasi error — tidak perlu log, ini kesalahan user
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: err.issues.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }))
        })
    } else if (err instanceof ResponseError) {
        // 4xx — log warn untuk event keamanan
        // OWASP A09 - Logging & Monitoring: Error logging dengan stack trace — error handler log stack trace
        if (err.status === 401 || err.status === 403) {
            logger.warn({
                type: 'security:access_denied',
                ...baseLog,
                statusCode: err.status,
                reason: err.message
            })
        } else if (err.status === 429) {
            logger.warn({
                type: 'security:rate_limit_exceeded',
                ...baseLog,
                statusCode: err.status
            })
        } else if (err.status >= 500) {
            logger.error({
                type: 'error:response',
                ...baseLog,
                statusCode: err.status,
                message: err.message
            })
        }
        //

        res.status(err.status).json({
            success: false,
            message: getStatusMessage(err.status),
            errors: err.message
        })
    } else {
        // 5xx unhandled — log error dengan stack trace
        // OWASP - Logging & Monitoring: Error logging dengan stack trace — error handler log stack trace
        logger.error({
            type: 'error:unhandled',
            ...baseLog,
            message: err.message,
            stack: err.stack
        })
        //
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
            errors: err.message
        })
    }
}

