import { config } from "../config/env"
import jwt, { SignOptions } from "jsonwebtoken"
import type { StringValue } from "ms"
import { Role } from "../generated/prisma/enums"
import { ResponseError } from "../error/service-response.error"
import { randomUUID } from "crypto"

export type OAuthStatePayload = {
    intent: string // "google-auth", "github-auth", dll
    redirect: string // kemana redirect setelah login (e.g., "/dashboard")
    jti: string
    iat: number
    exp: number
}

export type accessTokenPayload = {
    sub: string
    username: string
    role: Role
}

export type refreshTokenPayload = {
    sub: string
    jti: string
}

export class JWT {
    static generateOAuth2StateToken(payload: { intent: string, redirect: string }) {
        const jti = randomUUID()

        const options: SignOptions = {
            algorithm: "HS256",
            expiresIn: config.JWT_OAUTH_STATE_EXPIRE as StringValue,
        }

        const token = jwt.sign(
            { intent: payload.intent, redirect: payload.redirect, jti },
            config.JWT_OAUTH_STATE_SECRET, 
            options
        )

        return { token, jti }
    }

    // OWASP A02 - Cryptographic Failures = access token using JWT
    static generateAccessToken(payload: accessTokenPayload) {
        const options: SignOptions = {
            algorithm: "HS256",
            expiresIn: config.JWT_ACCESS_EXPIRE as StringValue,
        }
    
        return jwt.sign(payload, config.JWT_ACCESS_SECRET, options)
    }
    
    // OWASP A02 - Cryptographic Failures = refresh token using JWT
    static generateRefreshToken(payload: { sub: string }) { // only use sub and jti
        const jti = randomUUID()

        const options: SignOptions = {
            algorithm: "HS256",
            expiresIn: config.JWT_REFRESH_EXPIRE as StringValue,
        }

        const token = jwt.sign(
            { sub: payload.sub, jti },
            config.JWT_REFRESH_SECRET, 
            options
        )

        return { token, jti }
    }

    static verifyOAuth2StateToken(stateToken: string): OAuthStatePayload {
        try {
            const decoded = jwt.verify(
                stateToken,
                config.JWT_OAUTH_STATE_SECRET
            ) as OAuthStatePayload;

            return decoded
        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw new ResponseError(401, 'State token has expired');
            }
            if (e instanceof jwt.JsonWebTokenError) {
                throw new ResponseError(401, 'Invalid state token');
            }
            throw e
        }
    }

    static verifyAccessToken(token: string): accessTokenPayload {
        try {
            const decode = jwt.verify(token, config.JWT_ACCESS_SECRET, {
                algorithms: ["HS256"]
            }) as accessTokenPayload

            return decode 
        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw new ResponseError(401, 'Access token has expired');
            }
            if (e instanceof jwt.JsonWebTokenError) {
                throw new ResponseError(401, 'Invalid access token');
            }
            throw e
        }
    }

    static verifyRefreshToken(token: string): refreshTokenPayload  {
        try {
            const decode = jwt.verify(token, config.JWT_REFRESH_SECRET, {
                algorithms: ["HS256"]
            }) as refreshTokenPayload 

            return decode 
        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw new ResponseError(401, 'Refresh token has expired');
            }
            if (e instanceof jwt.JsonWebTokenError) {
                throw new ResponseError(401, 'Invalid refresh token');
            }
            throw e;
        }
    }

    static getExp(token: string): number | null {
        const decoded = jwt.decode(token)

        if (!decoded || typeof decoded !== "object") return null

        return "exp" in decoded ? decoded.exp as number : null
    }

 }

