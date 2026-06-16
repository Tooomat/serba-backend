import { z } from 'zod'

export class EmailVerificationValidation {
    static readonly SEND_SCHEMA = z.object({
        email: z
            .string()
            .email("Invalid email format")
            .min(1, "Email is required")
    })
    static readonly VERIFY_SCHEMA = z.object({
        token: z
            .string()
            .min(1, "Token is required")
    })
}

export type SendRequest = z.infer<typeof EmailVerificationValidation.SEND_SCHEMA>
export type VerifyRequest = z.infer<typeof EmailVerificationValidation.VERIFY_SCHEMA>