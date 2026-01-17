import { config } from "../config/env";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { loginRequest, loginResponse, registerRequest, registerResponse, toRegisterResponse } from "../model/auth.model";
import { JWT } from "../utils/jwt.utils";
import { AuthValidation } from "../validation/auth.validation";
import { Validation } from "../validation/validation";
import bcrypt from "bcrypt";
import { saveRefreshToken } from "../application/redis";
import { Response } from "express";

export class AuthService {
    static async register(req: registerRequest): Promise<registerResponse> {
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

        return toRegisterResponse(user)
    }

    static async login(req: loginRequest, res: Response): Promise<loginResponse>{
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

        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role
        }
        const accessToken = JWT.generateAccessToken(payload)
        const { token: refreshToken, jti } = JWT.generateRefreshToken(payload)

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
                httpOnly: true,
                secure: config.NODE_ENV === "production", // jika pakai ngrok set true
                sameSite: "strict",
                path: "/api/auth/refresh", // only send to
                maxAge: 7 * 24 * 60 * 60 * 1000,
            }
        )

        return {
            accessToken: accessToken,
        }
    }
}