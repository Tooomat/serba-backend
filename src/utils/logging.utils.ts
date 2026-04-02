import { logger } from "../application/logging";
import { formater } from "./formater.utils";

// OWASP A09 - Logging & Monitoring: Security event logging — log untuk event keamanan:
export const securityLogger = {
    //  MANDATORY
    loginSuccess: (userId: string, ip: string) => {
        logger.info({
            type: 'security:login_success',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    },

    //  MANDATORY
    loginFailed: (email: string, ip: string, reason: string, requestId?: string) => {
        logger.warn({
            type: 'security:login_failed',
            emailHash: formater.hashPII(email),   // untuk compliance & korelasi antar event
            emailMask: formater.maskEmail(email), // "h**i@gmail.com" — untuk debugging
            ip,
            reason,
            ...(requestId && { requestId }),
            timestamp: new Date().toISOString()
        })
    },

    //  OPTIONAL
    registered: (userId: string, ip: string) => {
        logger.info({
            type: 'security:registered',
            userId,
            ip
        })
    },

    //  MANDATORY
    accountLocked: (email: string, ip: string, attempts: number) => {
        logger.warn({
            type: 'security:account_locked',
            emailHash: formater.hashPII(email),   
            emailMask: formater.maskEmail(email),
            ip,
            attempts
        })
    },

    //  MANDATORY
    logout: (userId: string, ip: string) => {
        logger.info({
            type: 'security:logout',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    },

    //  MANDATORY: Akses ditolak (401/403)
    accessDenied: (userId: string | null, ip: string, url: string, reason: string, requestId?: string) => {
        logger.warn({
            type: 'security:access_denied',
            userId: userId ?? 'anonymous',
            ip,
            url,
            reason,
            ...(requestId && { requestId }),
            timestamp: new Date().toISOString()
        })
    },

    //  MANDATORY
    rateLimitExceeded: (ip: string, userId: string | null, url: string, requestId?: string) => {
        logger.warn({
            type: 'security:rate_limit_exceeded',
            ip,
            userId: userId ?? 'anonymous',
            url,
            ...(requestId && { requestId }),
            timestamp: new Date().toISOString()
        })
    },

    //  MANDATORY: Token tidak valid / expired
    invalidToken: (ip: string, url: string, reason: string, requestId?: string) => {
        logger.warn({
            type: 'security:invalid_token',
            ip,
            url,
            reason,
            ...(requestId && { requestId }),
            timestamp: new Date().toISOString()
        })
    },

    //  MANDATORY
    emailVerified: (userId: string, ip: string) => {
        logger.info({
            type: 'security:email_verified',
            userId,
            ip,
            timestamp: new Date().toISOString()
        })
    },

    //  OPTIONAL
    emailVerificationSentFailed: (email: string, ip: string, reason: string, requestId?: string) => {
        logger.warn({
            type: 'security:email_verification_sent_failed',
            emailHash: formater.hashPII(email),  
            emailMask: formater.maskEmail(email), 
            ip,
            reason,
            ...(requestId && { requestId }),
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
