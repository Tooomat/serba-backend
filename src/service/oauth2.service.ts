import { Request, Response } from "express";
import { oauth2Client, scopes } from "../application/google-oauth2";
import { OAuth2CallbackRequest, OAuth2Request, OAuth2Response } from "../model/oauth2.model";
import { JWT, OAuthStatePayload } from "../utils/jwt.utils";
import { OAuth2Validation } from "../validation/oauth2.validation";
import { Validation } from "../validation/validation";
import { config } from "../config/env";
import { prismaClient } from "../application/database";
import { blacklistStateToken, isStateTokenBlacklisted, saveRefreshToken } from "../application/redis";
import { Providers } from "../generated/prisma/enums";
import { randomUUID } from "crypto";

export class OAuth2Service {
    static async initiateGoogleAuth(query: OAuth2Request, res: Response): Promise<OAuth2Response> {
        const validate = Validation.validate(OAuth2Validation.GOOGLE_OAUTH2_SCHEMA, query)

        const allowedRedirects = ["/"] 
        const redirectPath = allowedRedirects.includes(validate.redirectPath)
            ? validate.redirectPath
            : "/"

        // Generate state token untuk CSRF protection
        const { token: stateToken } = JWT.generateOAuth2StateToken({
            intent: "google-auth",
            redirect: redirectPath,
        })

        // Generate a url that asks permissions
        const authorizationUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
            scope: scopes,
            state: stateToken, // Kirim state token ke Google
            include_granted_scopes: true, // Enable incremental authorization. Recommended as a best practice.
            prompt: 'consent' // always display consent screen
        })
        
        // Simpan state token di response (frontend akan track ini)
        // Atau simpan di cookie untuk verifikasi nanti
        res.cookie("state_token", stateToken, {
            httpOnly: config.HTTPONLY_COOKIES,
            secure: config.SECURE_COOKIES,
            sameSite: config.SAMESITE_COOKIES,
            path: config.GOOGLE_REDIRECT_URL,
            maxAge: 5 * 60 * 1000, // 5 minutes
        })

        return {
            authUrl: authorizationUrl
        }
    }

    static async findOrCreateGoogleUser(query: OAuth2CallbackRequest, req: Request, res: Response): Promise<void> {
        const validate = Validation.validate(OAuth2Validation.GOOGLE_OAUTH2_CALLBACK_SCHEMA, query)

        if (!validate.code || !validate.state) {
            res.redirect(`${config.FRONTEND_URL}/auth/login?error=missing_params`)
            return
        }

        // Compare state dengan cookie
        const stateFromCookie = req.cookies.state_token
        if (!stateFromCookie || stateFromCookie !== validate.state) {
            res.redirect(`${config.FRONTEND_URL}/auth/login?error=invalid_state`)
            return
        }

        // Verify state token (CSRF check)
        const payload = JWT.verifyOAuth2StateToken(validate.state)
        if (!payload) {
            res.redirect(`${config.FRONTEND_URL}/auth/login?error=invalid_state_token`)
            return
        }

        // CEK BLACKLIST (ANTI REPLAY)
        const isBlacklisted = await isStateTokenBlacklisted(payload.jti)
        if (isBlacklisted) {
            res.redirect(`${config.FRONTEND_URL}/auth/login?error=state_used`)
            return
        }

        // Exchange authorization code -> tokens
        const { tokens } = await oauth2Client.getToken(validate.code)
        if (!tokens.id_token) {
            res.redirect(`${config.FRONTEND_URL}/auth/login?error=no_id_token`)
            return
        }

        // Verify ID Token ke Google
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: config.GOOGLE_CLIENT_ID,
        })

        const googlePayload = ticket.getPayload()

        if (!googlePayload || !googlePayload.sub || !googlePayload.email) {
            res.redirect(`${config.FRONTEND_URL}/auth/login?error=invalid_google_payload`)
            return
        }

        const providerUserId = googlePayload.sub
        const email = googlePayload.email
        const firstName = googlePayload.given_name ?? googlePayload.name ?? "User"
        const lastName = googlePayload.family_name ?? null
        const picture = googlePayload.picture ?? null

        // cari user yang exsist apa tidak
        // user regis dengan email bisa continue dengan google
        let oauthAccount = await prismaClient.oAuthAccount.findUnique({
            where: {
                provider_providerUserId: {
                    provider: "GOOGLE",
                    providerUserId: providerUserId
                }
            },
            include: { 
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                        status: true,
                        isProfileComplete: true
                    }
                } 
            }
        })

        let user

        // CASE 1: OAuthAccount sudah ada → continue with GOOGLE
        if (oauthAccount) {
           user = oauthAccount.user

           if (user.status === 'BLOCKED') {
                res.redirect(`${config.FRONTEND_URL}/auth/login?error=account_blocked`)
                return
            }
           
           await prismaClient.oAuthAccount.update({
                where: {
                    id: oauthAccount.id
                },
                data: {
                    lastUsedAt: new Date()
                }
           })
        
        // CASE 2: OAuthAccount belum ada → continue with GOOGLE
        } else {
            // CEK EMAIL (untuk linking)
            const existingUser = await prismaClient.user.findUnique({
                where: { 
                    email: email 
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    profilePictUrl: true,
                    status: true,
                    isProfileComplete: true,
                }
            })

            // USE CASE 1: untuk user yang sebelumnya regis/login with email
            // dan mencoba continue with GOOGLE
            if (existingUser) {
                if (existingUser.status === 'BLOCKED') {
                    res.redirect(`${config.FRONTEND_URL}/auth/login?error=account_blocked`)
                    return
                }

                user = existingUser
                await prismaClient.$transaction(async (tx) => {
                    await tx.oAuthAccount.create({
                        data: {
                            provider: Providers.GOOGLE,
                            providerUserId: providerUserId,
                            email: email,
                            givenName: firstName,
                            familyName: lastName,
                            profilePictUrl: picture,
                            userId: existingUser.id,
                            scope: "openid profile email",
                            lastUsedAt: new Date()
                        }
                    })

                    if (picture && !existingUser.profilePictUrl) {
                        await tx.user.update({
                            where: { 
                                id: existingUser.id 
                            },
                            data: { 
                                profilePictUrl: picture 
                            }
                        })
                    }

                })

            // USE CASE 2: untuk user yang belum regis/login with email dan belum punya akun GOOGLE
            } else {
                user = await prismaClient.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            username: this.generateUsername(email),
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            role: "USER",
                            isProfileComplete: false,
                            profilePictUrl: picture,
                            isEmailVerified: true,
                            emailVerifiedAt: new Date(),
                        }
                    })
    
                    await tx.oAuthAccount.create({
                        data: {
                            provider: Providers.GOOGLE,
                            providerUserId: providerUserId,
                            email: email,
                            givenName: firstName,
                            familyName: lastName,
                            profilePictUrl: picture,
                            userId: newUser.id,
                            scope: "openid profile email",
                            lastUsedAt: new Date()
                        }
                    })

                    return newUser
                })
            }
        }

        // Generate JWT
        const accessToken = JWT.generateAccessToken({
            sub: user.id,
            username: user.username,
            role: user.role
        })

        const { token: refreshToken, jti } = JWT.generateRefreshToken({ 
            sub: user.id 
        })
        await saveRefreshToken(
            user.id, 
            jti, 
            refreshToken, 
            60 * 60 * 24 * 7
        )

        res.cookie(
            "refresh_token", refreshToken, {
                httpOnly: config.HTTPONLY_COOKIES,
                secure: config.SECURE_COOKIES, // localhost
                sameSite: config.SAMESITE_COOKIES,
                path: config.PATH_REFRESH_TOKEN_COOKIES, // only send to
                maxAge: 7 * 24 * 60 * 60 * 1000,
            }
        )

        // BLACKLIST STATE (ONE-TIME USE)
        const exp = JWT.getExp(validate.state)
        if (exp) {
            await blacklistStateToken(payload.jti, exp)
        }

        // CLEAR COOKIE STATE
        res.clearCookie("state_token", {
            httpOnly: config.HTTPONLY_COOKIES,
            secure: config.SECURE_COOKIES,
            sameSite: config.SAMESITE_COOKIES,
            path: config.GOOGLE_REDIRECT_URL
        })

        res.redirect(
            `${config.FRONTEND_URL}${payload.redirect}?accessToken=${accessToken}&isProfileComplete=${user.isProfileComplete ?? false}`
        )
        return
    }

    private static generateUsername(email: string): string {
        const baseUsername = (email.split("@")[0] ?? 'user').replace(/[^a-zA-Z0-9]/g, '') || 'user'
        const randomStr = randomUUID().replace(/-/g, '').substring(0, 6)
        return `${baseUsername}_${randomStr}`
    }
}