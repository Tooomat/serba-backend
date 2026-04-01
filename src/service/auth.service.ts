import { config } from "../config/env";
import { prismaClient } from "../application/database";
import { Request, Response } from "express";
import { ResponseError } from "../error/service-response.error";
import * as model from "../model/auth.model";
import { accessTokenPayload, JWT } from "../utils/jwt.utils";
import { AuthValidation } from "../validation/auth.validation";
import { Validation } from "../validation/validation";
import bcrypt from "bcrypt";
import { blacklistAccessToken, deleteRefreshToken, getRefreshToken, redis, saveRefreshToken } from "../application/redis";
import { EmailVerificationsService } from "./email-verifications.service";
import { logger } from "../application/logging";

export class AuthService {
    static async register(req: model.registerRequest): Promise<model.registerResponse> {
        const validation = Validation.validate(AuthValidation.REGISTERSCHEMA, req)

        const totalUserWithSameUsername = await prismaClient.user.count({
            where: {
                username: validation.username 
            }
        })
        const totalUserWithSameEmail = await prismaClient.user.count({
            where: {
                email: validation.email 
            }
        })
        if (totalUserWithSameUsername != 0) {
            throw new ResponseError(400, "user already exists")
        }
        if (totalUserWithSameEmail != 0) {
            throw new ResponseError(400, "user already exists")
        }

        validation.password = await bcrypt.hash(validation.password, 10)

        const userData: any = {
            username: validation.username,
            email: validation.email,
            password: validation.password,
            firstName: validation.firstName,
            birthDate: validation.birthDate,
            phone: validation.phone,
        }
        if (validation.lastName !== undefined) {
            userData.lastName = validation.lastName
        }
        if (validation.profilePictUrl !== undefined) {
            userData.profilePictUrl = validation.profilePictUrl
        }

        const user = await prismaClient.user.create({
            data: userData
        })
        
        // fire and forget, tidak perlu await agar tidak block response register
        EmailVerificationsService.sendOnRegister({
            id: user.id,
            email: user.email,
            username: user.username
        }).catch((error) => {
            logger.error("Failed to send verification email on register", {
                userId: user.id,
                error: error.message
            })
        })

        return model.toRegisterResponse(user)
    }

    static async login(req: model.loginRequest,  res: Response): Promise<model.loginResponse>{
        const validation = Validation.validate(AuthValidation.LOGINSCHEMA, req)

        const ATTEMPT_PREFIX = `${config.APP_NAME}:login:attempts`
        const BLOCK_PREFIX   = `${config.APP_NAME}:login:block`
        const MAX_ATTEMPTS   = 10
        const ATTEMPT_WINDOW = 30 * 60  // 30 menit
        const BLOCK_DURATION = 30 * 60  // 30 menit

        const identifier = validation.usernameOrEmail.toLowerCase()

        // Cek account lock SEBELUM query DB
        // Ini juga mencegah attacker pakai login endpoint untuk spam query DB
        const isBlocked = await redis.get(`${BLOCK_PREFIX}:${identifier}`)
        if (isBlocked) {
            const ttl = await redis.ttl(`${BLOCK_PREFIX}:${identifier}`)
            throw new ResponseError(429, `Too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`)
        }

        // Helper: increment failed attempt, return jumlah attempts saat ini
        const recordFailedAttempt = async () => {
            const key = `${ATTEMPT_PREFIX}:${identifier}`
            const attempts = await redis.incr(key)
            if (attempts === 1) await redis.expire(key, ATTEMPT_WINDOW)

            if (attempts >= MAX_ATTEMPTS) {
                await redis.setex(`${BLOCK_PREFIX}:${identifier}`, BLOCK_DURATION, "1")
                await redis.del(key)
                // Opsional: kirim email notifikasi ke user
                // await EmailService.sendAccountLockedNotification(...)
            }
            return attempts
        }

        const user = await prismaClient.user.findFirst({
            where: {
                OR: [
                    { email: validation.usernameOrEmail },
                    { username: validation.usernameOrEmail }
                ]
            }
        })

        const isPasswordValid = user
        ? await bcrypt.compare(validation.password, user.password)
        : false

        if (!isPasswordValid || !user) {
            await recordFailedAttempt()
            throw new ResponseError(401, "Invalid credentials")
        }

        // Check if user account is blocked
        if (user.status === 'BLOCKED') {
            throw new ResponseError(403, "Account has been blocked");
        }

        if (!user.emailVerifiedAt  && user.isEmailVerified === false) {
            throw new ResponseError(404, "Verify your email first")
        }

        const payload: accessTokenPayload = {
            sub: user.id,
            username: user.username,
            role: user.role
        }
        const accessToken = JWT.generateAccessToken(payload)
        const { token: refreshToken, jti } = JWT.generateRefreshToken({ sub: user.id })

        // save refresh token to redis
        await saveRefreshToken(
            user.id, 
            jti, 
            refreshToken, 
            60 * 60 * 24 * 7
        )

        // save refresh token to httpOnly Cookies
        res.cookie(
            "refresh_token", refreshToken, {
                httpOnly: config.HTTPONLY_COOKIES,
                secure: config.SECURE_COOKIES, // localhost
                sameSite: config.SAMESITE_COOKIES,
                path: config.PATH_COOKIES, // only send to
                maxAge: 7 * 24 * 60 * 60 * 1000,
            }
        )
        
        return {
            accessToken: accessToken,
            userId: user.id
        }
    }

    static async renewToken(req: Request): Promise<model.renewTokenResponse> {
        const refreshToken = req.cookies.refresh_token
        if (!refreshToken) {
            throw new ResponseError(401, "Missing refresh token")
        }

        const payload = JWT.verifyRefreshToken(refreshToken)
        const existToken = await getRefreshToken(payload.sub, payload.jti)
        if (!existToken) {
            throw new ResponseError(401, "Refresh token revoke")
        }

        if (existToken !== refreshToken) {
            throw new ResponseError(401, "Invalid refresh token")   
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

        const newAccessToken = JWT.generateAccessToken({
            sub: user.id,
            username: user.username,
            role: user.role
        })

        return {
            newAccessToken: newAccessToken
        }
    }

    static async logout(req: Request, res: Response, accessToken: string, exp: number): Promise<void> {
        const refreshToken = req.cookies.refresh_token
        if (!refreshToken) {
            throw new ResponseError(401, "Missing refresh token")
        }

        const payload = JWT.verifyRefreshToken(refreshToken)
        await blacklistAccessToken(accessToken, exp)
        await deleteRefreshToken(payload.sub, payload.jti)

        res.clearCookie("refresh_token", {
                httpOnly: config.HTTPONLY_COOKIES,
                secure: config.SECURE_COOKIES, // localhost
                sameSite: config.SAMESITE_COOKIES,
                path: config.PATH_COOKIES, // only send to
            }
        )
    }
}