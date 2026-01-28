import { StatusUser, User } from "../generated/prisma/client"

// ======================== REGISTER =========================
export type  registerRequest = {
    username: string
    email: string
    password: string
    profilePictUrl?: string | null 
    firstName: string
    lastName?: string | null
    birthDate: Date
    phone: string
}

export type registerResponse = {
    id: string
    username: string
    email: string
    profilePictUrl?: string | null | undefined
    firstName: string
    lastName?: string | null | undefined
    birthDate: Date
    phone: string
    isEmailVerified?: boolean | false
    isPhoneVerified?: boolean | false
    status: StatusUser
    createdAt: Date
}

export function toRegisterResponse(user: User) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePictUrl: user.profilePictUrl ?? null,
        firstName: user.firstName,
        lastName: user.lastName ?? null,
        birthDate: user.birthDate,
        phone: user.phone,
        isEmailVerified: user?.isEmailVerified,
        isPhoneVerified: user?.isPhoneVerified,
        status: user.status,
        createdAt: user.createdAt
    }
}

// ======================== LOGIN =========================
export type loginRequest = {
    usernameOrEmail: string
    password: string
}

export type loginResponse = {
    accessToken: string
}

// ======================== RENEW TOKEN =========================
export type renewTokenResponse = {
    newAccessToken: string
}