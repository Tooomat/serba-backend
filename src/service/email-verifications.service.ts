import { randomUUID } from "crypto";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    sendEmailVerificationRequest,
    sendEmailVerificationResponse, 
    toSendEmailVerificationResponse, 
    toVerifyEmailResponse, 
    verifyEmailQuery, 
    verifyEmailResponse 
} from "../model/email-verifications.model";
import { config } from "../config/env";
import { enqueueEmail } from "../queues/emails/email.helper";
import { emailTemplate } from "../queues/emails/template";
import { TypeEmail } from "../queues/emails/email.job";
import { Validation } from "../validation/validation";
import { EmailVerificationValidation } from "../validation/email-verification.validation";

// Register → Kirim link verifikasi → 
// User klik link → Backend verify → 
// FE tampil halaman sukses "Email berhasil diverifikasi" + tombol "Login Sekarang" →
// User klik → Masuk halaman login → Input password → Masuk app

const MAX_RESEND_ATTEMPTS = 1
const RESEND_WINDOW_MS = 2 * 60 * 1000   // 5 menit
const RETRY_AFTER_SEC = 120               // 5 menit
const TOKEN_EXPIRES_MS = 1 * 60 * 60 * 1000 // 1 jam

export class EmailVerificationsService {
    static async sendOnRegister(user: { id: string, email: string, username: string }): Promise<void> {
        const token = `token-${randomUUID()}`
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_MS)

        const emailVerif = await prismaClient.emailVerification.create({
            data: {
                id: randomUUID(),
                token,
                expiresAt,
                userId: user.id
            },
            select: {
                id: true
            }
        })

        const link = `${config.FRONTEND_URL}/login/verify-email?token=${token}`

        await enqueueEmail(
            {
                id: emailVerif.id,
                to: user.email,
                subject: 'Verifikasi Email Kamu',
                html: emailTemplate.verification(user.username, link),
                type: TypeEmail.VERIFICATION_ACCOUNT
            }
        )
    }

    static async send(req: sendEmailVerificationRequest): Promise<sendEmailVerificationResponse> {
        const validate = Validation.validate(EmailVerificationValidation.SEND_SCHEMA, req)
        const user = await prismaClient.user.findUnique({
            where: {
                email: validate.email 
            },
            select: {
                id: true,
                email: true,
                emailVerifiedAt: true,
                isEmailVerified: true,
                username: true
            }
        })

        if (!user || (user.isEmailVerified && user.emailVerifiedAt)) {
            return toSendEmailVerificationResponse(
                null, 
                new Date(Date.now() + TOKEN_EXPIRES_MS)
            )
            // Balas seolah-olah sukses — "Email sent if account exists"
        }

        // AMBIL TOKEN TERAKHIR
        // 1 request dalam 2 menit
        const lastVerification = await prismaClient.emailVerification.findFirst({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        if (lastVerification) {
            const nextAllowedTime = lastVerification.createdAt.getTime() + RESEND_WINDOW_MS

            if (Date.now() < nextAllowedTime) {
                const retryAfter = Math.ceil((nextAllowedTime - Date.now()) / 1000)

                throw new ResponseError(
                    429,
                    "Please wait before requesting again",
                    retryAfter
                )
            }
        }

        // Invalidate token lama yang belum dipakai
        await prismaClient.emailVerification.deleteMany({
            where: {
                userId: user.id,
                usedAt: null
            }
        })

        const token = `token-${randomUUID()}`
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_MS)   
        
        const emailVerif = await prismaClient.emailVerification.create({
            data: {
                id: randomUUID(),
                token: token,
                expiresAt: expiresAt,
                userId: user.id
            },
            select: {
                id: true
            }
        })

        // link direct halaman login khusus verify email
        const link = `${config.FRONTEND_URL}/login/verify-email?token=${token}`

        await enqueueEmail(
            {
                id: emailVerif.id,
                to: user.email,
                subject: 'Verifikasi Email Kamu',
                html: emailTemplate.verification(user.username, link),
                type: TypeEmail.VERIFICATION_ACCOUNT
            }
        )
        return toSendEmailVerificationResponse(user, expiresAt)
    }

    static async verify(query: verifyEmailQuery): Promise<verifyEmailResponse> {
        const validate = Validation.validate(EmailVerificationValidation.VERIFY_SCHEMA, query)
        
        const verification = await prismaClient.emailVerification.findUnique({
            where: {
                token: validate.token
            },
            include: {
                user: {
                    select: {
                        id: true,
                        emailVerifiedAt: true,
                        isEmailVerified: true,
                        isPhoneVerified: true,
                        phoneVerifiedAt: true
                    }
                }
            }
        })

        if (!verification) {
            throw new ResponseError(400, "Invalid token")
        }
        if (verification.usedAt) {
            throw new ResponseError(409, "Token already used")
        }
        if (verification.expiresAt < new Date()) {
            throw new ResponseError(410, "Token expired")
        }
        if (verification.user.emailVerifiedAt && verification.user.isEmailVerified === true) {
            throw new ResponseError(409, "User already verified")
        }

        const [updatedUser] = await prismaClient.$transaction([
            prismaClient.user.update({
                where: { 
                    id: verification.userId 
                },
                data: { 
                    emailVerifiedAt: new Date(),
                    isEmailVerified: true,
                    status: verification.user.isPhoneVerified === true && verification.user.phoneVerifiedAt ? "ACTIVE" : "PENDING_VERIFICATION"
                }
            }),
            prismaClient.emailVerification.update({
                where: { 
                    token: validate.token 
                },
                data: { 
                    usedAt: new Date() 
                }
            })
        ])

        return toVerifyEmailResponse(updatedUser)
    }
}