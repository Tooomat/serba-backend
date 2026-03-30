import { StatusUser, User } from "../generated/prisma/client"

// ======================== REGISTER =========================
export type  registerRequest = {
    username: string
    email: string
    password: string
    profilePictUrl?: string
    firstName: string
    lastName?: string
    birthDate: string
    phone: string
}

export type registerResponse = {
    id: string
    username: string
    email: string
    profilePictUrl?: string | null 
    firstName: string
    lastName?: string | null 
    birthDate: Date
    phone: string
    status: StatusUser
    createdAt: Date
}

export function toRegisterResponse(user: User) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePictUrl: user.profilePictUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        phone: user.phone,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt
    }
}

// ======================== LOGIN =========================
export type loginRequest = {
    usernameOrEmail: string
    password: string
}

export type loginResponse = {
    accessToken: string,
    userId: string
}

// ======================== RENEW TOKEN =========================
export type renewTokenResponse = {
    newAccessToken: string
}