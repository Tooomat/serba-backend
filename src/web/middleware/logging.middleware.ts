import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import { logger } from "../../application/logging";

// OWASP A09 - Logging & Monitoring: Request/Response logging — log untuk setiap HTTP request masuk:
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    const requestId = randomUUID()

    // Attach requestId ke request untuk di-trace
    ;(req as any).requestId = requestId

    res.on('finish', () => {
        const duration = Date.now() - start
        const logData = {
            type: 'http:request',
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: (req as any).user?.id ?? 'anonymous'
        }

        if (res.statusCode >= 500) {
            logger.error(logData)
        } else if (res.statusCode >= 400) {
            logger.warn(logData)
        } else {
            logger.info(logData)
        }
    })

    next()
}