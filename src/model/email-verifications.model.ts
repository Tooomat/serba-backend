import { User } from "../generated/prisma/client"
import { formater } from "../utils/formater.utils"

// ==================== SEND EMAIL VERIFICATION =====================
export type sendEmailVerificationRequest = {
    email: string
}
export type sendEmailVerificationResponse = {
    email: string
    expiresIn: number
}

export function toSendEmailVerificationResponse(
    user: Pick<User, 'email'> | null,
    expiresAt: Date,
): sendEmailVerificationResponse {
    const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    return {
        email: user?.email ? formater.maskEmail(user.email) : 'hidden',
        expiresIn: expiresIn
    }
}

// ==================== VERIFY EMAIL ===================
export type verifyEmailQuery = {
    token: string
}
export type verifyEmailResponse = {
    emailVerifiedAt?: Date | null
    userId: string
}
export function toVerifyEmailResponse(
    user: Pick<User, 'id' | 'emailVerifiedAt' >
): verifyEmailResponse {
    return { 
        emailVerifiedAt: user.emailVerifiedAt,
        userId: user.id
    }
}