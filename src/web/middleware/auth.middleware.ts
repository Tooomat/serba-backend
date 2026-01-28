import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import { ResponseError } from "../../error/service-response.error";
import { JWT } from "../../utils/jwt.utils";
import { prismaClient } from "../../application/database";
import { isBlacklisted } from "../../application/redis";

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

export class AuthMiddleware {
    static async checkAuthorization(req: AuthRequest, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization
        if (!authHeader) {
            throw new ResponseError(401, "Missing Authorization header")
        }
        if (!authHeader.startsWith("Bearer")) {
            throw new ResponseError(401, "Invalid authorization format")
        }
        
        const token = authHeader.substring(7)
        if (!token) {
            throw new ResponseError(401, "Missing access token")
        }
        const payload = JWT.verifyAccessToken(token)

        const isBlacklist = await isBlacklisted(token)
        if (isBlacklist) {
            throw new ResponseError(401, "Token already blacklisted")
        }

        const user = await prismaClient.user.findUnique({
            where: {
                id: payload.sub
            }
        })
        if (!user) {
            throw new ResponseError(401, "User not found")
        }
        if (user.status === "BLOCKED") {
            throw new ResponseError(403, "Account has been blocked")
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
    }
}