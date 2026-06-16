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
import { uploadToCloudinary } from "../helper/cloudinary.helper";
import { Prisma, StatusUser } from "../generated/prisma/client";
import { securityLogger } from "../utils/logging.utils";

export class AuthService {
    static async register(req: Request, reqBody: model.registerRequest, file?: model.UploadedFile): Promise<model.registerResponse> {
        const validation = Validation.validate(AuthValidation.REGISTERSCHEMA, reqBody)

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
        const totalUserWithSamePhone = await prismaClient.user.count({
            where: { 
                phone: validation.phone 
            }
        })
        if (totalUserWithSameUsername != 0) {
            throw new ResponseError(400, "user already exists")
        }
        if (totalUserWithSameEmail != 0) {
            throw new ResponseError(400, "user already exists")
        }
        if (totalUserWithSamePhone !== 0) {
            throw new ResponseError(409, "Phone number already registered")
        }

        validation.password = await bcrypt.hash(validation.password, 10)

        // let profilePictUrl: string | undefined
        // if (file) {
        //     profilePictUrl = await uploadToCloudinary(file, {
        //         folder: "serba/profile-pictures",
        //         transformation: [
        //             { width: 400, height: 400, crop: "fill", gravity: "face" }
        //         ]
        //     })
        // }
        
        const userData: Prisma.UserCreateInput = {
            username: validation.username,
            email: validation.email,
            password: validation.password,
            firstName: validation.firstName,
            birthDate: validation.birthDate,
            phone: validation.phone,
            isProfileComplete: true,
            status: StatusUser.PENDING_VERIFICATION
        }
        if (validation.lastName !== undefined) {
            userData.lastName = validation.lastName
        }

        const user = await prismaClient.user.create({
            data: userData,
            select: {
                id: true,
                username: true,
                email: true,
                profilePictUrl: true,
                firstName: true,
                lastName: true,
                birthDate: true,
                phone: true,
                isProfileComplete: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                status: true,
                createdAt: true
            }
        })

        // Upload setelah user berhasil dibuat, menghindari race condition
        let profilePictUrl: string | undefined
        if (file) {
            profilePictUrl = await uploadToCloudinary(file, {
                folder: "serba/profile-pictures",
                transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "face" }
                ]
            })

            // Update user dengan foto
            await prismaClient.user.update({
                where: { id: user.id },
                data: { profilePictUrl }
            })

            user.profilePictUrl = profilePictUrl
        }
        
        // fire and forget, tidak perlu await agar tidak block response register
        EmailVerificationsService.sendOnRegister({
            id: user.id,
            email: user.email,
            username: user.username
        }).catch((e) => {
            securityLogger.emailVerificationSentFailed(
                user.email,
                req.ip ?? 'unknown',
                `Failed to send verification email on register: ${e.Error}`,
                (req as any).requestId
            )
        })

        return model.toRegisterResponse(user)
    }

    static async login(req: Request, reqBody: model.loginRequest,  res: Response): Promise<model.loginResponse>{
        const validation = Validation.validate(AuthValidation.LOGINSCHEMA, reqBody)

        const ATTEMPT_PREFIX = `${config.APP_NAME}:login:attempts`
        const BLOCK_PREFIX   = `${config.APP_NAME}:login:block`
        const MAX_ATTEMPTS   = 10
        const ATTEMPT_WINDOW = 5 * 60  // 5 menit
        const BLOCK_DURATION = 5 * 60  // 5 menit

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

                securityLogger.accountLocked(
                    identifier,       
                    req.ip ?? 'unknown', 
                    attempts       
                )
                
                throw new ResponseError(429, "Too many failed attempts. Account locked for 30 minutes.")
            }
            return attempts
        }

        const user = await prismaClient.user.findFirst({
            where: {
                OR: [
                    { email: validation.usernameOrEmail },
                    { username: validation.usernameOrEmail }
                ]
            },
            select: {
                id: true,
                password: true,
                status: true,
                emailVerifiedAt: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                phoneVerifiedAt: true,
                username: true,
                role: true,
                isProfileComplete: true,
                birthDate: true
            }
        })

        const isPasswordValid = user
            ? await bcrypt.compare(validation.password, user.password!)
            : false

        if (!isPasswordValid || !user) {
            await recordFailedAttempt()
            throw new ResponseError(401, "Invalid credentials")
        }

        // Check if user account is blocked
        if (user.status === 'BLOCKED') {
            throw new ResponseError(403, "Account has been blocked");
        }

        // if (!user.emailVerifiedAt  && user.isEmailVerified === false) {
        //     throw new ResponseError(403, "Verify your email first")
        // }

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
                path: config.PATH_REFRESH_TOKEN_COOKIES, // only send to
                maxAge: 7 * 24 * 60 * 60 * 1000,
            }
        )
        
        return {
            accessToken: accessToken,
            isEmailVerified: user.isEmailVerified === false && !user.emailVerifiedAt ? false : undefined,
            isPhoneVerified: user.isPhoneVerified === false && !user.phoneVerifiedAt ? false : undefined,
            isBirthDateVerified: user.birthDate ? undefined : false,
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
                path: config.PATH_REFRESH_TOKEN_COOKIES, // only send to
            }
        )
    }
}