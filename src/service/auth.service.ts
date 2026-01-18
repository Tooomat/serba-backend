import { config } from "../config/env";
import { prismaClient } from "../application/database";
import { Request, Response } from "express";
import { ResponseError } from "../error/service-response.error";
import * as model from "../model/auth.model";
import { accessTokenPayload, JWT } from "../utils/jwt.utils";
import { AuthValidation } from "../validation/auth.validation";
import { Validation } from "../validation/validation";
import bcrypt from "bcrypt";
import { getRefreshToken, saveRefreshToken } from "../application/redis";

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
            throw new ResponseError(400, "username already exists")
        }
        if (totalUserWithSameEmail != 0) {
            throw new ResponseError(400, "email already exists")
        }

        validation.password = await bcrypt.hash(validation.password, 10)

        const user = await prismaClient.user.create({
            data: {
                username: validation.username,
                email: validation.email,
                password: validation.password,
                firstName: validation.firstName,
                birthDate: validation.birthDate,
                phone: validation.phone,
                lastName: validation.lastName ?? null,
                profilePictUrl: validation.profilePictUrl ?? null,
            }
        })

        return model.toRegisterResponse(user)
    }

    static async login(req: model.loginRequest,  res: Response): Promise<model.loginResponse>{
        const validation = Validation.validate(AuthValidation.LOGINSCHEMA, req)

        const user = await prismaClient.user.findFirst({
            where: {
                OR: [
                    { email: validation.usernameOrEmail },
                    { username: validation.usernameOrEmail }
                ]
            }
        })

        if (!user) {
            throw new ResponseError(401, "Invalid credentials");
        }

        // Check if user account is blocked
        if (user.status === 'BLOCKED') {
            throw new ResponseError(403, "Account has been blocked");
        }

        const isPasswordValid = await bcrypt.compare(validation.password, user.password)
        if (!isPasswordValid) {
            throw new ResponseError(401, "Invalid credentials")
        }

        const payload: accessTokenPayload = {
            sub: user.id,
            username: user.username,
            role: user.role
        }
        const accessToken = JWT.generateAccessToken(payload)
        const { token: refreshToken, jti } = JWT.generateRefreshToken({ sub: user.id })

        // save refresh token to redis
        saveRefreshToken(
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
}