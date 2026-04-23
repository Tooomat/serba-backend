import { randomInt } from "crypto"
import { prismaClient } from "../application/database"
import { ResponseError } from "../error/service-response.error"
import { MAX_ATTEMPTS, sendOtpRequest, sendOtpResponse, toSendOtpResponse, toVerifyOtpResponse, verifyOtpRequest, verifyOtpResponse } from "../model/phone-verifications.model"
import { PhoneVerificationValidation } from "../validation/phone-verifications.validation"
import { Validation } from "../validation/validation"

const RESEND_WINDOW_MS = 2 * 60 * 1000      // 2 menit 
const TOKEN_EXPIRES_MS = 5 * 60 * 1000      // 5 menit

export class PhoneVerificationService{
    static async send(userId: string, req: sendOtpRequest): Promise<sendOtpResponse> {
        const validation = Validation.validate(PhoneVerificationValidation.SEND_SCHEMA, req)

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                phone: true,
                isPhoneVerified: true,
                phoneVerifiedAt: true
            }
        })

        if (!user) {
            throw new ResponseError(404, "User not found")
        }

        if (user.isPhoneVerified && user.phoneVerifiedAt) {
            throw new ResponseError(409, "Phone already verified")
        }

        // Email register — phone sudah ada di DB, validasi harus cocok
        if (user.phone && validation.phone && validation.phone !== user.phone) {
            throw new ResponseError(400, "Phone number does not match our records")
        }

        const { otpVerif, otp, expiresAt } = await prismaClient.$transaction(async (tx) => {
            const lastVerification = await tx.phoneVerification.findFirst({
                where: {
                    userId: user.id
                },
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    createdAt: true
                }
            })

            if (lastVerification) {
                const nextAllowedTime = lastVerification.createdAt.getTime() + RESEND_WINDOW_MS

                if (Date.now() < nextAllowedTime) {
                    const retryAfter = Math.max(1, Math.ceil((nextAllowedTime - Date.now()) / 1000))
                    throw new ResponseError(429, "Please wait before requesting again", retryAfter)
                }
            }

            // Google OAuth — update phone kalau berbeda atau belum ada
            if (validation.phone && !user.phone) {
                await tx.user.update({
                    where: {
                        id: user.id 
                    },
                    data: { 
                        phone: validation.phone 
                    }
                })
            }

            await tx.phoneVerification.deleteMany({
                where: {
                    userId: user.id,
                    usedAt: null
                }
            })

            const otp = randomInt(100000, 999999).toString() // 6 digit
            const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_MS)
            
            const otpVerif = await tx.phoneVerification.create({
                data: {
                    otp: otp,
                    expiresAt: expiresAt,
                    userId: user.id
                }
            })

            return { otpVerif, otp, expiresAt }
        }, {
            isolationLevel: 'Serializable'
        })

        // await enqueueWhatsapp({
        //     id: otpVerif.id,
        //     to: phoneToUse,
        //     message: whatsappTemplate.otp(otp)
        // })

        return toSendOtpResponse(validation.phone, expiresAt)
    }

    static async verify(userId: string, req: verifyOtpRequest): Promise<verifyOtpResponse> {
        const validation = Validation.validate(PhoneVerificationValidation.VERIFY_SCHEMA, req)

        const verification = await prismaClient.phoneVerification.findFirst({
            where: {
                userId: userId,
                usedAt: null
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        isEmailVerified: true,
                        emailVerifiedAt: true,
                        isPhoneVerified: true,
                        phoneVerifiedAt: true,
                        birthDate: true
                    }
                }
            }
        })

        if (!verification) {
            throw new ResponseError(400, "Invalid or expired OTP")
        }
        if (verification.expiresAt < new Date()) {
            throw new ResponseError(400, "Invalid or expired OTP")
        }
        if (verification.user.isPhoneVerified && verification.user.phoneVerifiedAt) {
            throw new ResponseError(409, "Phone already verified")
        }
        // Cek attempts — increment dulu sebelum validasi OTP
        if (verification.attemps >= MAX_ATTEMPTS) {
            throw new ResponseError(400, "Invalid or expired OTP")
        }

        // OTP salah — increment attempts
        if (verification.otp !== validation.otp) {
            await prismaClient.phoneVerification.update({
                where: { 
                    id: verification.id 
                },
                data: { 
                    attemps: { increment: 1 } 
                }
            })

            const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (verification.attemps + 1))
            throw new ResponseError(400, "Invalid OTP", remainingAttempts)
        }

        // OTP benar — update user + mark OTP as used
         const [updatedUser] = await prismaClient.$transaction([
            prismaClient.user.update({
                where: {
                    id: verification.userId
                },
                data: {
                    phoneVerifiedAt: new Date(),
                    isPhoneVerified: true,
                    status: verification.user.isEmailVerified === true && verification.user.emailVerifiedAt 
                        ? "ACTIVE" 
                        : "PENDING_VERIFICATION",
                    isProfileComplete: verification.user.birthDate ? true : false
                }
            }),

            prismaClient.phoneVerification.update({
                where: {
                    id: verification.id,
                },
                data: {
                    usedAt: new Date()
                },
                select: {
                    id: true,
                }
            })
        ])

        return toVerifyOtpResponse(updatedUser)
    }
}