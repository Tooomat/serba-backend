import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ResponseError } from "../../error/service-response.error";
import { logger } from "../../application/logging";
import { errorUtils } from "../../utils/error.utils";
import { securityLogger } from "../../utils/logging.utils";

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
    const requestId = (req as any).requestId
    const userId   = (req as any).user?.id ?? 'anonymous'
    const ip       = req.ip ?? 'unknown'

    const baseLog = {
        requestId,
        userId,
        method: req.method,
        url: req.originalUrl,
        ip
    }

    if (err instanceof ZodError) {
        // Validasi error — tidak perlu log, ini kesalahan user
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: err.issues.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }))
        })
    }

    if (err instanceof ResponseError) {
        const origin = errorUtils.parseErrorOrigin(err)

        if (err.status === 401 || err.status === 403) {
            securityLogger.accessDenied(
                userId, 
                ip, 
                req.originalUrl, 
                err.message,
                origin, 
                requestId
            )
        } else if (err.status === 429) {
            securityLogger.rateLimitExceeded(
                ip, 
                userId, 
                req.originalUrl, 
                err.status, 
                origin, 
                requestId
            )
        } else if (err.status >= 500) {
            logger.error({
                type: 'error:response',
                ...baseLog,
                statusCode: err.status,
                message: err.message,
                origin
            })
        }

        return res.status(err.status).json({
            success: false,
            message: getStatusMessage(err.status),
            errors: err.message
        })
    }

    // Unexpected error — log full stack
    logger.error({
        type: 'error:unhandled',
        ...baseLog,
        message: err.message,
        origin: errorUtils.parseErrorOrigin(err),
        stack: err.stack
    })

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        errors: err.message
    })
}