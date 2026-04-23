import { User } from "../generated/prisma/client"
import { formater } from "../utils/formater.utils"

export const MAX_ATTEMPTS = 5

// ==================== SEND OTP ====================
export type sendOtpRequest = {
    phone?: string
}
export type sendOtpResponse = {
    phone: string       // masked, e.g. +62812****5678
    expiresIn: number   // detik
}
export function toSendOtpResponse(
    phone: string,
    expiresAt: Date
): sendOtpResponse {
    return {
        phone: formater.maskPhone(phone),
        expiresIn: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    }
}

// ==================== VERIFY OTP ====================
export type verifyOtpRequest = {
    otp: string
}
export type verifyOtpResponse = {
    phoneVerifiedAt?: Date | null
    userId: string
    status: string
}

export function toVerifyOtpResponse(
    user: Pick<User, 'id' | 'phoneVerifiedAt' | 'status'>
): verifyOtpResponse {
    return {
        phoneVerifiedAt: user.phoneVerifiedAt,
        userId: user.id,
        status: user.status
    }
}