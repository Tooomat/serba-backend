import * as env from "../config/env"
import winston from "winston";
import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

export const logger = winston.createLogger({
    level: (env.config.NODE_ENV === "development" || env.config.NODE_ENV === "test") ? "debug" : "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        //new winston.transports.File({ filename: 'combined.log' })
    ]
})

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

// OWASP A09 - Logging & Monitoring: Security event logging — log untuk event keamanan:
export const securityLogger = {
    // Login berhasil
    loginSuccess: (userId: string, ip: string) => {
        logger.info({
            type: 'security:login_success',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    },

    // Login gagal
    loginFailed: (email: string, ip: string, reason: string) => {
        logger.warn({
            type: 'security:login_failed',
            email,
            ip,
            reason,
            timestamp: new Date().toISOString()
        })
    },

    // Logout
    logout: (userId: string, ip: string) => {
        logger.info({
            type: 'security:logout',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    },

    // Akses ditolak (401/403)
    accessDenied: (userId: string | null, ip: string, url: string, reason: string) => {
        logger.warn({
            type: 'security:access_denied',
            userId: userId ?? 'anonymous',
            ip,
            url,
            reason,
            timestamp: new Date().toISOString()
        })
    },

    // Rate limit exceeded
    rateLimitExceeded: (ip: string, userId: string | null, url: string) => {
        logger.warn({
            type: 'security:rate_limit_exceeded',
            ip,
            userId: userId ?? 'anonymous',
            url,
            timestamp: new Date().toISOString()
        })
    },

    // Token tidak valid / expired
    invalidToken: (ip: string, url: string, reason: string) => {
        logger.warn({
            type: 'security:invalid_token',
            ip,
            url,
            reason,
            timestamp: new Date().toISOString()
        })
    },

    // Verifikasi email
    emailVerified: (userId: string, ip: string) => {
        logger.info({
            type: 'security:email_verified',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    },

    // Password reset
    passwordReset: (userId: string, ip: string) => {
        logger.info({
            type: 'security:password_reset',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    }
}
//
