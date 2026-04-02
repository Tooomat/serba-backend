import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import { ResponseError } from "../../error/service-response.error";
import { JWT } from "../../utils/jwt.utils";
import { prismaClient } from "../../application/database";
import { isBlacklisted } from "../../application/redis";
import { securityLogger } from "../../utils/logging.utils";

export interface AuthRequest extends Request {
    token?: {
        accessToken: string,
        exp: number
    },
    user?: {
        id: string,
        username: string,
        role: Role
    }
}

// OWASP A01 - Broken Access Control = cek token setiap request
export class AuthMiddleware {
    static async checkAuthorization(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization
            if (!authHeader) {
                securityLogger.accessDenied(
                    null,
                    req.ip ?? 'unknown',
                    req.originalUrl,
                    'Missing authorization header',
                    (req as any).requestId
                )
                return next(new ResponseError(401, "Missing Authorization header"))
            }

            const parts = authHeader.split(" ")
            if (parts.length !== 2 || parts[0] !== "Bearer") {
                securityLogger.invalidToken(
                    req.ip ?? 'unknown',
                    req.originalUrl,
                    'Invalid authorization format',
                    (req as any).requestId
                )
                return next(new ResponseError(401, "Invalid authorization format"))
            }

            const token = parts[1]
            if (!token) {
                return next(new ResponseError(401, "Missing access token"))
            }

            // Verifikasi token
            let payload
            try {
                payload = JWT.verifyAccessToken(token)
            } catch (error) {
                securityLogger.invalidToken(
                    req.ip ?? 'unknown',
                    req.originalUrl,
                    error instanceof Error ? error.message : 'Invalid token',
                    (req as any).requestId
                )
                return next(new ResponseError(401, "Invalid or expired token"))
            }

            // Cek blacklist
            const isBlacklist = await isBlacklisted(token)
            if (isBlacklist) {
                securityLogger.invalidToken(
                    req.ip ?? 'unknown',
                    req.originalUrl,
                    'Token blacklisted',
                    (req as any).requestId
                )
                return next(new ResponseError(401, "Token already blacklisted"))
            }

            // Cek user
            const user = await prismaClient.user.findUnique({
                where: { id: payload.sub }
            })
            if (!user) {
                securityLogger.accessDenied(
                    payload.sub,
                    req.ip ?? 'unknown',
                    req.originalUrl,
                    'User not found',
                    (req as any).requestId
                )
                return next(new ResponseError(401, "Unauthorized"))
            }
            if (user.status === "BLOCKED") {
                securityLogger.accessDenied(
                    user.id,
                    req.ip ?? 'unknown',
                    req.originalUrl,
                    'Account blocked',
                    (req as any).requestId
                )
                return next(new ResponseError(403, "Account has been blocked"))
            }

            req.token = {
                accessToken: token,
                exp: JWT.getExp(token)!
            }
            req.user = {
                id: payload.sub,
                username: payload.username,
                role: payload.role
            }

            next()

        } catch (error) {
            next(error)
        }
    }
}