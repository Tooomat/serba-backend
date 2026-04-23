import { z } from 'zod'

export class PhoneVerificationValidation {
    static readonly SEND_SCHEMA = z.object({
        phone: z
            .string()
            .min(1, "Phone number is required")
            .transform((val) => val.trim().replace(/[\s\-]/g, ""))
            .refine(
                (val) => val.startsWith("+62"),
                { message: "Phone number must start with +62" }
            )
            .refine(
                (val) => /^\+62\d{9,12}$/.test(val),
                { message: "Phone number must have 9-12 digits after +62" }
            ),
    })

    static readonly VERIFY_SCHEMA = z.object({
        otp: z
            .string()
            .length(6, "OTP must be 6 digits")
            .regex(/^\d{6}$/, "OTP must be numeric")
    })
}