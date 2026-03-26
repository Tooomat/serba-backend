import { User } from "../generated/prisma/client"
import { maskEmail } from "../utils/formater.utils"

export type sendEmailVerificationRequest = {
    email: string
}
export type sendEmailVerificationResponse = {
    email: string
    expiresIn: number
}

export function toSendEmailVerificationResponse(
    user: Pick<User, 'email'>,
    expiresAt: Date,
): sendEmailVerificationResponse {
    const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    return {
        email: maskEmail(user.email),
        expiresIn: expiresIn
    }
}

export type verifyEmailQuery = {
    token: string
}
export type verifyEmailResponse = {
    emailVerifiedAt: Date
}
export function toVerifyEmailResponse(emailVerifiedAt: Date): verifyEmailResponse {
    return { emailVerifiedAt }
}